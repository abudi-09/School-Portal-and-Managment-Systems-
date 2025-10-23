# Git network diagnostic script for Windows PowerShell (v5.1)
# Usage:
# 1. Open PowerShell (preferably as Administrator).
# 2. Change directory to the repository root (where this script lives):
#      cd "C:\Users\abd\pathways-ui"
# 3. Run the script (if execution policy blocks scripts, run with Bypass):
#      powershell -ExecutionPolicy Bypass -File .\diagnose_git_network.ps1
# 4. After the script completes it will print the path to a log file. Paste the log here.

$log = Join-Path $PSScriptRoot "git-network-diagnostic-$(Get-Date -Format yyyyMMdd-HHmmss).txt"
Write-Output "Git network diagnostic started at $(Get-Date)" | Out-File -FilePath $log -Encoding utf8
Write-Output "Script path: $PSScriptRoot\diagnose_git_network.ps1" | Out-File -FilePath $log -Append -Encoding utf8
Write-Output "" | Out-File -FilePath $log -Append

function Append-Section {
    param($title)
    Write-Output "\n=== $title ===\n" | Out-File -FilePath $log -Append -Encoding utf8
}

Append-Section "Environment"
Write-Output "OS: $($env:OS)" | Out-File -FilePath $log -Append -Encoding utf8
Write-Output "User: $env:USERNAME" | Out-File -FilePath $log -Append -Encoding utf8
Write-Output "WorkingDirectory: $(Get-Location)" | Out-File -FilePath $log -Append -Encoding utf8

Append-Section "nslookup github.com"
try { nslookup github.com 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "Test-NetConnection github.com:443"
try { Test-NetConnection -ComputerName github.com -Port 443 -InformationLevel Detailed 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "Invoke-WebRequest to https://github.com (simple HTTP test)"
try {
    Invoke-WebRequest -Uri https://github.com -UseBasicParsing -TimeoutSec 15 2>&1 | Out-File -FilePath $log -Append -Encoding utf8
} catch {
    $_ | Out-File -FilePath $log -Append -Encoding utf8
}

Append-Section "curl verbose to https://github.com (curl alias)"
try {
    if (Get-Command curl -ErrorAction SilentlyContinue) {
        curl -v https://github.com 2>&1 | Out-File -FilePath $log -Append -Encoding utf8
    } else {
        Write-Output "curl not available" | Out-File -FilePath $log -Append -Encoding utf8
    }
} catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "git version"
try { git --version 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "git config --list (global and system)"
try { git config --global --list 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }
try { git config --system --list 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { Write-Output "(system config access failed or not set)" | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "git proxy settings"
try { git config --get http.proxy 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }
try { git config --get https.proxy 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "WinHTTP proxy (netsh winhttp show proxy)"
try { netsh winhttp show proxy 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "Environment proxy variables (HTTP_PROXY, HTTPS_PROXY, NO_PROXY)"
Get-ChildItem env:HTTP_PROXY, env:HTTPS_PROXY, env:NO_PROXY, env:http_proxy, env:https_proxy, env:no_proxy 2>&1 | Out-File -FilePath $log -Append -Encoding utf8

Append-Section "Hosts file (first 200 lines)"
try { Get-Content -Path "$env:SystemRoot\System32\drivers\etc\hosts" -ErrorAction SilentlyContinue | Select-Object -First 200 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "DNS client server addresses"
try { Get-DnsClientServerAddress -AddressFamily IPv4 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "ipconfig /all (first 200 lines)"
try { ipconfig /all | Select-Object -First 200 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "(Optional) Flush DNS cache"
try { ipconfig /flushdns 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "git ls-remote test (https://github.com/git/git)"
try { git ls-remote https://github.com/git/git 2>&1 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Append-Section "route print (first 200 lines)"
try { route print | Select-Object -First 200 | Out-File -FilePath $log -Append -Encoding utf8 } catch { $_ | Out-File -FilePath $log -Append -Encoding utf8 }

Write-Output "\nDiagnostic complete. Log saved to: $log\n"
Write-Output "Please paste the contents of the log file here or attach it so I can analyze the outputs and suggest next steps." | Out-File -FilePath $log -Append -Encoding utf8

# Also print the log path to the console for convenience
Write-Host "Diagnostic complete. Log saved to: $log"
