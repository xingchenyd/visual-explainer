/** Pure, replayable matrix lesson compiler and timeline. No DOM, clock, eval or mutable history. */
export class LessonError extends Error {
  constructor(path, message) { super(`${path}: ${message}`); this.name = 'LessonError'; this.path = path; }
}
const fail = (p, m) => { throw new LessonError(p, m); };
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const keys = (x, allowed, p) => { if (!plain(x)) fail(p, 'expected object'); for (const k of Object.keys(x)) if (!allowed.includes(k)) fail(`${p}.${k}`, 'unknown field'); };
const str = (x, p) => { if (typeof x !== 'string' || !x.trim()) fail(p, 'expected nonempty string'); };
const finite = (x, p) => { if (!Number.isFinite(x)) fail(p, 'expected finite number'); };
export function matrixShape(a, p = '$.matrix') {
  if (!Array.isArray(a) || a.length < 1 || a.length > 4) fail(p, 'expected 1–4 rows');
  const n = Array.isArray(a[0]) ? a[0].length : 0;
  if (n < 1 || n > 4) fail(p, 'expected 1–4 columns');
  a.forEach((r, i) => {
    if (!Array.isArray(r) || r.length !== n) fail(`${p}[${i}]`, 'ragged matrix');
    r.forEach((v, j) => { finite(v, `${p}[${i}][${j}]`); if (Math.abs(v) > 999) fail(`${p}[${i}][${j}]`, 'absolute value must be ≤999'); });
  });
  return [a.length, n];
}
export const ACTIONS = ['compare', 'focus', 'pairCells', 'accumulate', 'writeResult', 'morphEquation'];
export function validateIR(ir) {
  keys(ir, ['version','lessonId','title','goal','objects','bindings','scenes','sources','assumptions'], '$');
  if (ir.version !== '0.1') fail('$.version', 'supported version is 0.1');
  ['lessonId','title','goal'].forEach(k => str(ir[k], `$.${k}`));
  keys(ir.objects, ['A','B','C'], '$.objects');
  for (const id of ['A','B','C']) {
    const o = ir.objects[id]; keys(o, id === 'C' ? ['type','role'] : ['type','role','data'], `$.objects.${id}`);
    if (o.type !== 'matrix') fail(`$.objects.${id}.type`, 'unknown primitive');
    if (o.role !== ({A:'input',B:'weight',C:'result'})[id]) fail(`$.objects.${id}.role`, 'invalid semantic role');
  }
  const [m, n] = matrixShape(ir.objects.A.data, '$.objects.A.data');
  const [b, p] = matrixShape(ir.objects.B.data, '$.objects.B.data');
  if (n !== b) fail('$.objects.B.data', `dimension mismatch: A columns ${n} ≠ B rows ${b}`);
  keys(ir.bindings, ['product'], '$.bindings');
  keys(ir.bindings.product, ['op','left','right'], '$.bindings.product');
  if (JSON.stringify([ir.bindings.product.op,ir.bindings.product.left,ir.bindings.product.right]) !== '["matmul","A","B"]') fail('$.bindings.product', 'only matmul(A,B) is supported');
  if (!Array.isArray(ir.scenes) || !ir.scenes.length) fail('$.scenes', 'expected scenes');
  const ids = new Set(); let total = 0;
  ir.scenes.forEach((s, i) => {
    const q = `$.scenes[${i}]`; keys(s, ['id','learningBeat','narration','action','duration','binding','cell'], q);
    for (const k of ['id','learningBeat','narration']) str(s[k], `${q}.${k}`);
    if (ids.has(s.id)) fail(`${q}.id`, 'duplicate ID'); ids.add(s.id);
    if (!ACTIONS.includes(s.action)) fail(`${q}.action`, `unknown primitive ${s.action}`);
    finite(s.duration, `${q}.duration`); if (s.duration <= 0 || s.duration > 30) fail(`${q}.duration`, 'expected (0,30] seconds'); total += s.duration;
    if (s.binding !== 'product') fail(`${q}.binding`, 'unresolved binding');
    if (['focus','pairCells','accumulate','writeResult'].includes(s.action)) {
      if (!Array.isArray(s.cell) || s.cell.length !== 2 || !s.cell.every(Number.isInteger) || s.cell[0] < 0 || s.cell[0] >= m || s.cell[1] < 0 || s.cell[1] >= p) fail(`${q}.cell`, 'result cell out of bounds');
    } else if (s.cell !== undefined) fail(`${q}.cell`, 'cell not applicable');
  });
  if (total > 300) fail('$.scenes', 'maximum duration is 300 seconds');
  for (const k of ['sources','assumptions']) {
    if (!Array.isArray(ir[k]) || !ir[k].length) fail(`$.${k}`, 'expected nonempty array');
    ir[k].forEach((v,i) => str(v, `$.${k}[${i}]`));
  }
  // A write must follow a complete accumulation; every output must be produced exactly once.
  const written = new Set(); const stages = new Map();
  ir.scenes.forEach((s, i) => {
    if (!s.cell) return;
    const key = s.cell.join(','); const previous = stages.get(key);
    const required = {pairCells:'focus', accumulate:'pairCells', writeResult:'accumulate'}[s.action];
    if (required && previous !== required) fail(`$.scenes[${i}].action`, `expected preceding ${required} for C[${key}]`);
    if (written.has(key)) fail(`$.scenes[${i}].cell`, 'result already written');
    stages.set(key, s.action); if (s.action === 'writeResult') written.add(key);
  });
  if (written.size !== m*p) fail('$.scenes', 'every result cell must be accumulated and written');
  return ir;
}
export function matmul(A, B) {
  const [m,n] = matrixShape(A); const [b,p] = matrixShape(B);
  if (n !== b) fail('$.B', 'dimension mismatch');
  return Array.from({length:m}, (_,i) => Array.from({length:p}, (_,j) => {
    const terms = A[i].map((a,k) => ({k, a, b:B[k][j], product:a*B[k][j]}));
    let sum = 0; const partials = terms.map(t => sum += t.product);
    return {terms, partials, value:sum};
  }));
}
const freeze = x => { if (x && typeof x === 'object') { Object.values(x).forEach(freeze); Object.freeze(x); } return x; };
export function compile(ir) {
  validateIR(ir); const copy = structuredClone(ir); let cursor = 0;
  const scenes = copy.scenes.map(s => { const start = cursor; cursor += s.duration; return {...s,start,end:cursor}; });
  return freeze({ir:copy, scenes, duration:cursor, calculations:matmul(copy.objects.A.data,copy.objects.B.data)});
}
export function stateAt(lesson, time) {
  finite(time, '$.time'); const t = Math.min(lesson.duration, Math.max(0,time));
  const index = t === lesson.duration ? lesson.scenes.length-1 : lesson.scenes.findIndex(s => t < s.end);
  const scene = lesson.scenes[index]; const progress = Math.min(1,(t-scene.start)/scene.duration);
  const [i,j] = scene.cell ?? [0,0]; const calc = lesson.calculations[i][j]; const count = calc.terms.length;
  const output = lesson.calculations.map(row => row.map(() => null));
  lesson.scenes.forEach(s => { if (s.action === 'writeResult' && t >= s.start) output[s.cell[0]][s.cell[1]] = lesson.calculations[s.cell[0]][s.cell[1]].value; });
  const completed = scene.action === 'accumulate' ? Math.min(count,Math.floor(progress*count)) : ['writeResult','morphEquation'].includes(scene.action) ? count : 0;
  const pair = Math.min(count-1,Math.floor(progress*count));
  return {time:t,index,sceneId:scene.id,action:scene.action,progress,cell:[i,j],pair,completed,terms:calc.terms,partials:calc.partials,sum:completed ? calc.partials[completed-1] : 0,result:calc.value,output,focusedObjectIds:scene.action === 'compare' ? ['A','B'] : ['A','B','C'],narration:scene.narration,learningBeat:scene.learningBeat};
}
export function stepTime(lesson, time, direction) {
  const marks = [...new Set([0,lesson.duration,...lesson.scenes.flatMap(s => [s.start,...(s.action === 'accumulate' ? Array.from({length:lesson.calculations[s.cell[0]][s.cell[1]].terms.length},(_,k) => s.start + s.duration*(k+1)/lesson.calculations[s.cell[0]][s.cell[1]].terms.length) : [])])])].sort((a,b)=>a-b);
  return direction > 0 ? marks.find(t => t > time+1e-8) ?? lesson.duration : marks.filter(t => t < time-1e-8).at(-1) ?? 0;
}
export function questionContext(lesson,time,userQuestion,objectId) {
  const s=stateAt(lesson,time);
  return {lessonId:lesson.ir.lessonId,sceneId:s.sceneId,time:s.time,focusedObjectIds:objectId ? [objectId] : s.focusedObjectIds,cell:s.cell,userQuestion};
}
