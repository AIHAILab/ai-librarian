from ai_librarian_core.tools.date_time import DateTimeTool
from ai_librarian_core.tools.google_books import GoogleBooksQueryRun
from ai_librarian_core.tools.google_search import SchemaedGoogleSearchRun
from ai_librarian_core.tools.ncl_search import NCLSearchRun
from ai_librarian_core.tools.open_weather_map import SchemaedOpenWeatherMapQueryRun
from ai_librarian_core.tools.youtube import SchemaedYouTubeSearchTool
from langchain_community.tools import (
    ArxivQueryRun,
    DuckDuckGoSearchResults,
)
from langchain_community.tools.wikipedia.tool import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_core.tools import BaseTool
from langchain_google_community import GoogleSearchAPIWrapper
from pydantic import ValidationError


def get_built_in_tools() -> list[BaseTool]:
    tools = [
        DateTimeTool(),
        ArxivQueryRun(),
        DuckDuckGoSearchResults(),
        SchemaedYouTubeSearchTool(),
        NCLSearchRun(),
        WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper()),
    ]

    try:
        tools.append(SchemaedGoogleSearchRun(api_wrapper=GoogleSearchAPIWrapper()))
    except ValidationError:
        pass
    try:
        tools.append(GoogleBooksQueryRun())
    except ValidationError:
        pass
    try:
        tools.append(SchemaedOpenWeatherMapQueryRun())
    except ValidationError:
        pass

    return tools
