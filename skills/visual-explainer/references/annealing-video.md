# Multi-operator simulated annealing video

This tested profile creates a Chinese narrated 1280×720, 24 fps video using swap, insertion and 2-opt on an eight-city symmetric Euclidean traveling-salesman problem. Default runtime is about three minutes. It is a bounded educational example, not a general optimizer or arbitrary-topic video generator.

Runtime prerequisites: Python 3 with Pillow; FFmpeg and ffprobe on PATH; on Windows, Microsoft YaHei fonts and the System.Speech voice Microsoft Huihui Desktop. The bundled narrator uses the local voice and does not send text to an external TTS service. If these resources are unavailable, report the actual missing dependency or adapt the resource explicitly; do not pretend an unrendered storyboard is a completed video.

Let R be this skill's `assets/runtime`, and L a fresh lesson output directory. Run:

```text
python R/scripts/annealing_video.py prepare L
powershell -NoProfile -ExecutionPolicy Bypass -File R/scripts/narrate-annealing.ps1 -LessonDirectory L
python R/scripts/annealing_video.py storyboard L
# Inspect L/qa/storyboard.jpg and important full-resolution frames before rendering.
python R/scripts/annealing_video.py render L
node R/scripts/package-annealing.mjs L
```

The prepare command writes configuration, trace, teaching specification, sources and a pending report. It overwrites this profile's files, so use a new output directory unless revising that specific lesson. Narration text lives in the prepared IR. Timing is derived from actual WAV durations, plus breathing space. If text changes, regenerate audio and storyboard before rendering.

Default seed 42, 600 iterations, T0=8, T←0.99T. Every iteration chooses one of the three operators with fixed equal probability; positions other than the fixed start are sampled uniformly. For insert, pop(i) then insert(j); for 2-opt, reverse the inclusive segment. Do not confuse multi-neighborhood search with multiobjective optimization or imply adaptive operator weighting in this profile.

`prepare` performs checks; `verify L` can repeat them but resets the quality report to math-passed/video-pending. It checks every candidate, route cost, delta, Metropolis probability, random decision, current state and best archive. It also compares the final best against exhaustive enumeration of this small instance. That is a check of this example, not a guarantee that finite simulated annealing finds a global optimum.

Frames depend only on IR, saved trace and absolute time. Inspect token movement and changed edges in all three operators, positive-delta acceptance, temperature probability bars, current/best curves, and final route. Check that text fits at 1280×720 and values are readable. Captions are paced approximately by narration character counts, not forced word alignment.

After render, inspect actual encoded frames and run ffprobe for duration, resolution, frame rate, video and audio streams. Decode the entire MP4 with ffmpeg to check for errors. Check audio is non-silent. Update the report with actual evidence; do not copy the prior example's pass status. Deliver the MP4 directly with a playable local media embed when supported, plus the optional chapter player `exports/index.html`.

The source scripts in the main project are maintained together with the matrix core; its sync command updates this snapshot. Do not route this JSON through the matrix IR validator or present the two formats as interoperable.
