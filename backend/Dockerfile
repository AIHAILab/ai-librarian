FROM python:3.13.7-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

WORKDIR /app

COPY pyproject.toml ./
COPY uv.lock ./
COPY ai_librarian_monorepo/ ./ai_librarian_monorepo/

# RUN --mount=type=cache,target=/root/.cache/uv \
#     uv sync --locked --no-dev

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

RUN uv run playwright install --with-deps

CMD ["uv", "run", "--frozen", "--no-dev", "ai_librarian_monorepo/ai_librarian_apis/src/ai_librarian_apis/main.py"]