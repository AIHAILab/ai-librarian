import json
import re

from ai_librarian_core.models.llm_config import LLMConfig
from ai_librarian_core.utils.uuid import get_thread_id

DEFAULT_MESSAGE_EXAMPLE = "The current temperature in Taipei is approximately 28.86°C."

DEFAULT_TOOL_NAME_EXAMPLE = "open_weather_map"

DEFAULT_TOOL_OUTPUT_EXAMPLE = """The current weather in Taipei is:

- **Condition**: Overcast clouds
- **Temperature**: 28.86°C (feels like 30.51°C)
- **Humidity**: 65%
- **Wind Speed**: 0.47 m/s (from the southwest)
- **Cloud Cover**: 100%

Overall, it is a warm and humid day with full cloud coverage.
"""


def fake_tokenize(text: str) -> list[str]:
    matches = re.findall(r"\s+|[^\w\s]+|\w+", text)

    result = []
    last_match = ""

    for match in matches:
        if re.match(r"\s+|[^\w\s]+", match):
            last_match += match
        else:
            result.append(last_match + match)
            last_match = ""

    if last_match:
        result.append(last_match)
    return result


def get_sse_response_example(
    thread_id: str = get_thread_id(),
    message: str = DEFAULT_MESSAGE_EXAMPLE,
    tool_name: str = DEFAULT_TOOL_NAME_EXAMPLE,
    tool_output: str = DEFAULT_TOOL_OUTPUT_EXAMPLE,
    llm_config: LLMConfig = LLMConfig(),
) -> str:
    llm_config_str = llm_config.model_dump_json()
    tool_chosen_data = {
        "thread_id": thread_id,
        "used_tools": {"name": tool_name, "output": ""},
        "llm_config": llm_config_str,
    }
    tool_output_data = {
        "thread_id": thread_id,
        "used_tools": {"name": tool_name, "output": tool_output},
        "llm_config": llm_config_str,
    }

    example_result = ""

    example_result += "event: tool_chosen\n"
    example_result += f"data: {json.dumps(tool_chosen_data)}\n\n"
    example_result += "event: tool_output\n"
    example_result += f"data: {json.dumps(tool_output_data)}\n\n"

    tokens = fake_tokenize(message)

    example_result += "event: llm_start\n"
    example_result += (
        f'data: {{"thread_id":{thread_id},"message_chunk":"{tokens[0]}","llm_config":{llm_config_str}}}\n\n'
    )

    for i in range(1, len(tokens)):
        example_result += "event: llm_delta\n"
        example_result += (
            f'data: {{"thread_id":{thread_id},"message_chunk":"{tokens[i]}","llm_config":{llm_config_str}}}\n\n'
        )
    example_result += "event: llm_end\n"
    example_result += f'data: {{"thread_id":{thread_id},"message_chunk":"","llm_config":{llm_config_str}}}\n\n'
    return example_result
