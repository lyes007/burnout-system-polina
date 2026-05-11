# PowerShell script to start ngrok tunnel for Python API
# This exposes your localhost:8000 to the internet

Write-Host "Starting ngrok tunnel for Python API (port 8000)..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""
Write-Host "After starting, update MODEL_API_URL in .env.local with the ngrok URL" -ForegroundColor Cyan
Write-Host ""

# Start ngrok
ngrok http 8000




