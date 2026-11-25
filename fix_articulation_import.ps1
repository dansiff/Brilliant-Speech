param([string]$path = "C:/Users/Danie/antigravity/Brilliant-Speech/src/components/ArticulationMatchingGame.tsx")
$lines = Get-Content $path -Raw -Encoding utf8
$linesArray = $lines -split "`n"
# Insert import after line 6 (0-indexed 5)
$importLine = "import { speakText } from '../utils/speechUtils';"
if ($linesArray[5] -notmatch "speakText") {
  $newLines = @()
  for ($i=0; $i -lt $linesArray.Count; $i++) {
    $newLines += $linesArray[$i]
    if ($i -eq 5) { $newLines += $importLine }
  }
  $newContent = $newLines -join "`n"
  Set-Content -Path $path -Value $newContent -Encoding utf8
}
