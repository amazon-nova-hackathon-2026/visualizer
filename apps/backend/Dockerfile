FROM python:3.13-slim

RUN apt-get update && apt-get install -y \
    wget curl gnupg xvfb scrot \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

WORKDIR /app

COPY pyproject.toml .
COPY uv.lock .

RUN uv sync --frozen

RUN uv run playwright install chromium

COPY . .

EXPOSE 8080

CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
