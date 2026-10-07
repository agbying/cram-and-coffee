/* Crops, anchors, directions, and frame order come from the supplied master guide. */
(() => {
const data=window.CafeAtlasData,frames=new Map(data.frames.map(f=>[f.name,f]));
const ids=['maple','cedar','olive','rowan','hazel','sage','fern','ash','clay','indigo','amber','ivy','willow','birch'];
const names=['Maple','Cedar','Olive','Rowan','Hazel','Sage','Fern','Ash','Clay','Indigo','Amber','Ivy','Willow','Birch'];
const profiles=ids.map((id,i)=>({id,name:names[i],character:data.characterOrder[i],walking:true}));
const themes=['daytime','evening','spring','autumn','winter','greenhouse','coastal','celestial'].map((id,i)=>({id,name:['Daytime café','Evening glow','Spring garden','Rainy autumn','Cozy snowfall','Greenhouse','Breezy coast','Midnight celestial'][i]}));
const aliases={'Golden hour':'daytime','Evening glow':'evening','Sage morning':'spring'};
let image;const roomImages=new Map();
const roomData=window.CafeThemeAtlasData||data,roomFrames=new Map(roomData.frames.filter(f=>f.category==='room').map(f=>[f.name,f]));
function imageFor(frame){if(typeof Image==='undefined')return null;if(frame?.category==='room'){const src='assets/'+(frame.image||roomData.image);if(!roomImages.has(src)){const roomImage=new Image();roomImage.src=src;roomImages.set(src,roomImage);}return roomImages.get(src);}if(!image){image=new Image();image.src='assets/'+data.image;}return image;}
function svg(frame,label){const r=frame.content,id='atlas-'+frame.name,source=frame.category==='room'?roomData:data;return `<svg class="supplied-portrait" viewBox="${r.x} ${r.y} ${r.width} ${r.height}" role="img" aria-label="${label}"><defs><clipPath id="${id}"><rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}"/></clipPath></defs><image clip-path="url(#${id})" href="assets/${frame.image||source.image}" width="${frame.imageWidth||source.width}" height="${frame.imageHeight||source.height}"/></svg>`;}
function portrait(id){const p=profiles.find(p=>p.id===id)||profiles[0];return svg(frames.get(p.character+'_profile'),p.name+' portrait');}
function direction(rotation){const a=rotation*Math.PI/180,x=-Math.sin(a)-Math.cos(a),y=-Math.sin(a)+Math.cos(a);return y>=0?(x<0?0:1):(x<0?2:3);}
function frame(id,rotation,seated,moving,time){const p=profiles.find(p=>p.id===id)||profiles[0],d=direction(rotation),a=rotation*Math.PI/180,x=-Math.sin(a)-Math.cos(a),y=-Math.sin(a)+Math.cos(a);let f,col;
  if(moving){col=Math.floor(time/150)%4;f=frames.get(p.character+'_walk_'+['southwest','southeast','northwest','northeast'][d]+'_'+col);}
  else{const view=Math.abs(y)<.35?(x<0?'left':'right'):['front_left','front_right','back_left','back_right'][d];col=['front_left','left','back_left','back_right','right','front_right'].indexOf(view);f=frames.get(p.character+'_'+(seated?'sitting':'standing')+'_'+view);}
  const r=f.content;return {...f,key:f.name,row:d,col,bounds:[r.x,r.y,r.width,r.height],image:imageFor(),height:seated?85:110,drawScale:window.CafeCharacters.scaleFor(seated,id)};
}
const characterScales={maple:.9,cedar:.8,olive:.68,rowan:.85,hazel:.78,sage:.8,fern:.8,ash:.85,clay:.8,indigo:.65,amber:.8,ivy:.8,willow:.75,birch:.85};
// Keep one scale per character across every pose and walk frame; reduce oversized artwork without enlarging smaller characters.
const cafeHeightLimit=220;
for(const profile of profiles){const upright=data.frames.filter(f=>f.character===profile.character&&['standing','walking'].includes(f.category)),maxHeight=Math.max(...upright.map(f=>f.content.height));characterScales[profile.id]=Math.min(characterScales[profile.id],cafeHeightLimit/maxHeight);}
window.CafeCharacters={cafeHeightLimit,characterScales,scaleFor:(seated,id='maple')=>characterScales[id]||.8,sceneScale:.8,uprightScale:.8,seatedLift:10,profiles,themes,aliases,imageFor,portrait,frame,direction,theme:id=>themes.find(t=>t.id===(aliases[id]||id))||themes[2],roomData,room:id=>roomFrames.get('room_'+id),roomPreview:id=>svg(roomFrames.get('room_'+id),themes.find(t=>t.id===id).name+' café corner')};
const furnitureMap={armchair:'armchair',chair:'dining_chair',square:'square_table',desk:'long_table',table:'round_table',sofa:'couch',shelf:'tall_bookshelf','wide-shelf':'long_bookshelf',plant:'broad_leaf_plant',varplant:'variegated_plant','floor-lamp':'shade_floor_lamp','desk-lamp':'angled_floor_lamp',register:'cash_register_desk',counter:'stocked_service_counter',pastry:'stocked_pastry_display',cart:'stocked_rolling_cart',stool:'bar_stool',coat:'coat_rack',bins:'recycling_bin',menu:'floor_menu_stand'};
// Placement geometry is separate from the original crop guide: its anchors mark crop bottoms.
// Front floor corners measured in each supplied wide furnishing, rather than crop centers.
const wideFront={long_table:.34,couch:.34,long_bookshelf:.24,cash_register_desk:.39,stocked_service_counter:.75,stocked_pastry_display:.64};
const nativeLongY=new Set(['long_table','couch','long_bookshelf','cash_register_desk']);
function groundAnchor(f){if(['furniture','standing','walking'].includes(f.category)){const b=f.content;if(['long_bookshelf','stocked_rolling_cart'].includes(f.name)){const frontX=b.width*(wideFront[f.name]??.5);return f.name==='stocked_rolling_cart'?{x:b.x+b.width,y:b.y+b.height-(b.width-frontX)*data.tile.height/data.tile.width}:{x:b.x,y:b.y+b.height-frontX*data.tile.height/data.tile.width};}return {x:b.x+b.width*(wideFront[f.name]??.5),y:b.y+b.height};}return f.anchor;}
const centeredItems=new Set(['plant','varplant','cart','menu','floor-lamp','desk-lamp','coat','bins','machine','cups','tray','art','cat']);
function placementFraction(id){return id==='table'?.75:centeredItems.has(id)?.5:1;}
function artScale(f){return f.name==='stocked_rolling_cart'?.8:f.name==='long_bookshelf'?.9:f.name==='tall_bookshelf'?1.1:f.name==='stocked_service_counter'?.9:['round_table','bar_stool'].includes(f.name)?.65:1;}
function placementNudge(id){if(['shelf','wide-shelf'].includes(id))return 0;if(id==='stool')return -.1;return centeredItems.has(id)?.2:0;}
function placementShift(id,rotation=0){
  const shift=id==='bins'?{x:.25,y:.05}:{x:0,y:0};
  // Accessories rotate around their tile center: mirroring also swaps their floor-axis offset.
  if(rotation%180&&centeredItems.has(id))return {x:shift.y,y:shift.x};
  return shift;
}
function furnitureFootprint(id,rotation=0){const f=frames.get(furnitureMap[id]);if(!f)return null;let [w,d]=f.footprint;if(nativeLongY.has(f.name))[w,d]=[d,w];return rotation%180?{w:d,d:w}:{w,d};}
function seatRotation(rotation=0){return rotation%180?0:270;}
function seatAttachment(id){const f=frames.get(furnitureMap[id]),b=f.content,a=groundAnchor(f);const fraction={chair:.54,armchair:.65,sofa:.65,stool:.18}[id]??.54;return {x:(b.x+b.width/2-a.x)*artScale(f),y:(b.y+b.height*fraction-a.y)*artScale(f)-window.CafeCharacters.seatedLift};}
function seatedAnchor(f){const b=f.content,left=['front_left','left','back_left'].includes(f.view);return {x:b.x+b.width*(left?.70:.30),y:b.y+b.height*.66};}
window.CafeMaster={data,frames,imageFor,furniture:id=>frames.get(furnitureMap[id]),groundAnchor,placementFraction,placementNudge,placementShift,artScale,furnitureFootprint,seatRotation,seatAttachment,seatedAnchor,factor:1};
})();
