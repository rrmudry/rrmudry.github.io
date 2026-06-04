$port = New-Object System.IO.Ports.SerialPort COM4, 115200, None, 8, one
$port.Open()
Write-Host "Streaming COM4 (non-blocking) for 30 seconds..."
$startTime = Get-Date
$buffer = ""
while (((Get-Date) - $startTime).TotalSeconds -lt 30) {
    if ($port.BytesToRead -gt 0) {
        $data = $port.ReadExisting()
        $buffer += $data
        if ($buffer -match "`n") {
            $lines = $buffer -split "`r?`n"
            for ($i = 0; $i -lt $lines.Length - 1; $i++) {
                Write-Host $lines[$i]
            }
            $buffer = $lines[$lines.Length - 1]
        }
    }
    Start-Sleep -Milliseconds 100
}
if ($buffer -ne "") {
    Write-Host $buffer
}
$port.Close()
Write-Host "Done streaming."
