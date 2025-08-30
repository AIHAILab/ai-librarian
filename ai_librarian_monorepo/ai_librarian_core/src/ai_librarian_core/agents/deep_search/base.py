from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from ai_librarian_core.agents.react.state import MessagesState
from ai_librarian_core.models.llm_config import LLMConfig
from langchain.chat_models import init_chat_model
from langchain.chat_models.base import BaseChatModel
from langchain_core.tools import BaseTool
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph.state import CompiledStateGraph


class DeepSearchAgentError(Exception):
    pass


class InvalidChatModelError(DeepSearchAgentError):
    pass


class ChatModelImportError(DeepSearchAgentError):
    pass


class MissingAIMessageError(DeepSearchAgentError):
    pass


@dataclass
class BaseDeepSearchAgent(ABC):
    tools: list[BaseTool]
    name: str = "deep_search_agent"
    checkpointer: BaseCheckpointSaver = InMemorySaver()

    @property
    @abstractmethod
    def workflow(self) -> CompiledStateGraph:
        raise NotImplementedError("Subclasses must implement this method.")

    def __post_init__(self):
        self._llm_cache: dict[LLMConfig, BaseChatModel] = {}
        self.state_schema: MessagesState = MessagesState

    def _init_llm(self, llm_config: LLMConfig) -> BaseChatModel:
        if llm_config in self._llm_cache:
            return self._llm_cache[llm_config]

        try:
            llm = init_chat_model(
                model=llm_config.model,
                temperature=llm_config.temperature,
                max_tokens=llm_config.max_tokens,
            )
            llm_with_tools = llm.bind_tools(self.tools)
            self._llm_cache[llm_config] = llm_with_tools
            return llm_with_tools
        except ValueError as e:
            raise InvalidChatModelError("Model_provider cannot be inferred or isn’t supported.") from e
        except ImportError as e:
            raise ChatModelImportError("Model provider integration package is not installed.") from e
        except Exception as e:
            raise DeepSearchAgentError("An unexpected error occurred while trying to initialize the chat model.") from e

    @abstractmethod
    def _init_workflow(self) -> CompiledStateGraph:
        raise NotImplementedError("Subclasses must implement this method.")

    @abstractmethod
    def run(self) -> Any:
        raise NotImplementedError("Subclasses must implement this method.")

    @abstractmethod
    def stream(self) -> Any:
        raise NotImplementedError("Subclasses must implement this method.")
