from ai_librarian_apis.core.logger import logger
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def custom_openapi(app: FastAPI):
    def openapi():
        if app.openapi_schema:
            return app.openapi_schema

        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            summary=app.summary,
            description=app.description,
            routes=app.routes,
            tags=app.openapi_tags,
            servers=app.servers,
        )

        path = "/v1/react/stream"
        method = "post"
        if path in openapi_schema.get("paths", {}) and method in openapi_schema["paths"][path]:
            responses = openapi_schema["paths"][path][method].get("responses", {})
            if "200" in responses and "content" in responses["200"]:
                content = responses["200"]["content"]
                if "application/json" in content:
                    del content[
                        "application/json"
                    ]  # Remove application/json from example use text/event-stream instead.
                    logger.info("Removed 'application/json' from /v1/react/stream POST response in OpenAPI schema.")

        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = openapi
