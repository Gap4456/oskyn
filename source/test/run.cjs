const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
for(const file of fs.readdirSync(__dirname).filter(f=>f.endsWith('.cjs')&&f!=='run.cjs').sort()){
 console.log('\nTesting '+file);const r=spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:'inherit',env:process.env});
 if(r.status!==0)process.exit(r.status||1);
}
