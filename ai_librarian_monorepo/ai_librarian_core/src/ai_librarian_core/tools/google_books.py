from ai_librarian_core.wrapper.google_books import GoogleBooksAPIWrapper
from langchain_core.callbacks import CallbackManagerForToolRun
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field


class GoogleBooksQueryInput(BaseModel):
    query: str = Field(description="query to look up on google books")


class GoogleBooksQueryRun(BaseTool):
    """Tool that searches the Google Books API.

    This tool provides an interface to search books using the Google Books API.
    It can be used to find books on specific topics and generate recommendations
    based on keywords.

    Attributes:
        name (str): Name of the tool, set to "google_books"
        description (str): Description of the tool's functionality
        api_wrapper (GoogleBooksAPIWrapper): Wrapper instance for Google Books API
        args_schema (type[BaseModel]): Schema for input validation

    Example:
        >>> tool = GoogleBooksQueryRun(api_wrapper=GoogleBooksAPIWrapper(google_api_key="your_google_api_key"))
        >>> result = tool.invoke({"query": "python"})
        >>> print(result)
        Here are 5 suggestions for books related to Python Programming:
        1. "Python Crash Course" by Eric Matthes: A hands-on guide...
        ...
    """

    name: str = "google_books"
    description: str = (
        "A tool that searches the Google Books API. "
        "Useful for when you need to answer general inquiries about "
        "books of certain topics and generate recommendation based "
        "off of key words"
        "Input should be a query string"
    )
    api_wrapper: GoogleBooksAPIWrapper = Field(default_factory=GoogleBooksAPIWrapper)
    args_schema: type[BaseModel] = GoogleBooksQueryInput

    def _run(
        self,
        query: str,
        run_manager: CallbackManagerForToolRun | None = None,
    ) -> str:
        """Use the Google Books tool."""
        return self.api_wrapper.run(query)
