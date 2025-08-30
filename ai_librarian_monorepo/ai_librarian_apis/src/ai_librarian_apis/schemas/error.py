from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    detail: str | None = Field(
        description="Detailed information about the error.",
        default="Internal server error.",
        examples=["Internal server error."],
    )
