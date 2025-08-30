from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema. Returns 'ok' status when the API endpoint is operational.
    Used for monitoring system health and availability.
    """

    status: str = Field(
        default="ok",
        description="API operational status indicator. Returns 'ok' when the system is functioning properly.",
        examples=["ok"],
    )
