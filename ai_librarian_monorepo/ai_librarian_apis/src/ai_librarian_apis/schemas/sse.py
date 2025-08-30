from enum import StrEnum, auto
from typing import Any

from ai_librarian_core.models.used_tool import UsedTool
from pydantic import BaseModel, model_serializer


class EventPayload(StrEnum):
    TOOL_OUTPUT = auto()
    TOOL_CHOSEN = auto()
    LLM_START = auto()
    LLM_DELTA = auto()
    LLM_END = auto()


class BaseDataPayload(BaseModel):
    thread_id: str
    llm_config: dict


class ToolPayload(BaseDataPayload):
    used_tools: UsedTool

    @model_serializer(when_used="json")
    def serialize_model(self) -> dict[str, Any]:
        ordered_data = {}
        ordered_data["thread_id"] = self.thread_id
        ordered_data["used_tools"] = self.used_tools
        ordered_data["llm_config"] = self.llm_config
        return ordered_data


class LLMChunkPayload(BaseDataPayload):
    message_chunk: str

    @model_serializer(when_used="json")
    def serialize_model(self) -> dict[str, Any]:
        ordered_data = {}
        ordered_data["thread_id"] = self.thread_id
        ordered_data["message_chunk"] = self.message_chunk
        ordered_data["llm_config"] = self.llm_config
        return ordered_data


class SSEEvent(BaseModel):
    event: EventPayload
    data: BaseDataPayload

    def to_sse_format(self) -> str:
        return f"event: {self.event}\ndata: {self.data.model_dump_json()}\n\n"
