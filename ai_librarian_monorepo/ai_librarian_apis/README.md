# ai-librarian-apis

A RESTful API service that provides interaction with [ai-librarian-core](../ai_librarian_core/README.md), enabling access to its comprehensive AI agent capabilities and tools.

> Due to conflicts between FastAPI and asyncio's EventLoop configuration on Windows, Windows systems are not supported. As an alternative, it is recommended to use WSL or Docker for installation.

## Installation

To set up the `ai-librarian-apis` package, follow these steps:

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/youkwan/ai-librarian.git
    cd ai-librarian/backend/ai_librarian_monorepo/ai_librarian_apis/
    ```

2.  **Install uv:**
    This project leverages [uv](https://github.com/astral-sh/uv) for efficient virtual environment and dependency management. If you do not have `uv` installed, please follow the [official installation guide](https://docs.astral.sh/uv/getting-started/installation/).

3.  **Install Playwright Browsers (Optional):**
    Install the necessary browser binaries for Playwright:

    ```bash
    playwright install
    ```
4. **Setup environment variables:**

    ```bash
    cp .env.example .env
    ```

5.  **Install Package Dependencies:**
    Use `uv run` command to run the main file, which will automatically install all required dependencies:

    ```bash
    uv run ./src/ai_librarian_apis/main.py
    ```

## TODO
1. Implement SSE heartbeat mechanism to maintain stable server-client connections.
2. Simplify the import paths of this package (write proper init file).
3. Add more comprehensive logging and error handling for each endpoint.