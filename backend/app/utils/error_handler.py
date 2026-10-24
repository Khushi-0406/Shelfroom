import logging

from fastapi import Request
from fastapi.responses import JSONResponse


logger = logging.getLogger(__name__)


async def internal_error_handler(
    request: Request,
    exc: Exception
):
    logger.exception(
        "Unhandled exception: %s %s",
        request.method,
        request.url.path,
        exc_info=exc
    )

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error"
        }
    )