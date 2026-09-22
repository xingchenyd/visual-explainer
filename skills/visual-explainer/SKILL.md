---
name: visual-explainer
description: Create verifiable visual lessons using the Visual Explainer core. Supports interactive matrix multiplication and narrated multi-operator simulated annealing videos with a traveling-salesman example, deterministic traces, calculation checks, and visual review.
---

# Visual Explainer

Create a runnable lesson package using a tested deterministic renderer. Two profiles are available: interactive matrix multiplication, and a narrated multi-operator simulated annealing video using an eight-city traveling-salesman example. Convolution, BFS, arbitrary custom components and AI follow-up services are not implemented. Broader requests require new implementation before claiming support.

For simulated annealing videos, read [the annealing video workflow](references/annealing-video.md) and use that profile. It has its own `annealing-video-0.1` configuration and does not use the matrix schema. The remainder of the Generate section applies to matrix lessons.

## Generate

Use Node.js 22+ and Python 3. The scripts resolve resources relative to this skill, independent of the current directory. Choose a fresh output directory in the user's workspace.

```sh
node <skill-dir>/scripts/create-lesson.mjs <output-dir>
# Optional configuration file: {"A":[[1,2]],"B":[[3],[4]],"lessonId":"my-matrix"}
node <skill-dir>/scripts/create-lesson.mjs <output-dir> <config.json>
```

For a novice asking why multiplication is not elementwise, retain the composition → select row/column → pair by shared dimension → accumulate → write output → formula sequence. Default lesson: 69 seconds. Prefer a small 2×3 by 3×2 example. Read [the IR and pedagogy contract](references/contract.md) before changing narration or scenes. All values must come from bindings, never manually authored results.

The command generates Spec, IR, sources, computation evidence, modular preview, and `preview/standalone.html`. It refuses to overwrite a directory containing a lesson. It leaves quality status pending until verification is performed. To revise an existing IR, run the bundled `assets/runtime/scripts/build.mjs <absolute-ir-path>` explicitly.

## Verify before delivery

Read [verification commands and gates](references/verification.md). Run runtime tests, schema/semantic validation, independent Python math checks, and real browser checks. Inspect pairing, accumulation, output and formula screenshots, including a narrow viewport. The browser script records checks and screenshots, but does not claim manual visual review.

Do not mark a lesson complete while math, runtime, or important layout failures remain. Make targeted repairs and rerun affected checks; after three unsuccessful repair passes, report the specific failure and preserve the evidence rather than continuing an unbounded loop. Do not invent test results or silently lower the gate.

## Deliver

Link the offline HTML, the course directory or IR, and the quality report. State what was verified and any unimplemented capability relevant to the request. The local replay explanation is a deterministic path-based alternative, not an AI response to arbitrary text. Its JSON context captures lesson, scene, time, focused IDs and selected cell.

The project and Skill use identical runtime source. This Skill carries a snapshot with `assets/runtime/source-manifest.json`; maintain core changes in the project and use its `scripts/sync-skill.mjs` to update this snapshot. Do not create a second implementation inside prompts.
