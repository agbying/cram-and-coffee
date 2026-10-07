/* Local-only spreadsheet import and backup validation. Files never leave the browser. */
(() => {
  const limit=2000;
  function validatePairs(rows) {
    const clean=[];
    for(let i=0;i<rows.length;i++) {
      const q=String(rows[i][0]??'').trim(),a=String(rows[i][1]??'').trim();
      if(!q&&!a)continue;
      if(!q||!a)throw new Error('Row '+(i+1)+' needs both a question and an answer.');
      if(q.length>2000||a.length>2000)throw new Error('Row '+(i+1)+' is too long. Use up to 2,000 characters per side.');
      clean.push({q,a});
    }
    if(!clean.length)throw new Error('Add at least one question and answer.');
    if(clean.length>limit)throw new Error('Use up to '+limit+' cards in one deck.');
    return clean;
  }
  function parseTerms(text) {
    text=String(text).replace(/^\uFEFF/,'');
    if(text.includes('\t')){
      if(!text.includes('"'))text=text.split(/\r?\n/).map(row=>row.includes('\t')?row:row.replace('|','\t')).join('\n');
      const rows=[];let row=[],field='',quoted=false;
      for(let i=0;i<text.length;i++){
        const char=text[i];
        if(char==='"'&&(!field||quoted)){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
        else if(!quoted&&(char==='\t'||char==='\n'||char==='\r')){row.push(field);field='';if(char!=='\t'){if(char==='\r'&&text[i+1]==='\n')i++;rows.push(row);row=[];}}
        else field+=char;
      }
      if(quoted)throw new Error('A quoted Excel cell is missing its closing quote.');
      row.push(field);rows.push(row);
      if(rows.some(row=>row.length>2&&row.slice(2).some(value=>value.trim())))throw new Error('Paste only the question and answer columns.');
      return validatePairs(rows);
    }
    return validatePairs(String(text).split(/\r?\n/).map(line=>{const pos=line.includes('\t')?line.indexOf('\t'):line.indexOf('|');return pos<0?[line,'']:[line.slice(0,pos),line.slice(pos+1)];}));
  }
  function serializeTerms(cards){return cards.map(c=>[c.q,c.a].map(s=>/[\t\n\r"]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s).join('\t')).join('\n');}
  async function unzip(buffer) {
    const data=new Uint8Array(buffer),view=new DataView(buffer),entries=new Map(),decoder=new TextDecoder();
    let end=-1;
    for(let p=data.length-22;p>=Math.max(0,data.length-65557);p--)if(view.getUint32(p,true)===0x06054b50){end=p;break;}
    if(end<0)throw new Error('This is not a valid Excel .xlsx file.');
    const count=view.getUint16(end+10,true);let pos=view.getUint32(end+16,true);
    if(count>2000)throw new Error('This workbook has too many parts. Use a smaller workbook.');
    for(let i=0;i<count;i++) {
      if(pos+46>data.length||view.getUint32(pos,true)!==0x02014b50)throw new Error('The Excel file is damaged.');
      const method=view.getUint16(pos+10,true),size=view.getUint32(pos+20,true),rawSize=view.getUint32(pos+24,true),nl=view.getUint16(pos+28,true),el=view.getUint16(pos+30,true),cl=view.getUint16(pos+32,true),offset=view.getUint32(pos+42,true);
      const name=decoder.decode(data.slice(pos+46,pos+46+nl));
      if(rawSize>16*1024*1024)throw new Error('A worksheet is too large. Use a smaller workbook.');
      entries.set(name,{method,size,offset,rawSize});pos+=46+nl+el+cl;
    }
    return async name=>{
      const entry=entries.get(name);if(!entry)return null;
      const p=entry.offset;if(p+30>data.length||view.getUint32(p,true)!==0x04034b50)throw new Error('The Excel file is damaged.');
      const start=p+30+view.getUint16(p+26,true)+view.getUint16(p+28,true);
      if(start+entry.size>data.length)throw new Error('The Excel file is incomplete.');
      const bytes=data.slice(start,start+entry.size);
      if(entry.method===0)return decoder.decode(bytes);
      if(entry.method!==8)throw new Error('Unsupported Excel compression. Save the workbook as .xlsx again.');
      let stream;try{stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));}catch{throw new Error('This browser cannot import Excel yet. Try a current browser or paste the two columns instead.');}
      const reader=stream.getReader(),parts=[];let total=0;
      while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>16*1024*1024){await reader.cancel();throw new Error('A worksheet is too large.');}parts.push(value);}
      const result=new Uint8Array(total);let at=0;for(const part of parts){result.set(part,at);at+=part.length;}return decoder.decode(result);
    };
  }
  function xml(text) {
    if(!text)throw new Error('The Excel workbook is missing a required sheet.');
    const doc=new DOMParser().parseFromString(text,'application/xml');if(doc.getElementsByTagName('parsererror').length)throw new Error('Invalid worksheet XML.');return doc;
  }
  const tags=(node,name)=>Array.from(node.getElementsByTagNameNS('*',name));
  const textNodes=node=>tags(node,'t').map(t=>t.textContent).join('');
  async function readExcel(file) {
    if(!/\.xlsx$/i.test(file.name))throw new Error('Choose an Excel .xlsx file. Save older .xls files as .xlsx first.');
    if(file.size>8*1024*1024)throw new Error('Choose an Excel file smaller than 8 MB.');
    const read=await unzip(await file.arrayBuffer()),workbook=xml(await read('xl/workbook.xml')),sheet=tags(workbook,'sheet')[0];
    if(!sheet)throw new Error('This workbook has no worksheets.');
    const relId=sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||sheet.getAttribute('r:id'),rels=xml(await read('xl/_rels/workbook.xml.rels')),rel=tags(rels,'Relationship').find(r=>r.getAttribute('Id')===relId);
    if(!rel||rel.getAttribute('TargetMode')==='External')throw new Error('The first worksheet is not stored in this workbook.');
    let target=rel.getAttribute('Target');if(target.startsWith('/'))target=target.slice(1);else {const stack=['xl'];for(const part of target.split('/')){if(part==='..')stack.pop();else if(part!=='.')stack.push(part);}target=stack.join('/');}
    const sharedText=await read('xl/sharedStrings.xml'),shared=sharedText?tags(xml(sharedText),'si').map(textNodes):[],doc=xml(await read(target)),rows=[];
    for(const row of tags(doc,'row')) {
      const pair=['',''];for(const cell of tags(row,'c')){const ref=cell.getAttribute('r')||'',col=ref.replace(/\d/g,'');if(col!=='A'&&col!=='B')continue;const type=cell.getAttribute('t'),value=tags(cell,'v')[0]?.textContent||'';pair[col==='A'?0:1]=type==='s'?shared[Number(value)]??'':type==='inlineStr'?textNodes(cell):value;}
      rows.push(pair);
    }
    if(rows.length&&/^(question|term|vocabulary|vocab)$/i.test(rows[0][0].trim())&&/^(answer|definition|meaning)$/i.test(rows[0][1].trim()))rows.shift();
    return {name:sheet.getAttribute('name'),cards:validatePairs(rows)};
  }
  function validateBackup(input,defaults,productIds) {
    const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
    if(!object(input)||!Array.isArray(input.tasks)||!Array.isArray(input.cards)||!Array.isArray(input.sessions)||!Array.isArray(input.owned)||!Array.isArray(input.placed)||!object(input.settings))throw new Error('This file is not a Cram & Coffee backup.');
    const str=(v,max=2000)=>typeof v==='string'&&v.length<=max;
    const id=v=>str(v,100)&&/^[a-zA-Z0-9_-]+$/.test(v);
    const num=(v,max=1e9)=>Number.isFinite(v)&&v>=0&&v<=max;
    const date=v=>v===''||(str(v,10)&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&new Date(v+'T12:00:00').toLocaleDateString('en-CA')===v);
    if(!num(input.coins)||!num(input.xp)||!str(input.name,40))throw new Error('The backup has invalid profile values.');
    for(const key of ['tasks','cards','sessions','placed'])if(input[key].length>20000)throw new Error('The backup is too large.');
    const ids=new Set();
    for(const t of input.tasks)if(!object(t)||!id(t.id)||!str(t.title,160)||!str(t.subject,50)||!num(t.minutes,1440)||t.minutes<1||!date(t.due)||!str(t.notes??'',2000))throw new Error('The backup contains an invalid task.');
    for(const c of input.cards){if(!object(c)||!id(c.id)||ids.has(c.id)||!str(c.q)||!str(c.a)||!str(c.subject,50)||!date(c.due)||!num(c.interval??0,100000))throw new Error('The backup contains an invalid flashcard.');ids.add(c.id);}
    for(const s of input.sessions)if(!object(s)||!date(s.date)||!s.date||!num(s.minutes,1440)||!str(s.subject,50))throw new Error('The backup contains an invalid study session.');
    for(const p of input.placed)if(!object(p)||!id(p.id)||!str(p.item,40)||!productIds.includes(p.item)&&!['light','ivy'].includes(p.item)||(!num(p.gx,7)&&!num(p.x,100))||(!num(p.gy,7)&&!num(p.y,100))||!num(p.rotation??0,360))throw new Error('The backup contains an invalid café item.');
    const settings={...defaults.settings};for(const key of ['focus','short','long','daily','weekly']){const v=input.settings[key];if(v!==undefined){if(!num(v,key==='weekly'?10080:1440)||v<1)throw new Error('The backup has invalid study preferences.');settings[key]=v;}}settings.dark=false;if(input.settings.timeZone!==undefined){if(!window.CoffeeClock.validTimeZone(input.settings.timeZone))throw new Error('The backup has an invalid time zone.');settings.timeZone=input.settings.timeZone;}
    if(input.settings.ambientSound!==undefined){if(!['rain','brown','fire','forest','cafe','keys'].includes(input.settings.ambientSound))throw new Error('The backup has an invalid background sound.');settings.ambientSound=input.settings.ambientSound;}
    if(input.settings.soundVolume!==undefined){if(!num(input.settings.soundVolume,1))throw new Error('The backup has an invalid sound volume.');settings.soundVolume=input.settings.soundVolume;}
    if(input.settings.endSound!==undefined){if(!['bell','chime','none'].includes(input.settings.endSound))throw new Error('The backup has an invalid phase-end tone.');settings.endSound=input.settings.endSound;}
    const alarms=window.CoffeeAlarms.validate(input.alarms);
    const notebookFolders=window.CoffeeNotebooks.validateFolders(input.notebookFolders);
    const notebooks=window.CoffeeNotebooks.validate(input.notebooks,notebookFolders);
    const decks=input.decks||[];if(!Array.isArray(decks)||decks.some(d=>!object(d)||!id(d.id)||!str(d.name,100)||!str(d.subject,50)||!date(d.due)||(d.archived!==undefined&&typeof d.archived!=='boolean')))throw new Error('The backup contains an invalid deck.');
    if(new Set(decks.map(d=>d.id)).size!==decks.length)throw new Error('The backup has duplicate deck identifiers.');
    const classes=input.classes||['General'];if(!Array.isArray(classes)||classes.some(c=>!str(c,50)||!c.trim()))throw new Error('The backup has invalid classes.');
    const quests={};if(object(input.quests))for(const [key,v] of Object.entries(input.quests))if(key!=='__proto__'&&key!=='constructor'&&(typeof v==='boolean'||num(v)))quests[key]=v;
    const inventory={};if(object(input.inventory))for(const id of productIds){if(input.inventory[id]!==undefined){if(!Number.isInteger(input.inventory[id])||!num(input.inventory[id],20000))throw new Error('The backup has an invalid item quantity.');inventory[id]=input.inventory[id];}}
    const removedClasses=input.removedClasses||[];if(!Array.isArray(removedClasses)||removedClasses.some(c=>!str(c,50)||!c.trim()))throw new Error('The backup has invalid removed classes.');
    const unlockedThemes=input.unlockedThemes;if(unlockedThemes!==undefined&&(!Array.isArray(unlockedThemes)||unlockedThemes.some(id=>!window.CafeCharacters.themes.some(t=>t.id===id))))throw new Error('The backup has invalid unlocked themes.');
    const plantCare=input.plantCare;if(plantCare!==undefined&&(!object(plantCare)||!Number.isInteger(plantCare.stage)||!num(plantCare.stage,4)||!date(plantCare.lastDate)||!plantCare.lastDate||plantCare.lastDate<'2000-01-01'||!num(plantCare.goal,1440)||plantCare.goal<1||typeof plantCare.completed!=='boolean'||![0,5,15].includes(plantCare.reward)||plantCare.completed!==(plantCare.reward>0)))throw new Error('The backup has invalid plant care.');
    const state={...defaults,name:input.name,coins:input.coins,xp:input.xp,tasks:structuredClone(input.tasks),cards:structuredClone(input.cards),sessions:structuredClone(input.sessions),decks:structuredClone(decks),notebooks,notebookFolders,alarms,classes:[...classes],removedClasses:[...removedClasses],owned:input.owned.filter(id=>productIds.includes(id)),placed:structuredClone(input.placed),settings,inventory,quests,scratch:str(input.scratch,100000)?input.scratch:'',avatarId:window.CafeCharacters.profiles.some(p=>p.id===input.avatarId)?input.avatarId:'maple',theme:window.CafeCharacters.theme(input.theme).id,testResetVersion:1,unlockedThemes:[...new Set([...(unlockedThemes||[]),window.CafeCharacters.theme(input.theme).id])]};
    if(plantCare)state.plantCare=structuredClone(plantCare);else delete state.plantCare;
    if(object(input.avatarPosition)&&num(input.avatarPosition.gx,7)&&num(input.avatarPosition.gy,7))state.avatarPosition={id:'avatar',gx:input.avatarPosition.gx,gy:input.avatarPosition.gy,rotation:num(input.avatarPosition.rotation,360)?input.avatarPosition.rotation:0};
    if(object(input.exam)&&str(input.exam.name,100)&&date(input.exam.date)&&num(input.exam.goal,1000)&&input.exam.goal>=1)state.exam={name:input.exam.name,date:input.exam.date,goal:input.exam.goal};
    if(str(input.brew,50))state.brew=input.brew;
    return state;
  }
  window.CoffeeStudyTools={parseTerms,serializeTerms,validatePairs,readExcel,unzip,validateBackup};
})();
