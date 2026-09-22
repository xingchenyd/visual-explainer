# Verification

Let R be `<skill-dir>/assets/runtime` and L be the generated lesson's absolute directory. Use the package lock:

```sh
# cwd R
npm ci
npm test
node scripts/validate.mjs <L>/lesson.ir.json
python scripts/verify-math.py <L>
node scripts/serve.mjs <L>/preview 4317
```

In a separate terminal with cwd R, set `LESSON_IR` to `<L>/lesson.ir.json`, and `PREVIEW_URL` to `http://127.0.0.1:4317/apps/player/`, then run `node scripts/browser-qa.mjs`. On Windows use PowerShell environment assignments, not Unix shell syntax. Use a free localhost port if 4317 is occupied. End only the server process started for this validation when it is no longer useful.

The browser regression uses Playwright with installed Microsoft Edge. If Edge is unavailable, adapt the launch channel to an installed supported Chromium browser or install Playwright Chromium; record that change. Do not report browser success when no browser ran.

Generated QA evidence: every scene at 60% on desktop, mobile screenshot, 4×4 layout screenshot, exact DOM comparison after reverse seek, playback/pause/speed/end/replay, semantic stepping, progress range, caption toggle, object context, input edits, invalid inputs and offline file loading. The script checks SVG bounds and page overflow; it does not prove absence of internal overlap or educational clarity.

Inspect actual screenshots of pairing, accumulation, writeResult and formula plus narrow layout. Look for row/column identity, matching operands, a readable sum, destination correspondence and formula color binding. Manually append the inspected filenames and findings to quality-report.json. Keep automated checks separate from visual judgment. For a generated variant, do not copy a prior course's pass report.

Node tests include 200 seeded matrix cases and replay boundaries; Python uses Decimal to independently check every product, partial sum and final result saved by the build. Record actual commands and outcomes in the report. A file checksum associates browser evidence with its IR.
