/* Text outlines use locally supplied static fonts; no font file is uploaded or
   serialized. Resulting paths remain usable without the font or this parser. */
const TEXT_PATH_FONTS=new Map();
function textPathsSelection(){
  const selected=selEval();if(selected.length!==1||selected[0].o.kind!=='text'||REC.armed)return null;
  const one=selected[0],l=getLayer(one.lid);
  return l&&l.visible&&!l.locked&&!one.o.bind&&!one.o.sbind?one:null;
}
function textFontKey(r){return JSON.stringify([r.font||'Arial',!!r.b,!!r.i]);}
function textFontLabel(r){return (r.font||'Arial')+(r.b?' Bold':'')+(r.i?' Italic':'');}
function fontPathContours(commands){
  const contours=[];let c=null,last=null;
  function end(){if(c&&c.nodes.length>1){
    const a=c.nodes[0],b=c.nodes.at(-1);
    if(c.closed&&Math.hypot(a.x-b.x,a.y-b.y)<1e-7){a.ix=b.ix;a.iy=b.iy;c.nodes.pop();}
    if(c.nodes.length>1)contours.push(c);
  }c=null;last=null;}
  for(const cmd of commands){
    if(cmd.type==='M'){end();c={closed:false,nodes:[C.node(cmd.x,cmd.y)]};last=c.nodes[0];}
    else if(cmd.type==='Z'){if(c)c.closed=true;end();}
    else if(c){const n=C.node(cmd.x,cmd.y);
      if(cmd.type==='C'){last.ox=cmd.x1-last.x;last.oy=cmd.y1-last.y;n.ix=cmd.x2-n.x;n.iy=cmd.y2-n.y;}
      else if(cmd.type==='Q'){last.ox=(cmd.x1-last.x)*2/3;last.oy=(cmd.y1-last.y)*2/3;n.ix=(cmd.x1-n.x)*2/3;n.iy=(cmd.y1-n.y)*2/3;}
      else if(cmd.type!=='L')throw Error('Unsupported font outline command: '+cmd.type);
      c.nodes.push(n);last=n;
    }
  }end();return contours;
}
function textPathObjects(source,fonts){
  const out=[],measure=document.createElement('canvas').getContext('2d'),layout=C.layoutText(source);
  const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});
  for(const line of layout.lines){let x=line.x;
    for(const seg of line.segs){
      const r=seg.r,record=fonts.get(textFontKey(r));if(!record)throw Error('Choose the font file for '+textFontLabel(r)+'.');
      const font=record.font,size=r.size||16;
      measure.font=(r.i?'italic ':'')+(r.b?'bold ':'')+size+'px "'+(r.font||'Arial')+'", Helvetica, Arial, sans-serif';
      measure.textBaseline='top';const metric=measure.measureText('Hg');
      // Canvas draws text from its top baseline; font outlines use alphabetic.
      const drop=Number.isFinite(metric.alphabeticBaseline)?-metric.alphabeticBaseline:font.ascender/font.unitsPerEm*size;
      measure.textBaseline='alphabetic';
      let prefix='';
      for(const part of segmenter.segment(seg.t)){
        const cluster=part.segment,letters=cluster.normalize('NFC');
        if(!/^\s+$/u.test(cluster)){
          if(/[\u0590-\u08ff\u0900-\u0dff\u200d]/u.test(letters))throw Error('Joined-script and emoji shaping is not supported by Text to paths yet.');
          for(const char of letters)if(!font.charToGlyphIndex(char))throw Error('The chosen font has no glyph for “'+char+'”. Choose a matching font with that character.');
          const dx=prefix?measure.measureText(prefix+cluster).width-measure.measureText(cluster).width:0;
          const px=x+dx+(source.ls||0)*Array.from(prefix).length;
          const glyph=font.getPath(letters,px,line.y+drop,size,{kerning:true,features:{liga:false,rlig:false}});
          const contours=fontPathContours(glyph.commands);
          if(contours.length){
            const o=C.mkPath(contours,{fill:r.c||source.fill||'#000000',fa:C.nz(source.fa,1),stroke:null},source.t);
            o.op=C.nz(source.op,1);o.blur=source.blur||0;o.nz=true;o.name=cluster;
            C.recenter(o);out.push(o);
          }
        }prefix+=cluster;
      }x+=seg.w;
    }
  }
  if(!out.length)throw Error('The selected text has no visible letter outlines.');return out;
}
function textFontRecord(data){
  const font=opentype.parse(data);
  if(font.tables.fvar)throw Error('Choose a static font file; variable fonts are not supported yet.');
  const family=font.names.fontFamily?.en||Object.values(font.names.fontFamily||{})[0]||'Font';
  const sub=font.names.fontSubfamily?.en||Object.values(font.names.fontSubfamily||{})[0]||'';
  return {font,name:family+' '+sub};
}
function openTextPaths(){
  const one=textPathsSelection();if(!one)return;
  if(typeof opentype==='undefined'||!Intl.Segmenter){protest('Text to paths is unavailable in this browser.');return;}
  const doc=S.doc,frame=S.frame,scope=JSON.stringify(S.edit),original=JSON.stringify(one.o);
  const specs=[...new Map(one.o.runs.filter(r=>String(r.t).trim()).map(r=>[textFontKey(r),r])).entries()];
  if(!specs.length){protest('Select text containing visible letters.');return;}
  const nativeFont=typeof window.onionskynDesktop?.resolveSystemFont==='function';
  const fonts=new Map(),body=openModal('Convert text to paths',
    (nativeFont?'<p>oskyn looks for the matching installed font automatically. If it cannot find a supported static font, choose its TTF or OTF file manually.</p>':'<p>Choose the exact static TTF or OTF font file for each style. Fonts stay on this device. A different font or an existing browser fallback can change letter shapes.</p>')+specs.map(([key,r],i)=>'<div style="margin:12px 0"><label for="textFont'+i+'">'+escH(textFontLabel(r))+'</label><input type="file" id="textFont'+i+'" accept=".ttf,.otf" style="display:'+(nativeFont?'none':'block')+';max-width:100%;margin-top:4px">'+(nativeFont?'<button class="btn" type="button" id="textFontManual'+i+'" style="margin-top:4px">Choose manually…</button>':'')+'<div class="hint" id="textFontStatus'+i+'"></div></div>').join('')+'<p class="hint">Each letter becomes a separate path; holes and accents stay together. Text editing is replaced by node editing. Undo restores the text.</p><p id="textPathError" role="status"></p>',
    [{label:'Cancel'},{label:'Convert to paths',primary:true,keep:true,fn:()=>{
      if(convert.disabled)return;
      try{
        const current=textPathsSelection();
        if(S.doc!==doc||S.frame!==frame||JSON.stringify(S.edit)!==scope||!current||current.id!==one.id||current.lid!==one.lid||JSON.stringify(current.o)!==original)throw Error('The selection changed. Close this dialog and select the text again.');
        const result=textPathObjects(current.o,fonts);
        // Complete all parsing and validation before creating the single Undo.
        pushUndo();const layer=getLayer(one.lid),keyframe=C.insertKeyframe(layer,frame,false),at=keyframe.objs.findIndex(o=>o.id===one.id);
        keyframe.objs.splice(at,1,...result);S.sel=result.map(o=>({lid:one.lid,id:o.id}));
        S.nodeSel=null;S.kNodeSelection=[];S.multiNodeRefs=[];commit();refreshAll();closeModal();toast('Converted text to '+result.length+' letter path(s).');
      }catch(error){$('#textPathError').textContent=error.message||String(error);}
    }}]);
  const convert=$('#mFoot .primary');
  function sync(){convert.disabled=specs.some(([key])=>!fonts.has(key));}
  for(const [i,[key,r]] of specs.entries()){
    const input=$('#textFont'+i,body),status=$('#textFontStatus'+i,body);
    function show(record){fonts.set(key,record);status.textContent='Loaded: '+record.name;sync();}
    const cached=TEXT_PATH_FONTS.get(key);if(cached)show(cached);
    let generation=0;
    if(nativeFont){
      $('#textFontManual'+i,body).addEventListener('click',()=>input.click());
      if(!cached){
        const gen=++generation;status.textContent='Looking for the installed font…';
        window.onionskynDesktop.resolveSystemFont({family:r.font||'Arial',bold:!!r.b,italic:!!r.i}).then(result=>{
          if(gen!==generation||!modalBg.classList.contains('on'))return;
          if(!result?.found){status.textContent='No matching static font found. Choose a TTF/OTF file manually.';return;}
          const bytes=result.data instanceof Uint8Array?result.data:new Uint8Array(result.data);
          const record=textFontRecord(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
          TEXT_PATH_FONTS.set(key,record);show(record);status.textContent='Found installed font: '+record.name;
        }).catch(()=>{if(gen===generation)status.textContent='Automatic font lookup is unavailable. Choose a font file manually.';});
      }
    }
    input.addEventListener('change',async()=>{
      const gen=++generation,file=input.files?.[0];fonts.delete(key);sync();if(!file)return;
      status.textContent='Reading font…';
      try{
        if(file.size>20*1024*1024)throw Error('Choose a font file smaller than 20 MB.');
        const record=textFontRecord(await file.arrayBuffer());
        if(gen!==generation||!body.isConnected||!modalBg.classList.contains('on'))return;
        TEXT_PATH_FONTS.set(key,record);show(record);
      }catch(error){if(gen===generation){status.textContent='Cannot use this font: '+(error.message||error);sync();}}
    });
  }sync();
}
