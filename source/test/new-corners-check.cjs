const fs=require('fs'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{
 let h=fs.readFileSync(require('node:path').join(__dirname,'../dist/oskyn.html'),'utf8');
 const i=h.lastIndexOf('})();\n</script>');h=h.slice(0,i)+'window.T={C,S,H,loadDoc,setTool,refreshAll,w2s,undo,redo};\n'+h.slice(i);
 const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 try{
  const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://corner.test/',r=>r.fulfill({contentType:'text/html',body:h}));await p.goto('https://corner.test/');
  async function setup(closed,curved){await p.evaluate(({closed,curved})=>{
   const {C,S}=T,d=C.mkDoc(),ns=[{...C.node(-100,0),ox:curved?30:0,oy:curved?-90:0,ix:-20,iy:10,s:true},{...C.node(100,0),ix:curved?-30:0,iy:curved?-90:0,ox:20,oy:10,s:true},{...C.node(100,110)},{...C.node(-100,110)}];
   const o=C.mkPath([{closed,nodes:closed?ns:ns.slice(0,2)}],{fill:closed?'#6042ff':null,stroke:'#17172b',sw:2},{x:280,y:170});o.id='curve';d.layers[0].kfs[0].objs=[o];T.loadDoc(d);S.sel=[{lid:d.layers[0].id,id:o.id}];T.setTool('node');T.refreshAll();window.before=JSON.stringify(d);window.initial=T.H.stack.length;window.original=JSON.parse(JSON.stringify(o.contours[0].nodes));
  },{closed,curved});}
  async function at(x,y){const q=await p.evaluate(([x,y])=>T.w2s(x,y),[x,y]),r=await p.locator('#stage').boundingBox();return [r.x+q[0],r.y+q[1]];}
  for(const closed of [true,false]){
   await setup(closed,true);await p.mouse.dblclick(...await at(280,102.5));
   const result=await p.evaluate(()=>{
    const {C,S}=T,ns=S.doc.layers[0].kfs[0].objs[0].contours[0].nodes,t=ns[1].birth[2];let error=0;
    for(let j=0;j<=100;j++){const u=j/100,a=C.bezPt(original[0],original[1],u),q=u<=t?C.bezPt(ns[0],ns[1],u/t):C.bezPt(ns[1],ns[2],(u-t)/(1-t));error=Math.max(error,Math.hypot(a[0]-q[0],a[1]-q[1]));}
    window.inserted=JSON.stringify(S.doc);return {error,n:ns.length,corner:ns[1].s===false,hasHandles:Math.hypot(ns[1].ix,ns[1].iy)>0&&Math.hypot(ns[1].ox,ns[1].oy)>0,otherHandles:ns[0].ix===original[0].ix&&ns[0].iy===original[0].iy&&ns[2].ox===original[1].ox&&ns[2].oy===original[1].oy,history:T.H.stack.length-initial};
   });
   assert(result.error<1e-8);assert.equal(result.n,closed?5:3);assert(result.corner&&result.hasHandles&&result.otherHandles);assert.equal(result.history,1);
   await p.evaluate(()=>T.undo());assert(await p.evaluate(()=>JSON.stringify(T.S.doc)===before));await p.evaluate(()=>T.redo());assert(await p.evaluate(()=>JSON.stringify(T.S.doc)===inserted));
  }
  console.log('PASS Add node exactly preserves open/closed curves, independent corner handles, opposite handles and one Undo/Redo');
  await setup(true,false);await p.mouse.dblclick(...await at(280,170));
  assert(await p.evaluate(()=>{const ns=T.S.doc.layers[0].kfs[0].objs[0].contours[0].nodes;return ns[1].s===false&&['ix','iy','ox','oy'].every(k=>ns[1][k]===0)&&ns[0].ox===0&&ns[2].ix===0;}));
  await p.mouse.move(...await at(280,170));await p.mouse.down();await p.mouse.move(...await at(295,195),{steps:4});await p.mouse.up();
  assert(await p.evaluate(()=>{const ns=T.S.doc.layers[0].kfs[0].objs[0].contours[0].nodes;return ns[1].s===false&&['ix','iy','ox','oy'].every(k=>ns[1][k]===0)&&ns[0].ox===0&&ns[2].ix===0;}));
  console.log('PASS Add node on straight segment stays a zero-handle corner; dragging keeps both adjacent segments straight');
  assert.deepEqual(errors,[]);
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
