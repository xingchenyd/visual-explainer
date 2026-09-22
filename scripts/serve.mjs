import http from 'node:http';import {readFile,stat} from 'node:fs/promises';import {resolve,sep,extname} from 'node:path';
const root=resolve(process.argv[2]??'lessons/matrix-multiplication/preview');const port=Number(process.argv[3]??4317);
http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(root,'.'+pathname);
    if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    const data=await readFile(file);const headers={'Content-Type':({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.mp4':'video/mp4','.png':'image/png','.wav':'audio/wav'})[extname(file)]??'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
    if(req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);let start,end;
      if(match&&(match[1]||match[2])){start=match[1]?Number(match[1]):Math.max(0,data.length-Number(match[2]));end=match[1]&&match[2]?Math.min(data.length-1,Number(match[2])):data.length-1;}
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`}).end();return;}
      res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${data.length}`}).end(req.method==='HEAD'?undefined:data.subarray(start,end+1));
    }else res.writeHead(200,{...headers,'Content-Length':data.length}).end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port} serving ${root}`));
