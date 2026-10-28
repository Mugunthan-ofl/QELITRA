from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.overview import router as overview_router
from backend.routes.cashflow import router as cashflow_router
from backend.routes.receivables import router as receivables_router
from backend.routes.stress import router as stress_router
from backend.core.data_loader import get_data_loader

app = FastAPI(
    title="QELITRA — Corporate Liquidity Management & Cash Flow Stress Testing API",
    description="Backend API serving real-time liquidity analytics, cash flow forecasts, working capital, and stress simulation.",
    version="1.0.0"
)

# CORS configuration for Vite frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(overview_router)
app.include_router(cashflow_router)
app.include_router(receivables_router)
app.include_router(stress_router)

@app.on_event("startup")
def startup_event():
    # Warm up data loader cache on startup
    loader = get_data_loader()
    _ = loader.get_kpi_summary()

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "QELITRA — Corporate Liquidity Management API",
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    loader = get_data_loader()
    report = loader.get_validation_report()
    return {
        "status": "healthy",
        "validation_report": report
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
