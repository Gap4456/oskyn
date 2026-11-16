const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const port=Number(process.env.OSKYN_MOBILE_PORT||8080),file=path.join(__dirname,'index.html');
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid OSKYN_MOBILE_PORT');
http.createServer((request,response)=>{
  const pathname=new URL(request.url,'http://localhost').pathname;
  if(!['/','/index.html'].includes(pathname)){response.writeHead(pathname==='/favicon.ico'?204:404);response.end();return;}
  response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});fs.createReadStream(file).pipe(response);
}).listen(port,'0.0.0.0',()=>console.log('oskyn Mobile preview: http://localhost:'+port+'\nOn your phone, use this computer\'s LAN address on the same Wi-Fi. Ctrl+C stops the server.'));
