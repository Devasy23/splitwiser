from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.database import connect_to_mongo, close_mongo_connection
from app.auth.routes import router as auth_router
from app.config import settings

app = FastAPI(
    title="Splitwiser API",
    description="Backend API for Splitwiser expense tracking application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - Enhanced configuration for production
allowed_origins = []
if settings.allow_all_origins:
    # Allow all origins in development mode
    allowed_origins = ["*"]
    print("Development mode: CORS configured to allow all origins")
elif settings.allowed_origins:
    # Use specified origins in production mode
    allowed_origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
else:
    # Fallback to allow all origins if not specified (not recommended for production)
    allowed_origins = ["*"]

print(f"Allowed CORS origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language", 
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Cache-Control",
        "Pragma",
        "X-CSRFToken"
    ],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight responses for 1 hour
)

# Add a catch-all OPTIONS handler that should work for any path
@app.options("/{path:path}")
async def options_handler(request: Request, path: str):
    """
    Handles all OPTIONS requests for any path, returning a 200 OK response with appropriate CORS headers based on the request origin and allowed origins.
    
    Parameters:
        request (Request): The incoming HTTP request.
        path (str): The requested path segment.
    
    Returns:
        Response: An HTTP response with CORS headers set according to the allowed origins configuration.
    """
    print(f"OPTIONS request received for path: /{path}")
    print(f"Origin: {request.headers.get('origin', 'No origin header')}")
    
    response = Response(status_code=200)
    
    # Manually set CORS headers for debugging
    origin = request.headers.get("origin")
    if origin and (origin in allowed_origins or "*" in allowed_origins):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, Origin, Cache-Control, Pragma, X-CSRFToken"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
    elif "*" in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, Origin, Cache-Control, Pragma, X-CSRFToken"
        response.headers["Access-Control-Max-Age"] = "3600"
    
    return response

# Database events
@app.on_event("startup")
async def startup_event():
    """
    Establishes a connection to MongoDB when the FastAPI application starts.
    """
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    """
    Close the MongoDB connection during application shutdown.
    """
    await close_mongo_connection()

# Health check
@app.get("/health")
async def health_check():
    """
    Return the health status of the Splitwiser API service.
    
    Returns:
        dict: A JSON object indicating the service is healthy and specifying the service name.
    """
    return {"status": "healthy", "service": "Splitwiser API"}

# Include routers
app.include_router(auth_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
