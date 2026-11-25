$file = 'C:\\Users\\Danie\\antigravity\\Brilliant-Speech\\src\\components\\ArticulationMatchingGame.tsx'
$content = Get-Content $file -Raw
# Replace the stray line that contains only '}) => {'
$content = $content -replace "\r?\n\s*}\)\s*=>\s*{\s*\r?\n", "`r`n"
Set-Content -Path $file -Value $content -Encoding utf8
Write-Host "Fixed ArticulationMatchingGame.tsx"