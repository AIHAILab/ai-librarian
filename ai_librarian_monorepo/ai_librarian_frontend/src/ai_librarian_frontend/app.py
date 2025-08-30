import json

import chainlit as cl
import httpx
from chainlit.input_widget import Select, Slider

API_URL = "http://localhost:8000"


@cl.set_starters
async def set_starters():
    return [
        cl.Starter(
            label="幫我推薦一些烹飪食譜",
            message="幫我推薦一些烹飪食譜",
            icon="/public/favicon.svg",
        ),
        cl.Starter(
            label="我想要找關於大型語言模型的論文",
            message="我想要找關於大型語言模型的論文",
            icon="/public/favicon.svg",
        ),
        cl.Starter(
            label="失智症該如何預防",
            message="失智症該如何預防，推薦一些 Google books 平台可以線上閱讀的書籍",
            icon="/public/favicon.svg",
        ),
    ]


@cl.on_chat_start
async def start():
    settings = await cl.ChatSettings(
        [
            Select(
                id="LLM",
                label="LLM",
                values=["gpt-4o-mini"],
                initial_index=0,
            ),
            Slider(
                id="Temperature",
                label="Temperature",
                initial=1,
                min=0,
                max=2,
                step=0.1,
                description="控制大型語言模型的隨機性，較高的值會使輸出更隨機，較低的值會使輸出更穩定。",
            ),
            Slider(
                id="Max_Tokens",
                label="Max_Tokens",
                initial=2000,
                min=500,
                max=10000,
                step=100,
                description="控制大型語言模型每次輸出的最大 token 上限。",
            ),
        ]
    ).send()

    cl.user_session.set("settings", settings)


@cl.on_message
async def on_message(message: cl.Message):
    settings = cl.user_session.get("settings")

    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            API_URL + "/v1/react/stream",
            headers={"accept": "text/event-stream", "Content-Type": "application/json"},
            json={
                "thread_id": "some_thread_id",
                "messages": [
                    {
                        "content": (
                            "你是AI圖書助手，擅長從各個資料來源查找符合使用者需求的圖書資料，"
                            "請你盡可能的提供多個資料來源的資訊，並且站在使用者角度提供詳細的說明，以提供使用者最完整的資訊。"
                        ),
                        "role": "system",
                    },
                    {"content": message.content, "role": "user"},
                ],
                "llm_config": {
                    "model": f"openai:{settings['LLM']}",
                    "temperature": settings["Temperature"],
                    "max_tokens": settings["Max_Tokens"],
                },
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
