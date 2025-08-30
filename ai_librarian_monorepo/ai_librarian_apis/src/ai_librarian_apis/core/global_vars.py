from ai_librarian_core.agents.react.asynchronous import AsyncReactAgent
from ai_librarian_core.tools.tools import get_built_in_tools

# TODO(youkwan): remove global variables, temporarily set these as global variables for docs generation purposes.
# Should move these variables to lifespan and replace with state later.
tools = get_built_in_tools()
react_agent = AsyncReactAgent(tools=tools)
