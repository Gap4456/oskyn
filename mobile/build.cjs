const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),source=path.join(root,'source'),manifest=require(path.join(source,'manifest.json'));
const css=fs.readFileSync(path.join(__dirname,'src/mobile.css'),'utf8'),ui=fs.readFileSync(path.join(__dirname,'src/mobile.js'),'utf8');
let hooked=false,profiled=false;
const html=manifest.map(part=>{
 if(typeof part!=='string')return part.text;
 let text=fs.readFileSync(path.join(source,part),'utf8');
 if(part==='src/head.html')text=text.replace('width=device-width,initial-scale=1','width=device-width,initial-scale=1,viewport-fit=cover')+'\n<style id="oskyn-mobile-style">\n'+css+'\n</style>\n';
 // Only the mobile build enlarges timeline cells; core geometry stays identical.
 if(part==='src/app1.js'){const from='const CW = 16, RH = 26, RULER = 24;';if(!text.includes(from))throw Error('Shared timeline profile changed; update mobile adapter');text=text.replace(from,'const CW = 40, RH = 44, RULER = 40;');profiled=true;}
 if(part==='src/app3.js'){const end=text.lastIndexOf('\n})();');if(end<0)throw Error('Shared application entry point changed');text=text.slice(0,end)+'\n/* Mobile adapter: built inside the shared application scope. */\n'+ui+text.slice(end);hooked=true;}
 return text;
}).join('');
if(!hooked||!profiled)throw Error('Missing mobile build adapters');
let scripts=0;for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){new vm.Script(m[1]);scripts++;}if(scripts!==5)throw Error('Expected five shared inline scripts');
const output=path.join(__dirname,'index.html');
if(process.argv.includes('--check')){if(fs.readFileSync(output,'utf8')!==html)throw Error('mobile/index.html differs from source; run node mobile/build.cjs');}
else fs.writeFileSync(output,html);
console.log('PASS mobile build: '+Buffer.byteLength(html)+' bytes, shared core/runtime and '+scripts+' scripts');
