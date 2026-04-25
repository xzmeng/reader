FROM python:3.12-slim
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install -r requirements.txt
COPY backend/ ./
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
