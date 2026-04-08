Param(
  [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/4] Health check..."
$health = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/health"
$health | ConvertTo-Json -Depth 5

Write-Host "[2/4] Posting SOS message..."
$body = @{
  id = "demo-sos-$(Get-Date -UFormat %s)-$([guid]::NewGuid().ToString('N').Substring(0,8))"
  userId = "demo-user-01"
  latitude = 13.0827
  longitude = 80.2707
  timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  source = "demo-smoke"
} | ConvertTo-Json

$postResult = Invoke-RestMethod -Method POST -Uri "$BaseUrl/api/sos" -ContentType "application/json" -Body $body
$postResult | ConvertTo-Json -Depth 6

Write-Host "[3/4] Fetching recent SOS messages..."
$recent = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/sos/recent?limit=5"
$recent | ConvertTo-Json -Depth 6

Write-Host "[4/4] PASS: SOS API smoke test completed."
