$files = @(
    'C:\\Users\\Danie\\antigravity\\Brilliant-Speech\\src\\components\\ArticulationMatchingGame.tsx',
    'C:\\Users\\Danie\\antigravity\\Brilliant-Speech\\src\\components\\SoundLadderGame.tsx'
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    # Replace escaped arrows
    $content = $content -replace '=\\u003e', '=>'
    $lines = $content -split "`r?`n"
    if ($file -like '*ArticulationMatchingGame.tsx') {
        # Remove stray line containing only '}) => {' after the export line
        $cleanLines = @()
        foreach ($i in 0..($lines.Length-1)) {
            $line = $lines[$i]
            if ($i -eq 47) {
                # line 47 (0-indexed) is the stray line; skip if it matches pattern
                if ($line -match '^\s*}\)\s*=>\s*{') { continue }
            }
            $cleanLines += $line
        }
        $newContent = $cleanLines -join "`r`n"
        Set-Content -Path $file -Value $newContent -Encoding utf8
        Write-Host "Cleaned ArticulationMatchingGame.tsx"
    } elseif ($file -like '*SoundLadderGame.tsx') {
        $cleanLines = @()
        $skip = $false
        foreach ($line in $lines) {
            if (-not $skip) {
                if ($line -match '^\s*onClose,') {
                    $skip = $true
                    continue
                }
                $cleanLines += $line
            } else {
                # Skip until we reach the start of the real function body (first occurrence of "const handlePlayModel")
                if ($line -match '^\s*const\s+handlePlayModel') {
                    $skip = $false
                    $cleanLines += $line
                }
            }
        }
        $newContent = $cleanLines -join "`r`n"
        Set-Content -Path $file -Value $newContent -Encoding utf8
        Write-Host "Cleaned SoundLadderGame.tsx"
    }
}
