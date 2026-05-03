from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import get_session

app = FastAPI(
    title="EmPay API",
    description="Smart Human Resource Management System — EmPay",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
        "http://localhost:5174",   # Alternate Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health_check():
    """Verify API and DB are running."""
    from sqlmodel import Session, text
    from app.database import engine
    try:
        with Session(engine) as session:
            session.exec(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {"status": "ok", "db": db_status}


# ─── Routers ──────────────────────────────────────────────────────────────────
from app.routers import auth, users, employees, attendance, leave, payroll, analytics

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(employees.router, prefix="/employees", tags=["Employees"])
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(leave.router, prefix="/leave", tags=["Leave"])
app.include_router(payroll.router, prefix="/payroll", tags=["Payroll"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
