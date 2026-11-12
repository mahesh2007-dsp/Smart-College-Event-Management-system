# Multi-stage production container for Smart CEMS
# Rajiv Gandhi University of Knowledge Technologies - IIIT RK Valley
FROM node:20-slim AS builder

WORKDIR /app

# Build Frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build

# Production Runtime Image with Node & Python 3
FROM node:20-slim

WORKDIR /app

# Install Python 3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy application files
COPY backend ./backend
COPY python-service ./python-service
COPY database ./database
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY start-prod.sh ./start-prod.sh
RUN chmod +x ./start-prod.sh

ENV NODE_ENV=production
ENV PORT=5000
ENV PYTHON_AI_URL=http://localhost:5001

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/venues || exit 1

CMD ["./start-prod.sh"]
