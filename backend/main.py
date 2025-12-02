from contextlib import asynccontextmanager

from app.auth.routes import router as auth_router
from app.config import RequestResponseLoggingMiddleware, logger, settings
from app.database import close_mongo_connection, connect_to_mongo
from app.expenses.routes import balance_router
from app.expenses.routes import router as expenses_router
from app.groups.routes import router as groups_router
from app.user.routes import router as user_router
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Lifespan: Connecting to MongoDB...")
    await connect_to_mongo()
    logger.info("Lifespan: MongoDB connected.")
    yield
    # Shutdown
    logger.info("Lifespan: Closing MongoDB connection...")
    await close_mongo_connection()
    logger.info("Lifespan: MongoDB connection closed.")


app = FastAPI(
    title="Splitwiser API",
    description="Backend API for Splitwiser expense tracking application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
if settings.allow_all_origins:
    logger.info("Allowing all origins for CORS")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    logger.info(f"Allowing specific origins for CORS: {settings.allowed_origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.add_middleware(RequestResponseLoggingMiddleware)


# Health check
@app.get("/health")
async def health_check():
    """
    Returns the health status of the Splitwiser API service.

    This endpoint can be used for health checks and monitoring.
    """
    return {"status": "healthy", "service": "Splitwiser API"}


# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(groups_router)
app.include_router(expenses_router)
app.include_router(balance_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.debug)
