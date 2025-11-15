from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database import engine, Base
from app.routers import auth, licenses, campaigns, payments, admin, health
import time

# Initialize Sentry (optional)
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    if settings.SENTRY_DSN:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[FastApiIntegration()],
            environment=settings.ENVIRONMENT,
        )
except ImportError:
    pass  # Sentry not installed, skip

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MyWASender API",
    description="WhatsApp Desktop Sender Backend API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc) if settings.ENVIRONMENT == "development" else None}
    )

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(licenses.router, prefix="/api/v1/licenses", tags=["Licenses"])
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["Campaigns"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/")
async def root():
    return {"message": "MyWASender API", "version": "1.0.0", "status": "running"}
