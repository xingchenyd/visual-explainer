import {makeLesson} from './scaffold-browser.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {compile} from '../packages/core/core.mjs';
export async function scaffold(target,A,B,id) {
  const ir=makeLesson(A,B,id); compile(ir);
  await mkdir(target,{recursive:true});
  await writeFile(resolve(target,'lesson.ir.json'),JSON.stringify(ir,null,2)+'\n');
  await writeFile(resolve(target,'lesson.spec.yaml'),'topic: 矩阵乘法\naudience: beginner\nlearning_goal: 理解行列配对、乘积累加与结果写入\ncore_confusion: 为什么不是对应元素相乘\nvisual_strategy: information-flow\nprerequisites: [行与列, 乘法, 加法]\nscope: 实数小矩阵的标准乘法\n');
  await writeFile(resolve(target,'sources.md'),'# 来源与示例\n\n标准矩阵乘法定义：[Interactive Linear Algebra](https://textbooks.math.gatech.edu/ila/matrix-multiplication.html)。套餐例子与数值为本课程构造，不是真实营养数据。\n');
  return ir;
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const target=resolve(process.argv[2]??'lessons/matrix-multiplication');
  await scaffold(target,process.argv[3]?JSON.parse(process.argv[3]):undefined,process.argv[4]?JSON.parse(process.argv[4]):undefined);
  console.log(target);
}

