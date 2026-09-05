from fastapi import FastAPI

from app.routers import upload, auth, projects, admin, access_requests

app = FastAPI(title="DocFlow AI", version="0.1.0")

app.include_router(upload.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(admin.router)
app.include_router(access_requests.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
