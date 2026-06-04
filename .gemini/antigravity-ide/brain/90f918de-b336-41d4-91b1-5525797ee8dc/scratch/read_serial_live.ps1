$port = New-Object System.IO.Ports.SerialPort COM4, 115200, None, 8, one
$port.Open()
Write-Host "Streaming COM4 for 45 seconds... Please try connecting the BLE device now."
$startTime = Get-Date
while (((Get-Date) - $startTime).TotalSeconds -lt 45) {
    if ($port.BytesToRead -gt 0) {
        $line = $port.ReadLine()
        Write-Host $line
    }
    Start-Sleep -Milliseconds 100
}
$port.Close()
Write-Host "Done streaming."
