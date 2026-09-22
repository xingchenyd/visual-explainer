# Matrix lesson contract v0.1

`assets/runtime/packages/schema/lesson-ir.schema.json` describes serializable structure; `packages/core/core.mjs` additionally enforces dimensions, IDs, binding resolution, action order and full output coverage. Unknown fields/primitives fail with paths. No embedded JavaScript or eval expressions.

Stable objects: A matrix with input role; B matrix with weight role; C result matrix. Data appear only on A/B. Supported shapes: each dimension 1–4, compatible inner dimensions; finite numbers with absolute value ≤999. Decimal display is rounded to three fractional digits; calculations retain double precision. Prefer small integers for readability. A 4×4 lesson is longer than the 45–90 second default teaching target; reduce the example or deliberately retime it when a short explanation is requested.

Binding `product` is exactly `{op:"matmul",left:"A",right:"B"}`. Numeric products, partial sums and outputs are computed from that binding. Never accept stored answers as authoritative.

Scene fields: unique id, learningBeat, narration, action, duration in seconds, binding, and for cell actions a zero-based result `cell:[row,column]`. Each cell must follow focus → pairCells → accumulate → writeResult. compare establishes why relations compose; morphEquation generalizes after concrete computation. IDs and semantic colors remain stable.

Time semantics: scene intervals are left-closed/right-open. Exact final time returns the last completed scene. Accumulation reveals a partial sum after each term's allotted interval. writeResult inserts the result at its start. `stateAt` is pure: no dependence on direction, frame count or DOM history. Playback, scrub and screenshots must use this function. Semantic stepping includes scene starts and intermediate sum boundaries.

Teaching model: A lists ingredient quantities in each meal; B lists a nutrient amount for each ingredient. C combines the routes through ingredients. These are invented linear quantities, not nutritional facts. Negative values are valid algebraic experiments but lose the literal food interpretation; explain that when selecting them for a course.

The six actions are the supported slice, not a general-purpose primitive catalog. The current schema uses fixed IDs A/B/C deliberately. Broader topics require a versioned extension and new regression lessons.
