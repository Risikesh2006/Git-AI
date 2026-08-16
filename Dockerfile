# Single-container image for Render: the Express backend plus a Python venv
# for the trained priority-scoring model. backend/services/repository.js calls
# `python3 ml/predict.py --repo '<json>'` as a one-shot subprocess per scan —
# there is no second always-on service to deploy or wire up.

FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY ml/requirements.txt ml/requirements.txt
RUN pip install --no-cache-dir -r ml/requirements.txt

COPY backend/package.json backend/package-lock.json backend/
RUN npm ci --prefix backend --omit=dev

COPY backend backend
COPY ml ml
COPY models models

ENV NODE_ENV=production
ENV PORT=8000
ENV PYTHON_BIN=python3
EXPOSE 8000

CMD ["node", "backend/server.js"]
