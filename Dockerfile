# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source code and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the Flask backend
FROM python:3.10-slim

WORKDIR /app/backend

# Install system dependencies if required by pandas/scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY backend/ .

# Copy the compiled React application from the builder stage
# We place it in /app/backend/dist because app.py expects it there:
# DIST_DIR = os.path.join(os.path.dirname(__file__), 'dist')
COPY --from=frontend-builder /app/frontend/dist /app/backend/dist

# Railway provides a PORT environment variable. We default to 5000 if not set.
ENV PORT=5000

# Start the Gunicorn server
CMD gunicorn --bind 0.0.0.0:$PORT app:app
