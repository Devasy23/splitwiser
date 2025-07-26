import pytest
import logging
from app.config import logger,LOGGING_CONFIG
from logging.config import dictConfig
from app.config import RequestResponseLoggingMiddleware
from fastapi.testclient import TestClient
from fastapi import FastAPI

dictConfig(LOGGING_CONFIG)

def test_logger_init():
    assert logger is not None
    assert isinstance(logger, logging.Logger)
    assert logger.getEffectiveLevel() == logging.INFO
    assert logger.isEnabledFor(logging.INFO)
    assert logger.isEnabledFor(logging.WARNING)
    assert logger.isEnabledFor(logging.ERROR)
    assert not logger.isEnabledFor(logging.DEBUG)

def test_logger_logs_info(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("Test info message")
    assert "Test info message" in caplog.text

def test_logger_logs_debug(caplog):
    with caplog.at_level(logging.DEBUG):
        logging.debug("Test debug message")
    assert "Test debug message" in caplog.text

def test_logger_logs_error(caplog):
    with caplog.at_level(logging.ERROR):
        logger.error("Test error message")
    assert "Test error message" in caplog.text

def test_logger_logs_warning(caplog):
    with caplog.at_level(logging.WARNING):
        logging.warning("Test warning message")
    assert "Test warning message" in caplog.text 

@pytest.mark.asyncio
async def test_request_response_logging_middleware_logs(caplog):
    app = FastAPI()

    app.add_middleware(RequestResponseLoggingMiddleware)

    @app.get("/test")
    async def test_endpoint():
        return {"message":"Test message"}

    client = TestClient(app)

    with caplog.at_level(logging.INFO):
        response = client.get("/test")
    
    assert response.status_code == 200
    assert "Incoming request: GET http://testserver/test" in caplog.text
    assert "Response status: 200 for GET http://testserver/test" in caplog.text