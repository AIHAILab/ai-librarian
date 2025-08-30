FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

WORKDIR /app

COPY pyproject.toml uv.lock ./

RUN mkdir -p ai_librarian_monorepo/ai_librarian_apis && \
    mkdir -p ai_librarian_monorepo/ai_librarian_core

COPY ai_librarian_monorepo/ai_librarian_apis/pyproject.toml ./ai_librarian_monorepo/ai_librarian_apis/
COPY ai_librarian_monorepo/ai_librarian_core/pyproject.toml ./ai_librarian_monorepo/ai_librarian_core/

COPY . .

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

RUN uv run playwright install --with-deps

CMD ["uv", "run", "--frozen", "--no-dev", "ai_librarian_monorepo/ai_librarian_apis/src/ai_librarian_apis/main.py"]