import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {compile} from '../packages/core/core.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=resolve(process.argv[2]??resolve(root,'lessons/matrix-multiplication/lesson.ir.json'));
const compiled=compile(JSON.parse(await readFile(source,'utf8')));
await mkdir(resolve(dirname(source),'data'),{recursive:true});
await writeFile(resolve(dirname(source),'data/calculations.json'),JSON.stringify(compiled.calculations,null,2));
const output=resolve(process.argv[3]??resolve(dirname(source),'preview'));
for(const file of ['apps/player/index.html','apps/player/style.css','apps/player/app.mjs','apps/player/render.mjs','packages/core/core.mjs','scripts/scaffold-browser.mjs']){
  const dest=resolve(output,file);await mkdir(dirname(dest),{recursive:true});await copyFile(resolve(root,file),dest);
}
await copyFile(source,resolve(output,'apps/player/lesson.ir.json'));
await writeFile(resolve(output,'index.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./apps/player/"><a href="./apps/player/">打开交互课程</a>');
const strip=s=>s.replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
const irText=(await readFile(source,'utf8')).replace(/</g,'\\u003c');
let app=strip(await readFile(resolve(root,'apps/player/app.mjs'),'utf8'));
app=app.replace("const response=await fetch('./lesson.ir.json');if(!response.ok)throw new Error(`课程加载失败 HTTP ${response.status}`);load(await response.json());",()=>`load(${irText});`);
const bundle=(await Promise.all(['packages/core/core.mjs','scripts/scaffold-browser.mjs','apps/player/render.mjs'].map(p=>readFile(resolve(root,p),'utf8')))).map(strip).join('\n')+'\n'+app;
let html=await readFile(resolve(root,'apps/player/index.html'),'utf8');
const css=await readFile(resolve(root,'apps/player/style.css'),'utf8');
html=html.replace('<link rel="stylesheet" href="./style.css">',()=>`<style>${css}</style>`).replace('<script type="module" src="./app.mjs"></script>',()=>`<script type="module">${bundle.replace(/<\/script/gi,'<\\/script')}</script>`);
await writeFile(resolve(output,'standalone.html'),html);
console.log(`Built ${output}`);
