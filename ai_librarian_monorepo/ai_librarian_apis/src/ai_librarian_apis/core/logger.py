import json
import logging.config
import logging.handlers
from pathlib import Path

LOGGING_CONFIG_PATH = Path(__file__).resolve().parents[1] / "logging_configs" / "config.json"

logger = logging.getLogger(__name__)


def setup_logging():
    config_file = LOGGING_CONFIG_PATH
    with open(config_file) as f:
        config = json.load(f)

    if "file" in config.get("handlers", {}):
        log_filename = config["handlers"]["file"].get("filename")
        if log_filename:
            log_file_path = LOGGING_CONFIG_PATH.parents[1] / Path(log_filename).parent
            log_file_path.mkdir(parents=True, exist_ok=True)
            config["handlers"]["file"]["filename"] = str(log_file_path / Path(log_filename).name)

    logging.config.dictConfig(config)
    return logger


if __name__ == "__main__":

    def test_logging():
        setup_logging()
        while True:
            logger.debug("debug message", extra={"x": "hello"})
            logger.info("info message")
            logger.warning("warning message")
            logger.error("error message")
            logger.critical("critical message")
            try:
                1 / 0
            except ZeroDivisionError:
                logger.exception("exception message")

    test_logging()
