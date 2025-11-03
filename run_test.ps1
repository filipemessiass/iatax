# Salvar como: run_test.ps1

Write-Host "`nðŸ§ª TESTE DO SISTEMA MODULAR" -ForegroundColor Cyan
Write-Host "="*70 -ForegroundColor Cyan

# Verificar se servidor estÃ¡ rodando
Write-Host "`nðŸ“¡ Verificando se servidor estÃ¡ ativo..." -ForegroundColor Yellow

$serverRunning = $false
$attempts = 0
$maxAttempts = 10

while (-not $serverRunning -and $attempts -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/" -Method GET -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serverRunning = $true
            Write-Host "âœ… Servidor estÃ¡ ativo!" -ForegroundColor Green
        }
    } catch {
        $attempts++
        Write-Host "  Tentativa $attempts/$maxAttempts - Aguardando servidor..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $serverRunning) {
    Write-Host "`nâŒ ERRO: Servidor nÃ£o estÃ¡ rodando!" -ForegroundColor Red
    Write-Host "Inicie o servidor primeiro com: python orchestrator.py" -ForegroundColor Yellow
    exit 1
}

# Executar testes
Write-Host "`nðŸš€ Executando testes..." -ForegroundColor Cyan
python test_sistema.py

Write-Host "`nâœ… TESTE CONCLUÃDO!" -ForegroundColor Green