from langchain_community.tools import YouTubeSearchTool
from pydantic import BaseModel, Field


class YouTubeSearchInput(BaseModel):
    query: str = Field(description="The query to search for on YouTube.")

class SchemaedYouTubeSearchTool(YouTubeSearchTool):
    args_schema: type[BaseModel] = YouTubeSearchInput
