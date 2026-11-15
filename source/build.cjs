const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=__dirname,manifest=require('./manifest.json');
const html=manifest.map(part=>typeof part==='string'?fs.readFileSync(path.join(base,part),'utf8'):part.text).join('');
let count=0;for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){new vm.Script(m[1]);count++;}
if(count!==5)throw Error('Expected five inline scripts');
const outputs=['dist/oskyn.html','../oskyn.html','../index.html'];
if(process.argv.includes('--check')){
 for(const name of outputs.slice(1))if(fs.readFileSync(path.join(base,name),'utf8')!==html)throw Error(name+' differs from source; run npm run build');
}else for(const name of outputs){const p=path.join(base,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,html);}
// Tests always read the assembled file, including after a fresh checkout.
fs.mkdirSync(path.join(base,'dist'),{recursive:true});fs.writeFileSync(path.join(base,'dist/oskyn.html'),html);
console.log('PASS reproducible build: '+Buffer.byteLength(html)+' bytes, '+count+' scripts');
