from ai_librarian_apis.core.global_vars import react_agent
from ai_librarian_apis.core.logger import logger
from ai_librarian_apis.schemas.error import ErrorResponse
from ai_librarian_apis.schemas.react import AgentRequest, AgentResponse, FlowchartResponse, ModelResponse, OpenAIMessage
from ai_librarian_apis.schemas.sse import EventPayload, LLMChunkPayload, SSEEvent, ToolPayload
from ai_librarian_apis.utils.sse_example import get_sse_response_example
from ai_librarian_core.models.llm_config import Model
from ai_librarian_core.models.used_tool import UsedTool
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, ToolMessage

react_router = APIRouter(prefix="/react", tags=["ReAct Agent"])


@react_router.get(
    "/models",
    description=(
        "Retrieves a list of the LLMs currently configured and available "
        "for use with the agent endpoints (`/run` and `/stream`)."
    ),
    summary="List all available models",
    responses={500: {"model": ErrorResponse}},
)
def get_models() -> ModelResponse:
    return ModelResponse(models=list(Model))


@react_router.get(
    "/flowchart",
    description="Retrieves the flowchart of the ReAct Agent in Mermaid format.",
    summary="Retrieve the flowchart of the Agent",
    responses={500: {"model": ErrorResponse}},
)
def get_flowchart() -> FlowchartResponse:
    return FlowchartResponse(mermaid=react_agent.plot())


@react_router.post(
    "/run",
    description=(
        "Runs the ReAct Agent with the given request. "
        "The request should be a list of OpenAI style messages between user, assistant and system. "
        "A thread id can be provided to continue a conversation on a specific thread. "
        "If not provided, a new conversation thread will be created automatically."
    ),
    summary="Run the ReAct Agent",
    responses={500: {"model": ErrorResponse}},
)
async def run_react_agent(request: AgentRequest) -> AgentResponse:
    message, used_tools = await react_agent.run(
        request.get_langchain_messages(),
        thread_id=request.thread_id,
        llm_config=request.llm_config,
    )
    return AgentResponse(
        thread_id=request.thread_id,
        llm_config=request.llm_config,
        messages=[OpenAIMessage.from_langchain_message(message)],
        used_tools=used_tools,
    )


def _process_tool_message(message: ToolMessage, thread_id: str, llm_config: dict) -> str:
    return SSEEvent(
        event=EventPayload.TOOL_OUTPUT,
        data=ToolPayload(
            thread_id=thread_id, llm_config=llm_config, used_tools=UsedTool(name=message.name, output=message.content)
        ),
    ).to_sse_format()


def _process_ai_message(
    message: AIMessage, thread_id: str, llm_config: dict, has_llm_started: bool
) -> tuple[str, bool] | None:
    if message.tool_calls and (tool_name := message.tool_calls[0].get("name")):
        event = SSEEvent(
            event=EventPayload.TOOL_CHOSEN,
            data=ToolPayload(
                thread_id=thread_id,
                llm_config=llm_config,
                used_tools=UsedTool(name=tool_name, output=message.content),
            ),
        )
        return event.to_sse_format(), has_llm_started
    elif message.content:
        if has_llm_started:
            event = SSEEvent(
                event=EventPayload.LLM_DELTA,
                data=LLMChunkPayload(
                    thread_id=thread_id,
                    llm_config=llm_config,
                    message_chunk=message.content,
                ),
            )
            return event.to_sse_format(), True
        else:
            event = SSEEvent(
                event=EventPayload.LLM_START,
                data=LLMChunkPayload(
                    thread_id=thread_id,
                    llm_config=llm_config,
                    message_chunk=message.content,
                ),
            )
            return event.to_sse_format(), True
    elif message.response_metadata.get("finish_reason") == "stop":
        event = SSEEvent(
            event=EventPayload.LLM_END,
            data=LLMChunkPayload(
                thread_id=thread_id,
                llm_config=llm_config,
                message_chunk=message.content,
            ),
        )
        return event.to_sse_format(), False
    return None


@react_router.post(
    "/stream",
    description=(
        "Streams the ReAct Agent's response. "
        "The request should be a list of OpenAI style messages between user, assistant and system. "
        "A thread id can be provided to continue a conversation on a specific thread. "
        "If not provided, a new conversation thread will be created automatically. "
        "Note that Swagger UI does not support SSE demo, it is recommended to use Postman to test this endpoint."
    ),
    summary="Stream the ReAct Agent",
    responses={
        200: {
            "content": {
                "text/event-stream": {
                    "schema": {
                        "type": "string",
                        "format": "binary",
                        "description": "A stream of server-sent events (SSE).",
                    },
                    "examples": {"example1": {"summary": "Example SSE stream", "value": get_sse_response_example()}},
                }
            },
            "description": "Stream data using Server-Sent Events.",
        },
        500: {"model": ErrorResponse},
    },
)
async def stream_react_agent(agent_request: AgentRequest, request: Request):
    # TODO(youkwan): Add heartbeat.
    async def stream_chunk():
        has_llm_started = False
        stream = await react_agent.stream(
            agent_request.get_langchain_messages(),
            thread_id=agent_request.thread_id,
            llm_config=agent_request.llm_config,
        )
        async for chunk in stream:
            if await request.is_disconnected():
                logger.info("Client disconnected.")
                break

            message = chunk[0]
            llm_config_dict = agent_request.llm_config.model_dump(mode="json")

            if isinstance(message, ToolMessage):
                yield _process_tool_message(message, agent_request.thread_id, llm_config_dict)
            elif isinstance(message, AIMessage):
                result = _process_ai_message(message, agent_request.thread_id, llm_config_dict, has_llm_started)
                if result:
                    event_str, has_llm_started = result
                    yield event_str

    return StreamingResponse(
        stream_chunk(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache"},
    )
