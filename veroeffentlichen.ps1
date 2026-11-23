# Web-Version ("docs") auf GitHub Pages veröffentlichen.
# Aufruf:  powershell -ExecutionPolicy Bypass -File .\veroeffentlichen.ps1
Set-Location $PSScriptRoot

# Cache-Version der Web-App erhöhen, damit Browser und Boards die neue Version laden
$sw = Join-Path $PSScriptRoot 'docs\sw.js'
$neu = 'tafel-' + (Get-Date -Format 'yyyyMMddHHmm')
(Get-Content $sw -Raw) -replace "tafel-[0-9a-z]+'", "$neu'" | Set-Content $sw -NoNewline -Encoding utf8

git add -A
git commit -m ("Update " + (Get-Date -Format 'yyyy-MM-dd HH:mm'))
git push
Write-Host "`nFertig. Die Seite ist in 1-2 Minuten aktualisiert: https://abroemme-hash.github.io/meine-tafel/"
