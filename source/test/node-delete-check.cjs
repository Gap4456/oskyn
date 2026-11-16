const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 let h=fs.readFileSync(path.join(__dirname,'../dist/oskyn.html'),'utf8'),i=h.lastIndexOf('})();\n</script>');h=h.slice(0,i)+'window.T={C,S,H,loadDoc,setTool,refreshAll,deleteNode,undo,redo};\n'+h.slice(i);
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('https://nodes.test/',r=>r.fulfill({contentType:'text/html',body:h}));await p.goto('https://nodes.test/');
  await p.evaluate(()=>{const {C,S}=T,d=C.mkDoc(),c=C.rectContour(120,80);c.nodes.splice(1,0,C.node(0,-40),C.node(30,-40));const o=C.mkPath([c,C.rectContour(60,40)],{fill:'#7755ff'},{x:200,y:200});d.layers[0].kfs[0].objs=[o];T.loadDoc(d);S.sel=[{lid:d.layers[0].id,id:o.id}];T.setTool('node');S.kNodeSelection=['0:1','0:2','1:0','1:2'];S.nodeSel=null;T.refreshAll();window.before=JSON.stringify(S.doc);window.keep=o.contours.map((c,ci)=>c.nodes.filter((_,ni)=>!S.kNodeSelection.includes(ci+':'+ni)).map(n=>[n.x,n.y]));});
  await p.keyboard.press('Delete');
  assert.deepEqual(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs[0].contours.map(c=>c.nodes.map(n=>[n.x,n.y]))),await p.evaluate(()=>keep));assert.equal(await p.evaluate(()=>T.H.stack.length),1);
  await p.evaluate(()=>T.undo());assert.deepEqual(await p.evaluate(()=>T.S.doc),await p.evaluate(()=>JSON.parse(before)));await p.evaluate(()=>T.redo());assert.deepEqual(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs[0].contours.map(c=>c.nodes.map(n=>[n.x,n.y]))),await p.evaluate(()=>keep));
  await p.evaluate(()=>{T.undo();const {S}=T;S.kNodeSelection=['0:0','0:1','0:2','0:3','0:4','0:5','1:0','1:1','1:2','1:3'];S.nodeSel={ci:0,ni:0};T.deleteNode();});assert.equal(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs.length),0);await p.evaluate(()=>T.undo());assert.equal(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs[0].contours.length),2);
  await p.evaluate(()=>{const {S}=T,l=S.doc.layers[0],o=l.kfs[0].objs[0];S.sel=[{lid:l.id,id:o.id}];S.kNodeSelection=['0:0','0:1'];S.nodeSel={ci:0,ni:0};l.locked=true;window.hist=T.H.stack.length;T.deleteNode();});assert.equal(await p.evaluate(()=>T.H.stack.length),await p.evaluate(()=>hist));assert.equal(await p.evaluate(()=>T.S.doc.layers[0].kfs[0].objs[0].contours[0].nodes.length),6);
  assert.deepEqual(errors,[]);console.log('PASS Delete removes all selected nodes across contours, preserves survivors, uses one undo, redo and whole-object removal, respects locked layers');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
