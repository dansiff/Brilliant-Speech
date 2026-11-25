$files = @(
    'C:\\Users\\Danie\\antigravity\\Brilliant-Speech\\src\\components\\ArticulationMatchingGame.tsx',
    'C:\\Users\\Danie\\antigravity\\Brilliant-Speech\\src\\components\\SoundLadderGame.tsx'
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    # Replace escaped arrows globally
    $content = $content -replace '=\\u003e', '=>'
    $lines = $content -split "`r?`n"
    $newLines = @()
    $i = 0
    while ($i -lt $lines.Length) {
        $line = $lines[$i]
        if ($file -like '*ArticulationMatchingGame.tsx') {
            # Remove stray line that is just '}) => {'
            if ($line -match '^\s*}\)\s*=>\s*{\s*$') {
                $i++
                continue
            }
            $newLines += $line
            $i++
        } elseif ($file -like '*SoundLadderGame.tsx') {
            if ($line -match '^export\s+const\s+SoundLadderGame') {
                # Build proper header
                $header = 'export const SoundLadderGame: React.FC<SoundLadderGameProps> = ({ onClose, onAddPoints, isOnline = true }) => {'
                $newLines += $header
                # Skip lines until we find the next actual function definition (handlePlayModel)
                $i++
                while ($i -lt $lines.Length -and -not ($lines[$i] -match '^\s*const\s+handlePlayModel')) {
                    $i++
                }
                continue
            }
            $newLines += $line
            $i++
        } else {
            $newLines += $line
            $i++
        }
    }
    $newContent = $newLines -join "`r`n"
    Set-Content -Path $file -Value $newContent -Encoding utf8
    Write-Host "Cleaned $file"
}
