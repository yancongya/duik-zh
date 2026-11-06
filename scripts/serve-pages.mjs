import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('out'),base='/duik-zh',port=Number(process.env.PORT||3018);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.avif':'image/avif','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.woff2':'font/woff2','.wasm':'application/wasm','.ico':'image/x-icon','.txt':'text/plain','.xml':'application/xml','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname===base){res.writeHead(301,{Location:base+'/'});res.end();return;}
    if(!url.pathname.startsWith(base+'/'))throw Error('Outside Pages base');
    let file=path.resolve(root,'.'+decodeURIComponent(url.pathname.slice(base.length)));
    if(!file.startsWith(root+path.sep)&&file!==root)throw Error('Invalid path');
    let info=await stat(file);
    if(info.isDirectory()){
      if(!url.pathname.endsWith('/')){res.writeHead(301,{Location:url.pathname+'/'+url.search});res.end();return;}
      file=path.join(file,'index.html');
    }
    const body=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Static Pages preview: http://127.0.0.1:${port}${base}/`));
