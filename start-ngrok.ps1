# PowerShell script to start ngrok tunnel for Next.js
# This exposes your localhost:3000 to the internet

Write-Host "Starting ngrok tunnel for Next.js (port 3000)..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow
Write-Host ""

# Start ngrok
ngrok http 3000




