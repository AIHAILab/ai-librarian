from typing import Any

from pydantic import BaseModel, Field


class ToolArg(BaseModel):
    """The arguments schema of the tool."""

    arg: str = Field(description="The name of the argument.")
    type: str = Field(description="The type of the argument.")
    description: str | None = Field(description="The description of the argument.")
    required: bool = Field(description="Whether the arguments are required.")
    description: str | None = Field(description="The description of the arguments.")


class ToolInfo(BaseModel):
    """eturns the name and description of the tool."""

    name: str = Field(description="The name of the tool.")
    description: str = Field(description="The description of the tool.")
    args_schema: list[ToolArg] = Field(description="The JSON schema of the arguments for the tool.")


class ToolListResponse(BaseModel):
    """Returns the list of available tools info with their names and descriptions."""

    tools: list[ToolInfo] = Field(
        description="The list of available tools info with their names and descriptions.",
        examples=[
            ToolInfo(
                name="google_search",
                description="Search the web for information.",
                args_schema=[
                    ToolArg(arg="query", type="string", description="The query to search for.", required=True)
                ],
            )
        ],
    )


class ToolRunArg(BaseModel):
    """The argument of the tool."""

    name: str = Field(description="The name of the argument.")
    value: Any = Field(description="The value of the argument.")


class ToolRunRequest(BaseModel):
    """The input of the tool."""

    tool_name: str = Field(description="The name of the tool.", examples=["google_search"])
    args: list[ToolRunArg] = Field(
        description="The arguments of the tool.", examples=[[ToolRunArg(name="query", value="Python")]]
    )


class ToolRunResponse(BaseModel):
    """Returns the result of running a tool.
    The result is a dictionary with the following keys:
    - "output": The output of the tool.
    - "tool_name": The name of the tool.
    - "args": The arguments of the tool.
    """

    tool_name: str = Field(description="The name of the tool.", examples=["google_search"])
    args: list[ToolRunArg] = Field(
        description="The arguments of the tool.", examples=[[ToolRunArg(name="query", value="Python")]]
    )
    output: str = Field(
        description="The output of the tool.",
        examples=[
            "Python is a programming language that lets you work quickly and integrate systems more effectively. "
            "Learn More Well organized and easy to understand Web building tutorials with lots of examples of "
            "how to use HTML, CSS, JavaScript, SQL, Python, PHP, Bootstrap, Java, ... Download the latest version "
            "of Python. Download Python 3.13.5. Looking for Python with a different OS? Python for Windows, "
            "Linux/Unix, macOS, other. r/Python: The official Python community for Reddit! Stay up to date with "
            "the latest news, packages, and meta information relating to the Python programming ... Active Python "
            "Releases ... For more information visit the Python Developer's Guide. Python version Maintenance "
            "status First released End of support Release ... Python is a high-level, general-purpose programming "
            "language. Its design philosophy emphasizes code readability with the use of significant indentation. "
            "This is the official documentation for Python 3.13.5. Documentation sections: What's new in Python "
            "3.13? Or all \"What's new\" documents since Python 2.0. A Visual Studio Code extension with rich "
            "support for the Python language (for all actively supported Python versions), providing access points "
            "for extensions. Apr 4, 2025 ... This document gives coding conventions for the Python code comprising "
            "the standard library in the main Python distribution. Apr 30, 2000 ... The long-term usefulness of a "
            "language comes not in its ability to support clever hacks, but from how well and how unobtrusively "
            "it supports the day-to-day ..."
        ],
    )
