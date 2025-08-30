from __future__ import annotations

from pydantic import BaseModel, Field


class Tool(BaseModel):
    """Tool schema. Returns the name and description of a tool."""

    tool_name: str = Field(..., description="The name of the tool.", examples=["get_temperature"])
    tool_description: str = Field(
        ...,
        description="The description of the tool.",
        examples=["Get the temperature in a given location"],
    )


class UsedTool(BaseModel):
    """Record of an external tool usage by the LLM during response generation.

    Captures both the tool name and its output result.
    """

    name: str = Field(
        description="The identifier name of the external tool or API that was called during processing",
        examples=["get_temperature"],
    )
    output: str | None = Field(
        description="The result or response returned by the external tool when it was called",
        examples=["The temperature in Tokyo is 20°C"],
    )
