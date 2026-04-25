from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import books, search

app = FastAPI(title="Reader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(search.router)


@app.on_event("startup")
def startup():
    init_db()
