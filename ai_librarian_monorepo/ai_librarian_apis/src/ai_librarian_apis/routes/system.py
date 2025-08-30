from ai_librarian_apis.schemas.system import HealthResponse
from fastapi import APIRouter

system_router = APIRouter(tags=["System"])


@system_router.get(
    "/",
    description="An endpoint that verifies if the API service is running and responsive.",
    summary="Health Check",
    responses={500: {}},
)
def check_health() -> HealthResponse:
    return HealthResponse()
