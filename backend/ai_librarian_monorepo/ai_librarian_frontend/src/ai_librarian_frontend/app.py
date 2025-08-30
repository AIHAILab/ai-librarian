import json

import chainlit as cl
import httpx
from chainlit.input_widget import Select, Slider, Switch

API_URL = "http://localhost:8000"


@cl.set_starters
async def set_starters():
    return [
        cl.Starter(
            label="天氣",
            message="請問今天的天氣?",
            icon="/public/favicon.svg",
        ),
        cl.Starter(
            label="國圖",
            message="請幫我在國圖找關於python的書",
            icon="/public/favicon.svg",
        ),
        cl.Starter(
            label="新聞",
            message="今天有哪些新聞?",
            icon="/public/favicon.svg",
        ),
        cl.Starter(
            label="Text inviting friend to wedding",
            message="Write a text asking a friend to be my plus-one at a wedding next month. I want to keep it super short and casual, and offer an out.",
            icon="/public/favicon.svg",
        ),
    ]


@cl.on_chat_start
async def start():
    settings = await cl.ChatSettings( # noqa
        [
            Select(
                id="Model",
                label="OpenAI - Model",
                values=["gpt-3.5-turbo", "gpt-3.5-turbo-16k", "gpt-4", "gpt-4-32k"],
                initial_index=0,
            ),
            Switch(id="Streaming", label="OpenAI - Stream Tokens", initial=True),
            Slider(
                id="Temperature",
                label="Temperature",
                initial=1,
                min=0,
                max=2,
                step=0.1,
                description="Controls randomness of outputs. Higher values make output more random, lower values make output more deterministic.",
            ),
            Slider(
                id="Max_Tokens",
                label="Max_Tokens",
                initial=2000,
                min=500,
                max=10000,
                step=100,
                description="Maximum number of tokens to generate in the response.",
            ),
        ]
    ).send()


@cl.on_message
async def on_message(message: cl.Message):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            API_URL + "/v1/react/stream",
            headers={"accept": "text/event-stream", "Content-Type": "application/json"},
            json={
                "thread_id": "some_thread_id",
                "messages": [
                    {"content": "You are a helpful assistant.", "role": "system"},
                    {"content": message.content, "role": "user"},
                ],
                "llm_config": {"model": "openai:gpt-4o-mini", "temperature": 1, "max_tokens": 2000},
            },
            timeout=None,
        ) as response:
            response.raise_for_status()
            msg = cl.Message(content="")
            async for line in response.aiter_lines():
                if line.startswith("event:"):
                    event_type = line.split(":", 1)[1].strip()
                    continue
                elif line.startswith("data:"):
                    try:
                        json_data = json.loads(line[len("data:") :].strip())
                        if event_type in {"llm_start", "llm_delta"}:
                            if "message_chunk" in json_data:
                                await msg.stream_token(json_data["message_chunk"])
                        elif event_type == "tool_output":
                            tool_name = json_data["used_tools"]["name"]
                            tool_output = json_data["used_tools"]["output"]
                            async with cl.Step(name=tool_name) as step:
                                step.output = tool_output
                    except json.JSONDecodeError:
                        print(f"Could not decode JSON: {line}")
                    except Exception as e:
                        print(f"Error processing SSE data: {e} for line: {line}")


@cl.on_chat_start
async def main():
    async with cl.Step(name="Parent step") as parent_step:
        parent_step.input = "Parent step input"

        async with cl.Step(name="Child step") as child_step:
            child_step.input = "Child step input"
            child_step.output = "Child step output"

        parent_step.output = "Parent step output"
