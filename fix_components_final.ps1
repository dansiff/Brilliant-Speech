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
        # Fix the export header line
        $correctHeader = "export const SoundLadderGame: React.FC<SoundLadderGameProps> = ({ onClose, onAddPoints, isOnline = true }) => {"
        $content = $content -replace "export\\s+const\\s+SoundLadderGame[^\n]*\n", "$correctHeader`n"
        # Split into lines for duplicate block removal
        $lines = $content -split "`r?`n"
        $newLines = @()
        $firstStopFound = $false
        $skip = $false
        foreach ($idx in 0..($lines.Length-1)) {
            $line = $lines[$idx]
            if (-not $skip) {
                if ($line -match '^\s*const\s+stopTrialRecording\s*=') {
                    if ($firstStopFound) {
                        # start skipping second duplicate block
                        $skip = $true
                        continue
                    } else {
                        $firstStopFound = $true
                        $newLines += $line
                        continue
                    }
                }
                $newLines += $line
            } else {
                # skipping until we encounter the next top‑level const definition (handleNextRung) which ends the duplicate block
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
