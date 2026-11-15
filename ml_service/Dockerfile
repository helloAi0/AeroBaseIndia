FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
RUN useradd -r -u 10001 ml && mkdir -p /data && chown ml /data
USER ml
EXPOSE 5000
ENV WEB_CONCURRENCY=1
CMD gunicorn -b 0.0.0.0:${PORT:-5000} -t 120 app:app
