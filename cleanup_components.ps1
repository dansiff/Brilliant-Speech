$files = @(
    'C:\Users\Danie\antigravity\Brilliant-Speech\src\components\ArticulationMatchingGame.tsx',
    'C:\Users\Danie\antigravity\Brilliant-Speech\src\components\SoundLadderGame.tsx'
)

foreach ($file in $files) {
    $lines = Get-Content $file -Raw
    # Replace escaped arrows
    $lines = $lines -replace '=\\u003e', '=>'
    $array = $lines -split "`r?`n"
    if ($file -like '*ArticulationMatchingGame.tsx') {
        # Remove lines 46-55 (0-indexed => lines 46-55 are indexes 45-54)
        $array = $array[0..44] + $array[55..($array.Length -1)]
        # Insert proper component header after interface (which ends at line 44 index 43)
        $header = 'export const ArticulationMatchingGame: React.FC<ArticulationMatchingGameProps> = ({ exercises, onClose, styles, playCue, sensoryProfile }) => {'
        $array = $array[0..44] + $header + $array[45..($array.Length -1)]
    }
    elseif ($file -like '*SoundLadderGame.tsx') {
        # Find indices for duplicate block start at line containing "onClose,"
        $dupStart = $array | Select-Object -Index (0..$array.Length) | Where-Object { $_ -match '^\s*onClose,' } | ForEach-Object { $array.IndexOf($_) }
        if ($dupStart -ne $null) {
            # Remove lines from dupStart to dupStart+13 (approx lines 140-153 original). We'll remove until line with "const currentSound =" which is after duplicate block.
            $end = $dupStart + 13
            $array = $array[0..($dupStart-1)] + $array[($end+1)..($array.Length -1)]
        }
    }
    $newContent = ($array -join "`r`n")
    Set-Content -Path $file -Value $newContent -Encoding utf8
    Write-Host "Cleaned $file"
}