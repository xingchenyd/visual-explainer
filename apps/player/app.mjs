import {compile,stateAt,stepTime,questionContext} from '../../packages/core/core.mjs';
import {makeLesson} from '../../scripts/scaffold-browser.mjs';
import {renderSVG,fmt} from './render.mjs';
const $=id=>document.getElementById(id);
let lesson,time=0,playing=false,speed=1,last=null,selected=null;
function draw(){
  const s=stateAt(lesson,time); $('stage').innerHTML=renderSVG(lesson,s,innerWidth<700);
  $('beat').textContent=s.learningBeat; $('caption').textContent=s.narration;
  $('scene-count').textContent=String(s.index+1).padStart(2,'0')+' / '+lesson.scenes.length;
  $('clock').textContent=`${time.toFixed(1)} / ${lesson.duration.toFixed(0)} s`;
  $('seek').value=time; $('play').textContent=playing?'暂停':time>=lesson.duration?'重播':'播放';
  $('previous').disabled=time<=0; $('next').disabled=time>=lesson.duration;
  for(const b of $('chapters').children)b.classList.toggle('active',Number(b.dataset.index)===s.index);
}
function seek(t){time=Math.max(0,Math.min(lesson.duration,t));last=null;draw();}
function load(ir){lesson=compile(ir);time=0;playing=false;last=null;selected=null;
  $('goal').textContent=ir.goal;$('seek').max=lesson.duration;
  document.querySelector('.intro-note p').textContent=`把「套餐 → 配料」和「配料 → 营养」连接起来。用 ${lesson.duration} 秒，亲手走完一次矩阵乘法。`;
  $('input-a').value=JSON.stringify(ir.objects.A.data);$('input-b').value=JSON.stringify(ir.objects.B.data);
  $('chapters').replaceChildren();
  lesson.scenes.forEach((s,index)=>{if(index===0||s.action==='focus'||s.action==='morphEquation'){const b=document.createElement('button');b.textContent=s.cell?`C[${s.cell.map(x=>x+1).join(',')}]` : s.action==='compare'?'两段关系':'通用公式';b.dataset.index=index;b.onclick=()=>{playing=false;seek(s.start);};$('chapters').append(b);}});
  $('sources').replaceChildren();for(const source of ir.sources){const p=document.createElement('p');const a=document.createElement('a');a.textContent=source;if(/^https?:\/\//.test(source)){a.href=source;a.target='_blank';a.rel='noreferrer';}p.append(a);$('sources').append(p);}
  for(const assumption of ir.assumptions){const p=document.createElement('p');p.textContent=assumption;$('sources').append(p);}
  $('explanation').textContent='';$('context').textContent='';draw();
}
$('play').onclick=()=>{if(time>=lesson.duration)time=0;playing=!playing;last=null;draw();};
$('previous').onclick=()=>{playing=false;seek(stepTime(lesson,time,-1));};
$('next').onclick=()=>{playing=false;seek(stepTime(lesson,time,1));};
$('seek').oninput=e=>{playing=false;seek(Number(e.target.value));};
$('speed').onchange=e=>{speed=Number(e.target.value);last=null;};
$('captions').onclick=()=>{const hidden=$('caption').style.visibility==='hidden';$('caption').style.visibility=hidden?'visible':'hidden';$('captions').textContent=hidden?'字幕 开':'字幕 关';$('captions').setAttribute('aria-pressed',String(hidden));};
$('apply').onclick=()=>{try{const ir=makeLesson(JSON.parse($('input-a').value),JSON.parse($('input-b').value));load(ir);$('error').textContent='';}catch(e){$('error').textContent=e.message;}};
function choose(e){const target=e.target.closest('[data-object]');if(!target)return;selected={id:target.dataset.object,row:Number(target.dataset.row),col:Number(target.dataset.col)};playing=false;draw();$('explanation').textContent=`已选择 ${selected.id}[${selected.row+1}, ${selected.col+1}]，点击“用路径再讲一次”查看。`;}
$('stage').onclick=choose;$('stage').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(e);}};
$('explain').onclick=()=>{
  playing=false;draw();const s=stateAt(lesson,time);let [i,j]=s.cell;
  if(selected){if(selected.id==='A')i=selected.row;else if(selected.id==='B')j=selected.col;else{i=selected.row;j=selected.col;}}
  const calc=lesson.calculations[i][j];
  const ctx=questionContext(lesson,time,$('question').value,selected?.id);ctx.cell=[i,j];if(selected)ctx.selectedCell=selected;
  $('context').textContent=JSON.stringify(ctx,null,2);
  $('explanation').textContent=`路径视角：从套餐 ${i+1} 到营养 ${j+1}，有 ${calc.terms.length} 条经过不同配料的路径。${calc.terms.map(t=>`经配料 ${t.k+1}：${fmt(t.a)} × ${fmt(t.b)} = ${fmt(t.product)}`).join('；')}。把这些路径的贡献相加，得到 ${fmt(calc.value)}。这是预置的局部解释；你的问题和位置已记录在下方，尚未连接 AI 回答服务。`;
};
addEventListener('resize',()=>lesson&&draw());
document.addEventListener('visibilitychange',()=>{last=null;});
function tick(now){if(lesson&&playing){if(last!==null)time=Math.min(lesson.duration,time+(now-last)/1000*speed);last=now;if(time>=lesson.duration)playing=false;draw();}requestAnimationFrame(tick);}
try{const response=await fetch('./lesson.ir.json');if(!response.ok)throw new Error(`课程加载失败 HTTP ${response.status}`);load(await response.json());requestAnimationFrame(tick);}catch(e){$('error').textContent=e.message;document.querySelectorAll('.transport button').forEach(b=>b.disabled=true);}
// Stable debugging contract: snapshots use the same pure function as playback.
window.lessonPlayer={seek:t=>{playing=false;seek(t);},snapshot:()=>structuredClone(stateAt(lesson,time)),getIR:()=>structuredClone(lesson.ir),load,get playing(){return playing;}};
