const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..'),out=path.join(__dirname,'dist'),app=path.join(out,'app');
(async()=>{
  execFileSync(process.execPath,[path.join(root,'source/build.cjs')],{stdio:'inherit'});
  fs.mkdirSync(app,{recursive:true});
  for(const name of ['main.cjs','preload.cjs','font-resolver.cjs'])fs.copyFileSync(path.join(__dirname,name),path.join(app,name));
  for(const name of ['oskyn.html','LICENSE','THIRD-PARTY.md'])fs.copyFileSync(path.join(root,name),path.join(app,name));
  fs.copyFileSync(path.join(root,'source/src/vendor/opentype.min.js'),path.join(app,'opentype.cjs'));
  fs.cpSync(path.join(root,'licenses'),path.join(app,'licenses'),{recursive:true});
  fs.writeFileSync(path.join(app,'package.json'),JSON.stringify({name:'oskyn',version:require('./package.json').version,main:'main.cjs'},null,2)+'\n');
  await require('@electron/asar').createPackage(app,path.join(out,'app.asar'));
  console.log('Built '+path.join(out,'app.asar'));
})().catch(e=>{console.error(e);process.exitCode=1;});
