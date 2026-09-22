param([Parameter(Mandatory=$true)][string]$LessonDirectory)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Speech
$taskLesson = Get-Content -LiteralPath (Join-Path $LessonDirectory 'lesson.ir.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$taskVoice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$taskVoice.SelectVoice('Microsoft Huihui Desktop')
$taskVoice.Rate=1
try {
  foreach($taskScene in $taskLesson.scenes) {
    $taskAudioPath = Join-Path $LessonDirectory ('audio\'+$taskScene.id+'.wav')
    $taskVoice.SetOutputToWaveFile($taskAudioPath)
    $taskVoice.Speak($taskScene.narration)
    $taskVoice.SetOutputToNull()
    Write-Output ('Narrated '+$taskScene.id)
  }
} finally { $taskVoice.Dispose() }
