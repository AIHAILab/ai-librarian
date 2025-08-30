from uuid import uuid4


# TODO(youkwan): Switch to UUID v7 once it becomes available in Python's built-in uuid module(3.14+)
# https://docs.python.org/3.14/library/uuid.html#uuid.uuid7
def get_thread_id(prefix: str = "thread") -> str:
    return f"{prefix}-{str(uuid4())}"
