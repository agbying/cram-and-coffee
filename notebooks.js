(() => {
  const fonts={sans:{name:'Clean sans',css:"'DM Sans', Arial, sans-serif"},serif:{name:'Book serif',css:"'Playfair Display', Georgia, serif"},hand:{name:'Handwritten',css:"'Segoe Print', 'Comic Sans MS', cursive"},mono:{name:'Monospace',css:"Consolas, 'Courier New', monospace"}};
  const styles={title:{name:'Title',font:'serif',size:36},heading:{name:'Heading',font:'serif',size:28},subheading:{name:'Subheading',font:'sans',size:22},body:{name:'Body',font:'sans',size:16}};
  const sizes=[12,14,16,18,20,22,24,28,32,36,40,48],colors=['#647f58','#a45e3d','#62849b','#a07f9e','#c19a4e','#687783'];
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
  const validColor=v=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
  function block(type='body'){const style=styles[type]||styles.body;return {id:crypto.randomUUID(),type:Object.hasOwn(styles,type)?type:'body',text:'',font:style.font,size:style.size,runs:[]};}
  function boxStyle(b){return (Number.isFinite(b.boxWidth)&&b.boxWidth>=10&&b.boxWidth<=100?'width:'+b.boxWidth+'%;':'')+(Number.isFinite(b.boxHeight)&&b.boxHeight>=60&&b.boxHeight<=4000?'height:'+b.boxHeight+'px;':'');}
  function page(title='Page 1'){return {id:crypto.randomUUID(),title,blocks:[block()]};}
  function create(title){return {id:crypto.randomUUID(),title:title.trim(),titleFont:'serif',titleSize:36,color:colors[0],folderId:null,pages:[page()],updatedAt:new Date().toISOString()};}
  function migrate(state){
    state.notebooks||=[];state.notebookFolders||=[];
    for(const n of state.notebooks){if(!n.pages){n.pages=[{id:crypto.randomUUID(),title:'Page 1',blocks:n.blocks||[block()]}];delete n.blocks;}if(!validColor(n.color))n.color=colors[0];n.folderId??=null;}
  }
  function normalizeRuns(runs){const result=[];for(const value of runs){if(!value.text)continue;const r={text:value.text,bold:!!value.bold,italic:!!value.italic,underline:!!value.underline},prev=result.at(-1);if(prev&&['bold','italic','underline'].every(k=>prev[k]===r[k]))prev.text+=r.text;else result.push(r);}return result;}
  function inlineHTML(b){const runs=b.runs?.length&&b.runs.map(r=>r.text).join('')===b.text?b.runs:[{text:b.text}];return runs.map(r=>{let s=escape(r.text).replace(/\n/g,'<br>');if(r.underline)s='<u>'+s+'</u>';if(r.italic)s='<em>'+s+'</em>';if(r.bold)s='<strong>'+s+'</strong>';return s;}).join('');}
  // Read only text and supported emphasis from editor DOM; never persist pasted HTML.
  function readEditor(root){
    const runs=[];const append=(text,marks)=>{if(text)runs.push({text,...marks});};
    function walk(node,marks={}){
      if(node.nodeType===3){append(node.nodeValue||'',marks);return;}
      if(node.nodeType!==1)return;const tag=node.tagName.toLowerCase();if(['script','style','iframe','object'].includes(tag))return;
      if(tag==='br'){append('\n',marks);return;}
      const next={...marks};if(['b','strong'].includes(tag))next.bold=true;if(['i','em'].includes(tag))next.italic=true;if(tag==='u')next.underline=true;
      const css=node.style;if(css){if(css.fontWeight){next.bold=css.fontWeight==='bold'||Number(css.fontWeight)>=600;}if(css.fontStyle)next.italic=css.fontStyle==='italic';if(css.textDecoration||css.textDecorationLine)next.underline=(css.textDecorationLine||css.textDecoration).includes('underline');}
      if(node!==root&&['div','p','h1','h2','h3','li'].includes(tag)&&runs.length&&!runs.at(-1).text.endsWith('\n'))append('\n',marks);
      for(const child of node.childNodes)walk(child,next);
    }
    walk(root);return normalizeRuns(runs);
  }
  function validateFolders(value){
    if(value===undefined)return [];if(!Array.isArray(value)||value.length>1000)throw new Error('The backup has invalid notebook folders.');
    const folders=value.map(f=>{if(!f||!validId(f.id)||typeof f.name!=='string'||!f.name.trim()||f.name.length>100||f.parentId!==null&&!validId(f.parentId))throw new Error('The backup has an invalid notebook folder.');return {id:f.id,name:f.name,parentId:f.parentId};});
    const map=new Map(folders.map(f=>[f.id,f]));if(map.size!==folders.length)throw new Error('The backup has duplicate notebook folders.');
    for(const f of folders){let at=f,seen=new Set();while(at){if(seen.has(at.id))throw new Error('The notebook folders contain a cycle.');seen.add(at.id);if(at.parentId&&!map.has(at.parentId))throw new Error('A notebook folder has a missing parent.');at=map.get(at.parentId);}}
    return folders;
  }
  function validate(value,folders=[]){
    if(value===undefined)return [];if(!Array.isArray(value)||value.length>1000)throw new Error('The backup has invalid notebooks.');const ids=new Set();
    function blocks(value){if(!Array.isArray(value)||value.length>500)throw new Error('The backup contains an invalid notebook section.');const seen=new Set();return value.map(b=>{
      if(!b||!validId(b.id)||seen.has(b.id)||!Object.hasOwn(styles,b.type)||typeof b.text!=='string'||b.text.length>20000||!Object.hasOwn(fonts,b.font)||!sizes.includes(b.size))throw new Error('The backup contains an invalid notebook section.');seen.add(b.id);
      if(b.runs!==undefined&&(!Array.isArray(b.runs)||b.runs.length>20000||b.runs.some(r=>!r||typeof r.text!=='string'||r.text.length>20000||['bold','italic','underline'].some(k=>r[k]!==undefined&&typeof r[k]!=='boolean'))||b.runs.length&&b.runs.map(r=>r.text).join('')!==b.text))throw new Error('The backup contains invalid notebook formatting.');
      if(b.boxWidth!==undefined&&(!Number.isFinite(b.boxWidth)||b.boxWidth<10||b.boxWidth>100)||b.boxHeight!==undefined&&(!Number.isFinite(b.boxHeight)||b.boxHeight<60||b.boxHeight>4000))throw new Error('The backup contains invalid notebook box dimensions.');
      return {id:b.id,type:b.type,text:b.text,font:b.font,size:b.size,runs:normalizeRuns(b.runs||[]),...(b.boxWidth!==undefined?{boxWidth:b.boxWidth}:{}),...(b.boxHeight!==undefined?{boxHeight:b.boxHeight}:{})};
    });}
    return value.map(n=>{
      if(!n||!validId(n.id)||ids.has(n.id)||typeof n.title!=='string'||!n.title.trim()||n.title.length>100||!Object.hasOwn(fonts,n.titleFont)||!sizes.includes(n.titleSize)||typeof n.updatedAt!=='string'||n.updatedAt.length>40||!Number.isFinite(Date.parse(n.updatedAt))||n.color!==undefined&&!validColor(n.color)||n.folderId!=null&&!folders.some(f=>f.id===n.folderId))throw new Error('The backup contains an invalid notebook.');ids.add(n.id);
      let pages;if(n.pages===undefined)pages=[{id:crypto.randomUUID(),title:'Page 1',blocks:blocks(n.blocks)}];else{if(!Array.isArray(n.pages)||!n.pages.length||n.pages.length>500)throw new Error('The backup contains invalid notebook pages.');const seen=new Set();pages=n.pages.map(p=>{if(!p||!validId(p.id)||seen.has(p.id)||typeof p.title!=='string'||!p.title.trim()||p.title.length>100)throw new Error('The backup contains an invalid notebook page.');seen.add(p.id);return {id:p.id,title:p.title,blocks:blocks(p.blocks)};});}
      return {id:n.id,title:n.title,titleFont:n.titleFont,titleSize:n.titleSize,updatedAt:n.updatedAt,color:n.color||colors[0],folderId:n.folderId||null,pages};
    });
  }
  function descendantIds(folders,id){const found=new Set([id]);let changed=true;while(changed){changed=false;for(const f of folders)if(found.has(f.parentId)&&!found.has(f.id)){found.add(f.id);changed=true;}}return found;}
  function folderPath(folders,id){const parts=[],seen=new Set();while(id&&!seen.has(id)){seen.add(id);const f=folders.find(f=>f.id===id);if(!f)break;parts.unshift(f.name);id=f.parentId;}return parts.join(' / ');}
  function exportHTML(n){
    const pages=n.pages.map((p,i)=>`<section class="page"><header>${escape(n.title)} · Page ${i+1} of ${n.pages.length}</header><h1>${escape(p.title)}</h1>${p.blocks.map(b=>`<div class="block ${b.type}" style="font-family:${fonts[b.font].css};font-size:${b.size}px;${boxStyle(b).replace('height:','min-height:')}">${inlineHTML(b)}</div>`).join('')}</section>`).join('');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(n.title)}</title><style>body{margin:0;background:#eee8df;color:#302a25;font-family:Arial,sans-serif}.cover,.page{box-sizing:border-box;max-width:800px;margin:24px auto;padding:50px;background:#fffdf8;overflow-wrap:anywhere}.cover{border-top:12px solid ${n.color}}.cover h1{font-family:${fonts[n.titleFont].css};font-size:${n.titleSize}px}.cover p,header{color:#74675b;font-size:12px}header{padding-bottom:16px;border-bottom:1px solid #e9dfd2}h1{font-size:28px}.block{line-height:1.6;margin:20px 0;white-space:pre-wrap;min-height:1em}strong{font-weight:700}@media print{body{background:white}.cover,.page{margin:0;max-width:none;padding:15mm;min-height:240mm;break-after:page}.page:last-child{break-after:auto}@page{size:A4;margin:10mm}}</style></head><body><section class="cover"><h1>${escape(n.title)}</h1><p>${n.pages.length} page${n.pages.length===1?'':'s'} · Cram &amp; Coffee</p></section>${pages}</body></html>`;
  }
  window.CoffeeNotebooks={fonts,styles,sizes,colors,validColor,boxStyle,block,page,create,migrate,normalizeRuns,inlineHTML,readEditor,validate,validateFolders,descendantIds,folderPath,exportHTML};
})();
