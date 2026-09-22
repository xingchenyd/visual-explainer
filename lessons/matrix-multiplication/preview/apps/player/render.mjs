const color={A:'#63deca',B:'#b7a1ff',C:'#f9cf79'};
export const fmt=x => x===null ? '·' : Number.isInteger(x) ? String(x) : Number(x.toFixed(3)).toString();
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,value,fill='#dce7f4',size=20,extra='')=>`<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" text-anchor="middle" ${extra}>${esc(value)}</text>`;
export function renderSVG(lesson,s,compact=false) {
  const W=compact?540:1040,H=compact?760:475;
  const A=lesson.ir.objects.A.data,B=lesson.ir.objects.B.data;
  const [i,j]=s.cell; const active=s.action!=='compare';
  const layout=compact?{A:[135,108],B:[405,108],C:[270,380]}:{A:[185,105],B:[520,105],C:[855,105]};
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.learningBeat)}"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#7387a3"/></marker></defs>`;
  const centers={};
  for(const [id,data,label] of [['A',A,'套餐 × 配料'],['B',B,'配料 × 营养'],['C',s.output,'套餐 × 营养']]) {
    const [cx,cy]=layout[id], rows=data.length, cols=data[0].length;
    const cell=compact?49:54; const x0=cx-cols*cell/2, y0=cy;
    svg+=text(cx,cy-47,`${id}  ${rows} × ${cols}`,color[id],23,'font-weight="700"');
    svg+=text(cx,cy-21,label,'#9cafc5',compact?18:16);
    centers[id]=[];
    data.forEach((row,r)=>{ centers[id][r]=[]; row.forEach((v,c)=>{
      const x=x0+c*cell,y=y0+r*cell; centers[id][r][c]=[x+cell/2,y+cell/2];
      const selected=active&&(id==='A'?r===i:id==='B'?c===j:r===i&&c===j);
      const pairing=selected&&s.action==='pairCells'&&(id==='A'?c===s.pair:id==='B'?r===s.pair:false);
      const written=id==='C'&&v!==null;
      svg+=`<g role="button" tabindex="0" data-object="${id}" data-row="${r}" data-col="${c}" aria-label="${id} 第${r+1}行 第${c+1}列 ${fmt(v)}"><rect x="${x+3}" y="${y+3}" width="${cell-6}" height="${cell-6}" rx="7" fill="${selected||written?color[id]:'#18263a'}" fill-opacity="${pairing?.42:selected||written?.18:1}" stroke="${selected||written?color[id]:'#2c3b50'}" stroke-width="${pairing?3:1}"/>${text(x+cell/2,y+cell/2+7,fmt(v),selected||written?color[id]:'#cbd8e8',String(fmt(v)).length>5?12:21)}</g>`;
    });});
  }
  if(!compact){svg+=text(350,160,'×','#71839d',30)+text(690,160,'=','#71839d',30);}
  const y=compact?650:375;
  if(s.action==='compare') {
    svg+=text(W/2,y-17,'套餐 → 配料 → 营养',color.C,compact?26:27);
    svg+=text(W/2,y+22,`共同的 ${A[0].length} 种配料，是两段关系之间的桥。`,'#b0c1d7',compact?19:20);
    svg+=text(W/2,y+60,'逐元素相乘：只看同一位置，不汇总中间路径。','#8da1bd',compact?17:18);
  } else if(s.action==='morphEquation') {
    svg+=text(W/2-154,y-22,'Cᵢⱼ',color.C,32)+text(W/2-70,y-22,'= Σₖ','#dce7f4',32)+text(W/2+30,y-22,'Aᵢₖ',color.A,32)+text(W/2+125,y-22,'Bₖⱼ',color.B,32);
    svg+=text(W/2,y+16,`i：套餐　 j：营养　 k：${A[0].length} 种配料`,'#c3cee0',compact?20:21);
    svg+=text(W/2,y+54,`(${A.length} × ${A[0].length}) · (${B.length} × ${B[0].length}) → ${A.length} × ${B[0].length}`,'#8da1bd',22);
  } else {
    const width=compact?120:175, start=W/2-(s.terms.length-1)*width/2;
    s.terms.forEach((t,k)=>{
      const x=start+k*width, showProduct=s.action==='accumulate'||s.action==='writeResult';
      const hot=s.action==='pairCells'?k===s.pair:k<s.completed;
      svg+=`<rect x="${x-width/2+4}" y="${y-31}" width="${width-8}" height="58" rx="8" fill="${hot?'#273a50':'#16253a'}" stroke="${hot?color.C:'#31425a'}"/>`;
      svg+=text(x,y-7,`${fmt(t.a)} × ${fmt(t.b)}`,'#dfebf7',compact?19:22);
      svg+=text(x,y+16,showProduct?`= ${fmt(t.product)}`:`配料 ${k+1}`,hot?color.C:'#91a6c2',compact?17:18);
      if(s.action==='pairCells'&&k===s.pair) {
        const a=centers.A[i][k],b=centers.B[k][j];
        const mix=(s.progress*s.terms.length)%1;
        for(const [src,col] of [[a,color.A],[b,color.B]]) {
          svg+=`<path d="M${src[0]} ${src[1]+22} Q${src[0]} ${y-65} ${x} ${y-33}" stroke="${col}" opacity=".55" stroke-width="2" fill="none" stroke-dasharray="5 5"/>`;
          const px=(1-mix)*(1-mix)*src[0]+2*(1-mix)*mix*src[0]+mix*mix*x;
          const py=(1-mix)*(1-mix)*(src[1]+22)+2*(1-mix)*mix*(y-65)+mix*mix*(y-33);
          svg+=`<circle cx="${px}" cy="${py}" r="5" fill="${col}"/>`;
        }
      }
    });
    const label=s.action==='focus'?'一行选套餐，一列选营养。':s.action==='pairCells'?'同一种配料，才能配成一对。':`${s.completed} / ${s.terms.length} 项贡献　累计 ${fmt(s.sum)}${s.action==='writeResult'?` → C[${i+1}, ${j+1}]`:''}`;
    svg+=text(W/2,y+64,label,color.C,compact?20:22);
    if(s.action==='writeResult') {
      const dest=centers.C[i][j]; const pulse=1-s.progress;
      svg+=`<rect x="${dest[0]-24-pulse*7}" y="${dest[1]-24-pulse*7}" width="${48+pulse*14}" height="${48+pulse*14}" rx="9" fill="none" stroke="${color.C}" opacity="${pulse}" stroke-width="3"/>`;
    }
  }
  return svg+'</svg>';
}
