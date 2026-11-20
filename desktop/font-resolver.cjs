// The renderer supplies a family/style, never a path. Only static fonts from
// known OS font folders are indexed and returned through the narrow IPC bridge.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
let opentype;
function parser(){return opentype||(opentype=require(require('node:fs').existsSync(path.join(__dirname,'opentype.cjs'))?'./opentype.cjs':'../source/src/vendor/opentype.min.js'));}
function fontRoots(platform=process.platform,env=process.env,home=os.homedir()){
  if(platform==='win32')return [path.join(env.WINDIR||'C:\\Windows','Fonts'),env.LOCALAPPDATA&&path.join(env.LOCALAPPDATA,'Microsoft','Windows','Fonts')].filter(Boolean);
  if(platform==='darwin')return ['/System/Library/Fonts','/Library/Fonts',path.join(home,'Library','Fonts')];
  return ['/usr/share/fonts','/usr/local/share/fonts',path.join(home,'.fonts'),path.join(home,'.local','share','fonts')];
}
const key=s=>s.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[\s_-]+/g,'').trim();
function validQuery(q){return !!q&&typeof q.family==='string'&&q.family.trim().length>0&&q.family.length<=200&&typeof q.bold==='boolean'&&typeof q.italic==='boolean';}
function createFontResolver(roots=fontRoots()){
  let indexPromise;
  async function scan(){
    const records=[],seen=new Set();let count=0;
    async function folder(dir,depth=0){
      if(depth>12||count>10000)return;
      let entries;try{entries=await fs.readdir(dir,{withFileTypes:true});}catch{return;}
      entries.sort((a,b)=>a.name.localeCompare(b.name));
      for(const entry of entries){
        if(count>10000)return;
        const file=path.join(dir,entry.name);
        // No directory/file symlinks: stay inside the configured font folders.
        if(entry.isDirectory()){await folder(file,depth+1);continue;}
        if(!entry.isFile()||! /\.(ttf|otf)$/i.test(entry.name))continue;
        count++;
        try{
          const stat=await fs.stat(file);if(stat.size>20*1024*1024)continue;
          const bytes=await fs.readFile(file),font=parser().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),{lowMemory:true});
          if(font.tables.fvar)continue;
          const names=font.names,families=[...Object.values(names.fontFamily||{}),...Object.values(names.preferredFamily||{})];
          const style=Object.values(names.fontSubfamily||{}).join(' '),flags=font.tables.os2?.fsSelection||0,mac=font.tables.head?.macStyle||0;
          const bold=!!(flags&32||mac&1||(font.tables.os2?.usWeightClass||0)>=600||/\b(bold|demi|semibold)\b/i.test(style));
          const italic=!!(flags&1||mac&2||/italic|oblique/i.test(style));
          // Do not silently substitute a condensed/light/black face for Regular/Bold.
          const weight=font.tables.os2?.usWeightClass||(/bold/i.test(style)?700:400);
          if(weight!==(bold?700:400)||/condensed|narrow|expanded/i.test(style))continue;
          const identities=families.map(key).filter(Boolean);if(!identities.length)continue;
          const identity=identities.join('|')+bold+italic;if(seen.has(identity))continue;seen.add(identity);
          records.push({file,families:identities,bold,italic,name:names.fullName?.en||families[0]});
        }catch{/* A damaged or unsupported font must not block other families. */}
      }
    }
    for(const root of roots)await folder(root);
    return records;
  }
  return async query=>{
    if(!validQuery(query))throw Error('Invalid font request');
    const records=await (indexPromise||(indexPromise=scan()));
    const record=records.find(r=>r.families.includes(key(query.family))&&r.bold===query.bold&&r.italic===query.italic);
    if(!record)return {found:false};
    try{
      const stat=await fs.stat(record.file);if(stat.size>20*1024*1024)return {found:false};
      const data=await fs.readFile(record.file);
      return {found:true,name:record.name,data:new Uint8Array(data)};
    }catch{return {found:false};}
  };
}
module.exports={createFontResolver,fontRoots,validQuery};
