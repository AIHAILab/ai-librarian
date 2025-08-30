from __future__ import annotations

from enum import Enum

from ai_librarian_core.models.llm_config import LLMConfig, Model
from ai_librarian_core.models.used_tool import UsedTool
from ai_librarian_core.utils.uuid import get_thread_id
from langchain.chat_models import init_chat_model
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from pydantic import BaseModel, Field


class FlowchartResponse(BaseModel):
    """Flowchart response schema. Returns the flowchart of the ReAct Agent."""

    mermaid: str = Field(
        ...,
        description="The flowchart of the ReAct Agent.",
    )


class ModelResponse(BaseModel):
    """Model response schema. Returns the list of available models."""

    models: list[Model] = Field(
        ...,
        description="The list of available models.",
        examples=[Model.list()],
    )


class Tool(BaseModel):
    """Tool schema. Returns the name and description of a tool."""

    tool_name: str = Field(..., description="The name of the tool.", examples=["get_temperature"])
    tool_description: str = Field(
        ...,
        description="The description of the tool.",
        examples=["Get the temperature in a given location"],
    )


class ToolResponse(BaseModel):
    """Tool response schema. Returns the list of available tools."""

    tools: list[Tool] = Field(
        ...,
        description="The list of available tools.",
        examples=[
            Tool(
                tool_name="get_temperature",
                tool_description="Get the temperature in a given location",
            )
        ],
    )


class Role(str, Enum):
    """Enumeration of possible message roles in a conversation.
    Follows the OpenAI chat completion API convention.
    """

    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class OpenAIMessage(BaseModel):
    """OpenAI style message schema following the chat completion API format.
    Used to structure conversation messages between system, user, and assistant.
    """

    role: Role = Field(
        ...,
        description=(
            "The role of the message sender (system, user, or assistant). "
            "Determines how the message is processed and displayed."
        ),
        examples=[Role.ASSISTANT],
    )
    content: str = Field(
        ...,
        description=(
            "The actual message content or prompt text. Contains the information being exchanged in the conversation."
        ),
        examples=["Hello, who are you?"],
    )

    @classmethod
    def from_langchain_message(cls, message: BaseMessage) -> OpenAIMessage:
        if isinstance(message, SystemMessage):
            return cls(role=Role.SYSTEM, content=message.content)
        elif isinstance(message, AIMessage):
            return cls(role=Role.ASSISTANT, content=message.content)
        elif isinstance(message, HumanMessage):
            return cls(role=Role.USER, content=message.content)
        else:
            raise ValueError(f"Unknown message type: {type(message)}")


class AgentRequest(BaseModel):
    """Chat request schema defining the structure of incoming chat API requests.
    Contains all parameters needed to process a conversation with the Agent.
    """

    thread_id: str | None = Field(
        default_factory=get_thread_id,
        examples=["thread-ab586827-8c7c-4bf9-a6c9-fea58f43f5fc"],
        description=(
            "Unique identifier to track and maintain conversation state. "
            "If provided, subsequent requests will continue on this specified thread (with memory). "
            "If not provided, a new conversation thread will be created automatically."
        ),
    )
    messages: list[OpenAIMessage] = Field(
        description=(
            "Array of OpenAI style messages between user, assistant and system used to generate a contextual response. "
            "Can include multiple sequential messages to maintain conversation history."
        ),
        examples=[
            [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "What is the temperature in Taipei today?"},
            ]
        ],
    )
    llm_config: LLMConfig | None = Field(
        default_factory=LLMConfig,
        description=(
            "Configuration settings for the LLM processing the request. "
            "Controls model selection and generation parameters."
        ),
    )

    def get_langchain_messages(self) -> list[BaseMessage]:
        langchain_messages = []
        for openai_message in self.messages:
            if openai_message.role == Role.SYSTEM:
                langchain_messages.append(SystemMessage(openai_message.content))
            elif openai_message.role == Role.ASSISTANT:
                langchain_messages.append(AIMessage(openai_message.content))
            else:
                langchain_messages.append(HumanMessage(openai_message.content))
        return langchain_messages

    def get_runnable_config(self) -> dict:
        return {"configurable": {"thread_id": self.thread_id}}

    def init_model(self) -> BaseChatModel:
        return init_chat_model(**self.llm_config.model_dump(exclude_none=True))


class AgentResponse(BaseModel):
    """Agent response schema defining the structure of outgoing agent API responses.
    Contains the generated message and metadata about the interaction.
    """

    thread_id: str = Field(
        ...,
        description=(
            "Unique identifier of the conversation thread. "
            "Can be supplied in subsequent requests to continue this conversation context."
        ),
        examples=[get_thread_id()],
    )
    llm_config: LLMConfig = Field(
        ...,
        description=(
            "Configuration settings for the Large Language Model processing the request. "
            "Controls model selection and generation parameters."
        ),
        examples=[LLMConfig()],
    )
    messages: list[OpenAIMessage] = Field(
        ...,
        description=(
            "Array of messages generated by the LLM in response to the request. "
            "Usually contains one assistant response message."
        ),
        examples=[
            [
                {
                    "role": "assistant",
                    "content": "The weather in Tokyo is sunny and warm.",
                }
            ]
        ],
    )
    used_tools: list[UsedTool] = Field(
        default_factory=list,
        description=(
            "Array of external tools or APIs that were called by the Agent during response generation. "
            "Empty if no tools were used."
        ),
        examples=[
            [
                UsedTool(name="get_temperature", output="The temperature in Tokyo is 20°C"),
                UsedTool(name="get_humidity", output="The humidity in Tokyo is 50%"),
            ]
        ],
    )
