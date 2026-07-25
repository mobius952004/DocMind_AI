from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.api.uploads import router as upload_router
from app.api.interview import router as interview_router
from app import config
from fastapi.middleware.cors import CORSMiddleware
import traceback
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins="*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return CORS-safe JSON error responses for unhandled exceptions."""
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        },
    )


app.include_router(
    upload_router,
    prefix="/upload",
    tags=["Upload"]
)
app.include_router(
    interview_router,
    prefix="/interview",
    tags=["Interview"]
)

@app.get("/")
def Home():
    return {"message": "Backend of the Interview Question Generator"}
