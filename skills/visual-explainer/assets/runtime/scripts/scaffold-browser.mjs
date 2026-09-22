import {matrixShape} from '../packages/core/core.mjs';
export function makeLesson(A=[[1,2,3],[4,5,6]],B=[[1,2],[3,4],[5,6]],id='matrix-multiplication') {
  const [m,n]=matrixShape(A); const [b,p]=matrixShape(B); if(n!==b) throw new Error('A columns must match B rows');
  const scenes=[];
  const add=(id,action,duration,learningBeat,narration,cell)=>scenes.push({id,action,duration,learningBeat,narration,binding:'product',...(cell?{cell}:{})});
  add('why-compose','compare',8,'矩阵乘法，连接两段关系','A 把配料映射到套餐，B 把营养映射到配料。连接中间的配料，才能算出每份套餐的营养。');
  for(let i=0;i<m;i++) for(let j=0;j<p;j++) {
    const suffix=`${i}-${j}`, first=i===0&&j===0;
    add(`focus-${suffix}`,'focus',first?5:2,'选一行，再选一列',`A 第 ${i+1} 行表示一份套餐用了哪些配料；B 第 ${j+1} 列表示每种配料提供多少同一种营养。`,[i,j]);
    add(`pair-${suffix}`,'pairCells',first?7:2,'沿共同维度，一项一项配对','相同配料才配对：套餐中的用量，乘以这份配料的营养含量。',[i,j]);
    add(`sum-${suffix}`,'accumulate',first?9:3,'把每种配料的贡献加起来','每个乘积是一条中间路径的贡献。所有配料的贡献相加，得到这个输出格。',[i,j]);
    add(`write-${suffix}`,'writeResult',first?4:2,'将总和写回对应输出格',`结果写入 C 的第 ${i+1} 行、第 ${j+1} 列；它代表这份套餐的这一种营养总量。`,[i,j]);
  }
  add('generalize','morphEquation',9,'公式，是刚才配对和累加的缩写','i 选套餐，j 选营养，k 遍历配料。因此 A 的列数必须等于 B 的行数。对应元素相乘不会把中间路径汇总。');
  return {version:'0.1',lessonId:id,title:'为什么矩阵乘法不是对应元素相乘？',goal:'看懂一个输出格如何由一行与一列配对、相乘、累加得到。',objects:{A:{type:'matrix',role:'input',data:A},B:{type:'matrix',role:'weight',data:B},C:{type:'matrix',role:'result'}},bindings:{product:{op:'matmul',left:'A',right:'B'}},scenes,sources:['https://textbooks.math.gatech.edu/ila/matrix-multiplication.html'],assumptions:['使用实数小矩阵，按标准行列乘法定义计算。','套餐、配料与营养是线性加总的教学模型；示例数字是虚构单位。','逐元素乘法是另一种运算（Hadamard 积），要求两个矩阵形状相同。','当前渲染器支持每个维度 1–4，输入绝对值不超过 999；显示值四舍五入至 3 位小数，计算保留浮点精度。']};
}

