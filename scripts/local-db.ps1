param(
	[ValidateSet("init", "start", "stop", "status")]
	[string]$Action = "status",
	[string]$PgBin = $env:PG_BIN,
	[string]$DataDir = "services/backend/.demo-pg-data",
	[string]$LogFile = "services/backend/.demo-pg.log",
	[int]$Port = 55432,
	[string]$DbName = "tidex",
	[string]$DbUser = "postgres"
)

if (-not $PgBin) {
	$PgBin = "C:\Program Files\PostgreSQL\18\bin"
}

$initdb = Join-Path $PgBin "initdb.exe"
$pgCtl = Join-Path $PgBin "pg_ctl.exe"
$createdb = Join-Path $PgBin "createdb.exe"

function Require-Tool([string]$toolPath) {
	if (-not (Test-Path $toolPath)) {
		throw "Required tool not found: $toolPath. Install PostgreSQL or set PG_BIN to your bin folder."
	}
}

function Is-Initialized {
	return (Test-Path (Join-Path $DataDir "PG_VERSION"))
}

function Ensure-Initialized {
	if (Is-Initialized) {
		Write-Host "Local DB cluster already initialized at $DataDir"
		return
	}

	Write-Host "Initializing local DB cluster at $DataDir"
	& $initdb -D $DataDir -A trust -U $DbUser
	if ($LASTEXITCODE -ne 0) {
		throw "initdb failed"
	}
}

function Start-Cluster {
	& $pgCtl -D $DataDir status *> $null
	if ($LASTEXITCODE -eq 0) {
		Write-Host "Local DB cluster is already running"
		& $createdb -h localhost -p $Port -U $DbUser $DbName 2>$null
		Write-Host "Local database '$DbName' is ready on port $Port"
		return
	}

	Write-Host "Starting local DB on port $Port"
	& $pgCtl -D $DataDir -l $LogFile -o "-p $Port" start
	if ($LASTEXITCODE -ne 0) {
		throw "pg_ctl start failed"
	}

	& $createdb -h localhost -p $Port -U $DbUser $DbName 2>$null
	Write-Host "Local database '$DbName' is ready on port $Port"
}

function Stop-Cluster {
	Write-Host "Stopping local DB cluster"
	& $pgCtl -D $DataDir stop -m fast
	if ($LASTEXITCODE -ne 0) {
		throw "pg_ctl stop failed"
	}
}

function Status-Cluster {
	& $pgCtl -D $DataDir status
	if ($LASTEXITCODE -eq 0) {
		Write-Host "Port check:"
		netstat -ano | findstr ":$Port"
		return
	}

	Write-Host "Local DB is not running"
}

try {
	Require-Tool $initdb
	Require-Tool $pgCtl
	Require-Tool $createdb

	switch ($Action) {
		"init" {
			Ensure-Initialized
			Start-Cluster
		}
		"start" {
			Ensure-Initialized
			Start-Cluster
		}
		"stop" {
			Stop-Cluster
		}
		"status" {
			Status-Cluster
		}
	}
}
catch {
	Write-Error $_
	exit 1
}
