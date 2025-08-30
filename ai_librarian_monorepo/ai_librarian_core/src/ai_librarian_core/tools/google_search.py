from langchain_google_community import GoogleSearchRun
from pydantic import BaseModel, Field


class GoogleSearchInput(BaseModel):
    query: str = Field(description="The query to search for on Google.")


class SchemaedGoogleSearchRun(GoogleSearchRun):
    args_schema: type[BaseModel] = GoogleSearchInput
