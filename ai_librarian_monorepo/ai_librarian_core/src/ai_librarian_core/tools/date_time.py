from datetime import UTC, datetime

from langchain_core.tools import BaseTool
from pydantic import BaseModel


class DateTimeInput(BaseModel):
    pass


class DateTimeTool(BaseTool):
    """A tool for getting the current date and time.

    This tool returns the current date and time in ISO 8601 format, including timezone information.
    The time is first obtained in UTC and then converted to the local timezone.

    Attributes:
        name(str): The name of the tool used for identification.
        description(str): A brief description of what the tool does.

    Returns:
        str: A string containing the current time in ISO 8601 format.
            Example: "The current time is 2024-01-20T08:30:45.123456+08:00"
    """

    name: str = "date_time"
    description: str = "A tool that returns the current date and time in ISO 8601 format."
    args_schema: type[BaseModel] = DateTimeInput

    def _run(self) -> str:
        local_time = datetime.now(UTC).astimezone()
        local_time_str = local_time.isoformat()
        return f"The current time is {local_time_str}"

    async def _arun(self) -> str:
        return self._run()
