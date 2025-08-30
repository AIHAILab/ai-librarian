from langchain_community.tools.openweathermap import OpenWeatherMapQueryRun
from pydantic import BaseModel, Field


class OpenWeatherMapInput(BaseModel):
    location: str = Field(description="The location to get the weather for.")


class SchemaedOpenWeatherMapQueryRun(OpenWeatherMapQueryRun):
    args_schema: type[BaseModel] = OpenWeatherMapInput
