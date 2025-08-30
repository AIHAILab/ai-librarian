from contextlib import asynccontextmanager

from ai_librarian_apis.core.logger import setup_logging
from ai_librarian_apis.core.openapi import custom_openapi

# from ai_librarian_core.tools.tools import get_built_in_tools
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    custom_openapi(app)
    # app.state.tools = get_built_in_tools()
    yield
