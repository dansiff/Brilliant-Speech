$files = @(
    'C:\\Users\\Danie\\antigravity\\Brilliant-Speech\\src\\components\\ArticulationMatchingGame.tsx',
    'C:\\Users\\Danie\\antigravity\\Brilliant-Speech\\src\\components\\SoundLadderGame.tsx'
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content -replace '=\\u003e', '=>'
    if ($file -like '*ArticulationMatchingGame.tsx') {
        # Remove stray line containing just '}) => {'
        $content = $content -replace "\r?\n\s*}\)\s*=>\s*{\s*\r?\n", "\r\n"
    } elseif ($file -like '*SoundLadderGame.tsx') {
        # Replace broken export with proper header
        $header = "export const SoundLadderGame: React.FC<SoundLadderGameProps> = ({ onClose, onAddPoints, isOnline = true }) => {"
        # Find the start of the broken export line
        $pattern = "export\\s+const\\s+SoundLadderGame[^\n]*\n"
        $content = $content -replace $pattern, "$header`n"
        # Remove any stray lines before the first actual code (like empty lines or misplaced braces)
        # Ensure there is only one header and then the next line is the code (e.g., const handlePlayModel)
    }
    Set-Content -Path $file -Value $content -Encoding utf8
    Write-Host "Fixed $file"
}