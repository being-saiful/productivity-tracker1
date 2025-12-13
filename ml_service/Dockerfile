FROM python:3.11-slim

WORKDIR /app

<<<<<<< HEAD
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

=======
# Copy everything from ml_service into container
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

>>>>>>> f30c0edd2da96ee542890d584f2a7bafaf219b57
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
