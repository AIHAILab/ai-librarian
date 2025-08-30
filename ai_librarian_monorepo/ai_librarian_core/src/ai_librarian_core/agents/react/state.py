from typing import Annotated

from ai_librarian_core.models.llm_config import LLMConfig
from ai_librarian_core.models.used_tool import UsedTool
from langchain_core.messages import BaseMessage
from langgraph.graph import add_messages
from pydantic import BaseModel, Field


class MessagesState(BaseModel):
    messages: Annotated[list[BaseMessage], add_messages] = Field(default_factory=list)
    llm_config: LLMConfig = Field(default_factory=LLMConfig)
    used_tools: list[UsedTool] = Field(default_factory=list)
