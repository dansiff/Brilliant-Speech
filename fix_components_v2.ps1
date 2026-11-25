$files = @(
    'C:\\Users\\Danie\\antigravity\\Brilliant-Speech\\src\\components\\ArticulationMatchingGame.tsx',
    'C:\\Users\\Danie\\antigravity\\Brilliant-Speech\\src\\components\\SoundLadderGame.tsx'
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    # Replace escaped arrows globally
    $content = $content -replace '=\\u003e', '=>'

    if ($file -like '*ArticulationMatchingGame.tsx') {
        # Remove stray line that is just '}) => {'
        $content = $content -replace "\r?\n\s*}\)\s*=>\s*{\s*\r?\n", "`r`n"
    }
    elseif ($file -like '*SoundLadderGame.tsx') {
        # Fix the export header
        $header = "export const SoundLadderGame: React.FC<SoundLadderGameProps> = ({ onClose, onAddPoints, isOnline = true }) => {"
        $content = $content -replace "export\\s+const\\s+SoundLadderGame[^\n]*\n", "$header`n"

        # Remove duplicated stopTrialRecording block(s)
        $lines = $content -split "`r?`n"
        $newLines = @()
        $skip = $false
        $inStopBlock = $false
        foreach ($idx in 0..($lines.Length-1)) {
            $line = $lines[$idx]
            if (-not $skip) {
                if ($line -match '^\s*const\s+stopTrialRecording\s*=') {
                    $inStopBlock = $true
                    $newLines += $line
                    continue
                }
                if ($inStopBlock -and $line -match '^\s*}\s*;\s*$') {
                    # End of the first stopTrialRecording implementation – keep this line then stop skipping further duplicated code
                    $newLines += $line
                    $inStopBlock = $false
                    $skip = $true
                    continue
                }
                $newLines += $line
            } else {
                # Skipping duplicate material – stop when we hit the next top‑level const definition (handleNextRung)
                if ($line -match '^\s*const\s+handleNextRung\b') {
                    $skip = $false
                    $newLines += $line
                }
            }
        }
        $content = $newLines -join "`r`n"
    }

    Set-Content -Path $file -Value $content -Encoding utf8
    Write-Host "Fixed $file"
}
