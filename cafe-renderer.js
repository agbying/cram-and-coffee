/* Furniture, interaction grid, and supplied sprites share the artwork’s floor projection. */
(() => {
const COS=Math.sqrt(3)/2,SIN=.5,TILE=64,SIZE=8*TILE;
const furnitureImages=new Map();
const GRID_SIN=COS*window.CafeAtlasData.tile.height/window.CafeAtlasData.tile.width; // Exact 30-degree axes shared with the supplied SVG.
const profiles={maple:{skin:'#e8ba94',hair:'#65412a',shirt:'#f3e4c8',pants:'#496851'},cedar:{skin:'#976341',hair:'#302b25',shirt:'#78906b',pants:'#765943'},olive:{skin:'#e9bc99',hair:'#292824',shirt:'#cfa354',pants:'#e9ddc4'},rowan:{skin:'#edc2a3',hair:'#a06435',shirt:'#dac5a5',pants:'#51473a',glasses:true},hazel:{skin:'#b8845a',hair:'#40302a',shirt:'#55765c',pants:'#b3714a'},sage:{skin:'#bf906e',hair:'#47352a',shirt:'#b26843',pants:'#465166'}};
const shade=(hex,n)=>{if(!hex.startsWith('#')||hex.length!==7)return hex;const v=parseInt(hex.slice(1),16);return '#'+[v>>16,(v>>8)&255,v&255].map(x=>Math.max(0,Math.min(255,Math.round(x*n))).toString(16).padStart(2,'0')).join('');};
class IsoPainter {
constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.pose=null;this.scale=1;this.ox=0;this.oy=0;}
resize(w,h){const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=w*dpr;this.canvas.height=h*dpr;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.w=w;this.h=h;}
world(x,y,z=0){if(this.pose){const a=this.pose.r*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a);return {x:this.pose.x+x*cos-y*sin,y:this.pose.y+x*sin+y*cos,z:z+(this.pose.z||0)};}return {x,y,z};}
p(x,y,z=0){const q=this.world(x,y,z);return {x:this.ox+(q.x-q.y)*COS*this.scale,y:this.oy+((q.x+q.y)*(this.floorSin||SIN)-q.z)*this.scale};}
project(x,y,z=0){return {x:this.ox+(x-y)*COS*this.scale,y:this.oy+((x+y)*(this.floorSin||SIN)-z)*this.scale};}
unproject(sx,sy){const a=(sx-this.ox)/(COS*this.scale),b=(sy-this.oy)/((this.floorSin||SIN)*this.scale);return {x:(a+b)/2,y:(b-a)/2};}
poly(points,color,stroke='#63452438'){const c=this.ctx;c.beginPath();points.forEach((v,i)=>{const q=this.p(...v);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=Math.max(.5,this.scale*.8);c.stroke();}}
line(points,color,width=1){const c=this.ctx;c.beginPath();points.forEach((v,i)=>{const q=this.p(...v);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.lineWidth=width*this.scale;c.stroke();}
box(x,y,z,w,d,h,color){const a=x-w/2,b=x+w/2,e=y-d/2,f=y+d/2;const r=(this.pose?.r||0)*Math.PI/180,xx=Math.cos(r)+Math.sin(r)>=0?b:a,yy=Math.cos(r)-Math.sin(r)>=0?f:e;this.poly([[xx,e,z],[xx,f,z],[xx,f,z+h],[xx,e,z+h]],shade(color,.78));this.poly([[a,yy,z],[b,yy,z],[b,yy,z+h],[a,yy,z+h]],shade(color,.89));this.poly([[a,e,z+h],[b,e,z+h],[b,f,z+h],[a,f,z+h]],shade(color,1.12));}
cylinder(x,y,z,r,h,color){const n=20;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;const wa=a+(this.pose?.r||0)*Math.PI/180;if(Math.cos(wa)+Math.sin(wa)<-.1)continue;this.poly([[x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z+h],[x+Math.cos(a)*r,y+Math.sin(a)*r,z+h]],shade(color,.8+.14*Math.cos(a-.8)),null);}this.poly(Array.from({length:n},(_,i)=>[x+Math.cos(i/n*Math.PI*2)*r,y+Math.sin(i/n*Math.PI*2)*r,z+h]),shade(color,1.1));}
sphere(x,y,z,r,color){const p=this.p(x,y,z),c=this.ctx,rr=r*this.scale;c.beginPath();c.arc(p.x,p.y,rr,0,Math.PI*2);const g=c.createRadialGradient(p.x-rr*.35,p.y-rr*.4,rr*.1,p.x,p.y,rr);g.addColorStop(0,shade(color,1.15));g.addColorStop(1,shade(color,.78));c.fillStyle=g;c.fill();c.strokeStyle='#3c2b1c18';c.lineWidth=.7*this.scale;c.stroke();}
shadow(w=45,d=30){this.poly(Array.from({length:24},(_,i)=>[Math.cos(i/24*2*Math.PI)*w,Math.sin(i/24*2*Math.PI)*d,.2]),'#51361418',null);}
mug(x,y,z){this.cylinder(x,y,z,5.8,9,'#f5e7cb');this.cylinder(x,y,z+9.1,4.6,.1,'#66442c');this.line([[x+6,y,z+3],[x+10,y,z+4],[x+10,y,z+8],[x+6,y,z+8]],'#ead9b9',2);}
plant(x=0,y=0,z=0,r=12){this.cylinder(x,y,z,r,19,'#b4744e');this.cylinder(x,y,z+18,r+1,3,'#cb8b61');this.cylinder(x,y,z+21,r-2,.2,'#594a31');for(let i=0;i<9;i++){const a=i*2.399,dx=Math.cos(a)*r*1.9,dy=Math.sin(a)*r*1.8,zz=z+27+(i%4)*7;this.line([[x,y,z+21],[x+dx*.4,y+dy*.4,zz]],'#647b43',2);this.poly([[x+dx*.2,y+dy*.2,zz-2],[x+dx,y+dy,zz+5],[x+dx*.6-dy*.22,y+dy*.6+dx*.22,zz+12],[x+dx*.2,y+dy*.2,zz-2]],i%2?'#779359':'#536f45');}}
model(kind,x=0,y=0,r=0,opts={}){if(window.CafeMaster.furniture(kind)||window.SuppliedFurniture?.[kind]){this.furniture(kind,x,y,r);return;}this.pose={x,y,r,z:opts.z||0};const wood='#ad7c53',dark='#7c5a40';
if(kind==='table'){this.cylinder(0,0,0,22,5,dark);this.cylinder(0,0,5,5,49,dark);this.cylinder(0,0,54,32,5,wood);this.cylinder(0,0,59,31.5,.5,'#bf9368');for(let j=-20;j<=20;j+=9){const end=Math.sqrt(32*32-j*j);this.line([[-end,j,59.2],[end,j,59.2]],'#82552e55',.7);}this.mug(13,1,59.5);this.box(-10,-8,60,18,12,2,'#738065');}
else if(kind==='chair'){for(const x of [-19,19])for(const y of [-17,17])this.box(x,y,0,5,5,37,dark);this.box(0,0,35,47,43,5,wood);this.box(0,0,40,43,38,6,'#8b9c77');this.line([[-16,-13,46.2],[16,-13,46.2],[16,13,46.2],[-16,13,46.2],[-16,-13,46.2]],'#b2bd9660',.7);for(const x of [-23,23]){this.box(x,-18,35,5,5,48,dark);this.box(x,0,58,5,43,5,wood);}this.box(0,-20,48,46,5,35,wood);this.box(0,-17,51,39,4,25,'#8a9c75');}
else if(kind==='counter'){this.box(0,0,0,128,64,62,'#6d7f5b');this.box(0,0,62,134,70,7,wood);for(let i=-44;i<50;i+=15)this.line([[i,27.4,6],[i,27.4,59]],'#48613f',1);this.box(-18,-9,69,38,25,26,'#6a6861');this.box(-18,5,70,42,5,3,'#aaa69b');this.box(-18,-10,96,40,29,3,'#85877e');this.box(-18,-13,78,29,4,12,'#424842');for(const a of [-25,-10])this.line([[a,-9,90],[a,-2,86],[a,-2,81]],'#d3cbbb',2);this.mug(-29,-12,99);this.mug(-10,-12,99);this.cylinder(-45,0,69,7,22,'#554331');this.cylinder(-45,0,92,9,2,'#b49a76');this.box(34,1,69,30,32,3,'#725236');this.box(34,1,72,30,32,22,'#b9dedb70');for(const i of [-1,1])for(const j of [-1,1])this.cylinder(34+i*7,1+j*7,73,4.5,4,'#c69353');this.box(34,1,94,31,33,2,'#c4b391');this.mug(5,17,69);}
else if(kind==='plant')this.plant(0,0,0,15);
else if(kind==='shelf'){this.box(0,-18,0,51,5,91,wood);for(const x of [-27,27])this.box(x,0,0,5,35,95,dark);for(const z of [5,35,64,93])this.box(0,0,z,57,38,4,wood);for(const z of [9,39,68])for(let i=0;i<6;i++)this.box(-18+i*7,4,z,5,19,16+i%3*3,['#8b9a76','#c29a6c','#aa6850','#dfcba6'][i%4]);this.plant(12,-3,97,7);}
else if(kind==='menu'||kind==='art'){this.box(0,-5,4,48,5,78,wood);this.box(0,-1,11,39,2,63,kind==='menu'?'#3f493a':'#eadab5');if(kind==='menu'){this.line([[-12,1,53],[12,1,53],[10,1,38],[-10,1,38],[-12,1,53]],'#e6d6ae',2);this.line([[-2,1,59],[1,1,63],[-2,1,67]],'#e6d6ae',1.5);}else{this.line([[0,1,20],[0,1,61]],'#708558',2);for(let i=0;i<4;i++)this.poly([[0,2,29+i*8],[i%2?-13:13,2,38+i*8],[0,2,39+i*8]],'#779268');}for(const x of [-18,18])this.box(x,0,0,4,15,8,dark);}
else if(kind==='rug'){this.poly([[-55,-42,.4],[55,-42,.4],[55,42,.4],[-55,42,.4]],'#b67c51');this.poly([[-49,-36,.5],[49,-36,.5],[49,36,.5],[-49,36,.5]],'#d3ad77');this.poly([[-44,-31,.6],[44,-31,.6],[44,31,.6],[-44,31,.6]],'#a56e4a');for(const a of [-28,0,28])this.poly([[a-8,0,.8],[a,-11,.8],[a+8,0,.8],[a,11,.8]],'#e3c08a');}
else if(kind==='cat'){this.cylinder(0,0,0,24,6,'#6d8057');this.sphere(2,2,12,18,'#e1aa6b');this.sphere(-13,9,14,11,'#e7c8a0');this.poly([[-21,9,18],[-23,7,30],[-14,8,23]],'#b97c4d');this.poly([[-10,14,21],[-8,14,30],[-3,13,19]],'#b97c4d');this.line([[-21,15,14],[-17,16,13]],'#64503b',1);this.line([[-13,18,14],[-9,18,13]],'#64503b',1);}
else if(kind==='employee')this.person('cedar',x,y,r,false,opts.time||0,false,'chair',.8);
this.pose=null;}
furniture(kind,x,y,r){
  const f=window.CafeMaster.furniture(kind);if(f){this.atlasSprite(f,x,y,r);return;}
  const asset=window.SuppliedFurniture[kind];this.furnitureCache=furnitureImages;let image=this.furnitureCache.get(asset.src);
  if(!image&&typeof Image!=='undefined'){image=new Image();image.src=asset.src;this.furnitureCache.set(asset.src,image);}
  if(!image?.complete||!image.naturalWidth)return;
  const widths={counter:135,register:135,pastry:135,desk:145,sofa:145,'wide-shelf':145,table:73,chair:59,armchair:75,square:90,shelf:64,plant:65,varplant:60,menu:48,cart:67,stool:44,coat:50,bins:65,machine:52,cups:45,tray:53,'floor-lamp':45,'desk-lamp':55};
  const q=this.project(x,y,0),[sx,sy,sw,sh]=asset.bounds,w=(widths[kind]||64)*this.scale,h=w*sh/sw,c=this.ctx,base=(['counter','register','pastry','desk','sofa','wide-shelf'].includes(kind)?24:12)*this.scale;
  c.save();c.translate(q.x,q.y+base);if(r%180)c.scale(-1,1);
  if(kind==='sofa'){c.beginPath();c.rect(-w/2,-h,w,h);c.rect(-w/2+(310-sx)/sw*w,-h+(670-sy)/sh*h,85/sw*w,42/sh*h);c.clip('evenodd');}
  c.drawImage(image,sx,sy,sw,sh,-w/2,-h,w,h);c.restore();
}
atlasSprite(frame,x,y,r=0){
  const image=window.CafeMaster.imageFor(frame);if(!image?.complete||!image.naturalWidth)return;
  const q=this.project(x,y),a=frame.renderAnchor||window.CafeMaster.groundAnchor(frame),b=frame.content,k=(this.atlasUnit||.35)*(frame.drawScale||window.CafeMaster.artScale(frame)),c=this.ctx;
  c.save();c.translate(q.x,q.y);if(frame.category==='furniture'&&r%180)c.scale(-1,1);
  c.drawImage(image,b.x,b.y,b.width,b.height,(b.x-a.x)*k,(b.y-a.y)*k,b.width*k,b.height*k);c.restore();
}
person(id,x,y,r=0,seated=false,time=0,moving=false,seatKind='chair',sizeMultiplier=1){
  const factor=window.CafeCharacters.scaleFor(seated,id)*sizeMultiplier;let frame={...window.CafeCharacters.frame(id,r,seated,moving,time),drawScale:factor};
  if(seated){const a=window.CafeMaster.seatedAnchor(frame),seat=window.CafeMaster.seatAttachment(seatKind);frame={...frame,renderAnchor:{x:a.x-(r===0?-seat.x:seat.x)/factor,y:a.y-seat.y/factor}};}
  this.atlasSprite(frame,x,y,r);
}
leaf(x,y,z,dx,dy,dz,color){
  const a=this.p(x,y,z),b=this.p(x+dx,y+dy,z+dz),c=this.ctx,vx=b.x-a.x,vy=b.y-a.y,length=Math.hypot(vx,vy)||1,width=length*.44,px=-vy/length*width,py=vx/length*width;
  c.beginPath();c.moveTo(a.x,a.y);c.bezierCurveTo(a.x+vx*.22+px,a.y+vy*.22+py,a.x+vx*.78+px*.65,a.y+vy*.78+py*.65,b.x,b.y);c.bezierCurveTo(a.x+vx*.75-px*.65,a.y+vy*.75-py*.65,a.x+vx*.18-px,a.y+vy*.18-py,a.x,a.y);
  const g=c.createLinearGradient(a.x,a.y,b.x,b.y);g.addColorStop(0,shade(color,.85));g.addColorStop(.55,color);g.addColorStop(1,shade(color,1.18));c.fillStyle=g;c.fill();c.strokeStyle='#354c2e45';c.lineWidth=.65*this.scale;c.stroke();
  c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.strokeStyle='#c5d19b80';c.lineWidth=.6*this.scale;c.stroke();
  for(const t of [.35,.6])for(const s of [-1,1]){c.beginPath();c.moveTo(a.x+vx*t,a.y+vy*t);c.lineTo(a.x+vx*(t+.1)+px*.43*s,a.y+vy*(t+.1)+py*.43*s);c.strokeStyle='#c0cfae35';c.lineWidth=.4*this.scale;c.stroke();}
}

plant(x=0,y=0,z=0,r=12){
  this.cylinder(x,y,z,r*.82,20,'#b67b58');this.cylinder(x,y,z+18,r+1,4,'#ce9673');this.cylinder(x,y,z+22,r-1,.3,'#514936');
  for(let i=0;i<13;i++){const a=i*2.399,reach=r*(1.6+(i%3)*.28),dx=Math.cos(a)*reach,dy=Math.sin(a)*reach,zz=z+26+(i%4)*8;this.line([[x,y,z+22],[x+dx*.28,y+dy*.28,zz]],'#62764d',1.7);this.leaf(x+dx*.28,y+dy*.28,zz,dx,dy,9+(i%3)*6,['#496b43','#6b8a54','#80965f'][i%3]);}
  this.line([[x-r*.7,y+r*.4,z+6],[x-r*.7,y+r*.4,z+16]],'#e5b69480',1);
}
wallText(side,t,z,text,size=14,color='#eee3c8'){
  const c=this.ctx,q=this.project(side==='left'?0:t,side==='left'?t:0,z),s=this.scale;c.save();c.transform((side==='left'?-1:1)*COS*s,.5*s,0,s,q.x,q.y);c.font='italic '+size+'px Georgia, serif';c.textAlign='center';c.fillStyle=color;c.fillText(text,0,0);c.restore();
}
wallWindow(side,t){
  const cv=(u,z)=>side==='left'?[0,u,z]:[u,0,z],lo=t-38,hi=t+38,outline=[cv(lo,43),cv(hi,43),cv(hi,117)];
  for(let i=0;i<=20;i++){const a=i/20*Math.PI;outline.push(cv(t+Math.cos(a)*38,117+Math.sin(a)*38));}outline.push(cv(lo,43));this.poly(outline,'#936244');
  const inner=[cv(lo+5,47),cv(hi-5,47),cv(hi-5,117)];for(let i=0;i<=20;i++){const a=i/20*Math.PI;inner.push(cv(t+Math.cos(a)*33,117+Math.sin(a)*33));}inner.push(cv(lo+5,47));
  const c=this.ctx,corners=inner.map(p=>this.p(...p));c.save();c.beginPath();corners.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
  const top=this.p(...cv(t,151)),bottom=this.p(...cv(t,47)),g=c.createLinearGradient(top.x,top.y,bottom.x,bottom.y);g.addColorStop(0,'#c3d9d7');g.addColorStop(.6,'#f5e8bf');g.addColorStop(1,'#c4c398');c.fillStyle=g;c.fillRect(0,0,this.w,this.h);
  for(let i=0;i<5;i++){const center=this.p(...cv(t-36+i*19,55+(i%3)*6));c.beginPath();c.arc(center.x,center.y,(20+i%3*3)*this.scale,0,Math.PI*2);c.fillStyle=['#9cae7b','#b0bb88','#d0c997'][i%3];c.fill();}
  for(let i=0;i<3;i++){const u=t-25+i*26;this.poly([cv(u-8,47),cv(u+8,47),cv(u+8,76),cv(u-8,76)],['#d2b295','#e8cfaa','#c6ad89'][i]);this.poly([cv(u-10,77),cv(u,88),cv(u+10,77)],'#c78b6d');}
  c.restore();this.line([cv(t,47),cv(t,148)],'#a97b52',3.5);this.line([cv(lo+5,96),cv(hi-5,96)],'#a97b52',3.5);this.line([cv(lo,44),cv(hi,44)],'#c7986d',6);
  this.pose={x:side==='left'?5:t,y:side==='left'?t:5,r:0,z:44};this.plant(-12,0,0,6);this.plant(12,0,0,5);this.pose=null;
}
room(edit,theme){
  const c=this.ctx;c.clearRect(0,0,this.w,this.h);c.fillStyle='#eee2d1';c.fillRect(0,0,this.w,this.h);
  const master=window.CafeMaster,f=window.CafeCharacters.room(window.CafeCharacters.theme(theme).id),tile=master.data.tile;
  // A fixed room envelope keeps every theme, furnishing, and person at the same atlas scale.
  const rooms=window.CafeCharacters.roomData.frames.filter(frame=>frame.category==='room');
  const width=Math.max(...rooms.map(frame=>frame.content.width)),height=Math.max(...rooms.map(frame=>frame.anchor.y-frame.content.y));
  const k=Math.min((this.w-35)/width,(this.h-55)/height),frontY=(this.h-height*k)/2+height*k-8;
  this.atlasUnit=k;this.scale=k*(tile.width/2)/(TILE*COS);this.floorSin=GRID_SIN;this.ox=this.w/2;this.oy=frontY+(f.groundPlane.back.y-f.anchor.y)*k;this.pose=null;
  this.atlasSprite(f,SIZE,SIZE);
  if(edit)this.userGrid();
}
userGrid(){
  if(typeof Image==='undefined')return;
  const src='assets/isometric_atlas_grid.png';let image=furnitureImages.get(src);
  if(!image){image=new Image();image.src=src;furnitureImages.set(src,image);}
  if(!image.complete||!image.naturalWidth)return;
  const c=this.ctx,k=this.atlasUnit;
  const points=[[0,0],[SIZE,0],[SIZE,SIZE],[0,SIZE]].map(([x,y])=>this.project(x,y));
  // The supplied atlas grid has the same native tile size as every atlas asset.
  c.save();c.beginPath();points.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.closePath();c.clip();
  c.drawImage(image,this.ox-window.CafeMaster.data.tile.width*4*this.atlasUnit,this.oy,image.naturalWidth*k,image.naturalHeight*k);c.restore();
}


}
window.CafeProfiles=profiles;
window.CafePainter=IsoPainter;
window.drawCafePreview=(canvas,kind,avatar)=>{
  const p=new IsoPainter(canvas);p.resize(170,150);p.atlasUnit=.35;p.scale=p.atlasUnit*window.CafeMaster.data.tile.width/2/(TILE*COS);p.ox=85;p.oy=132;
  if(kind.startsWith('avatar')||kind==='employee'){p.atlasUnit=.35;p.person(avatar||'cedar',0,0,0,kind==='avatar-seated',0,false,'chair',kind==='employee'?.8:1);}
  else p.model(kind);
  const image=window.CafeMaster.imageFor();if(image&&!image.complete)image.addEventListener('load',()=>window.drawCafePreview(canvas,kind,avatar),{once:true});
};
class CafeRenderer extends IsoPainter {
constructor(canvas,hooks){super(canvas);this.hooks=hooks;this.drag=null;this.hits=[];this.hover=null;this.running=true;this.canvas.tabIndex=0;this.canvas.setAttribute('aria-label','Editable isometric café. Drag furniture; arrow keys move the selected item.');this.observer=new ResizeObserver(()=>this.fit());this.observer.observe(canvas);this.fit();this.contextMenu=e=>this.seatContext(e);canvas.addEventListener('contextmenu',this.contextMenu);this.pointerDown=e=>this.down(e);this.pointerMove=e=>this.move(e);this.pointerUp=e=>this.up(e);this.keyDown=e=>this.key(e);canvas.addEventListener('pointerdown',this.pointerDown);canvas.addEventListener('pointermove',this.pointerMove);canvas.addEventListener('pointerup',this.pointerUp);canvas.addEventListener('pointercancel',this.pointerUp);canvas.addEventListener('keydown',this.keyDown);this.loop=t=>{if(!this.running)return;this.draw(t);this.frame=requestAnimationFrame(this.loop);};this.frame=requestAnimationFrame(this.loop);}
fit(){const r=this.canvas.getBoundingClientRect();if(!r.width||!r.height)return;this.resize(r.width,r.height);this.scale=Math.min((r.width-35)/(SIZE*2*COS),(r.height-85)/(SIZE+180));this.ox=r.width/2;this.oy=(r.height-(SIZE-174)*this.scale)/2;}
itemOffset(p){const f=this.hooks.footprint(p);if(p.item==='wide-shelf')return p.rotation%180?{x:f.w,y:0}:{x:0,y:f.d};if(p.item==='cart')return p.rotation%180?{x:0,y:f.d}:{x:f.w,y:0};const lower=!!window.CafeMaster.furniture(p.item)||p.item==='employee'||p.id==='avatar',fraction=lower?window.CafeMaster.placementFraction(p.item):.5;const nudge=window.CafeMaster.placementNudge(p.item),shift=window.CafeMaster.placementShift(p.item,p.rotation||0);return {x:f.w*fraction+nudge+shift.x,y:f.d*fraction+nudge+shift.y};}
itemWorld(p){const offset=this.itemOffset(p);return {x:(p.gx+offset.x)*TILE,y:(p.gy+offset.y)*TILE};}
depthBounds(o){
  if(o.type==='person'||o.type==='employee')return {x0:o.x,y0:o.y,x1:o.x,y1:o.y};
  const fp=this.hooks.footprint(o.p),offset=this.itemOffset(o.p),cx=o.x+(fp.w/2-offset.x)*TILE,cy=o.y+(fp.d/2-offset.y)*TILE;
  return {x0:cx-fp.w*TILE/2,y0:cy-fp.d*TILE/2,x1:cx+fp.w*TILE/2,y1:cy+fp.d*TILE/2};
}
depthOrder(objects){
  const nodes=objects.map((o,i)=>({o,i,b:this.depthBounds(o),edges:[],incoming:0}));
  const behind=(a,b)=>a.x1<=b.x0+.01||a.y1<=b.y0+.01;
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
    const a=nodes[i],b=nodes[j];let first,last;
    if(a.o.type==='rug'){first=a;last=b;}else if(b.o.type==='rug'){first=b;last=a;}
    else if(a.o.seated&&(a.o.chairId||a.o.g?.chairId)===b.o.p?.id){first=b;last=a;}
    else if(b.o.seated&&(b.o.chairId||b.o.g?.chairId)===a.o.p?.id){first=a;last=b;}
    else {const ab=behind(a.b,b.b),ba=behind(b.b,a.b);if(ab&&!ba){first=a;last=b;}else if(ba&&!ab){first=b;last=a;}}
    if(first){first.edges.push(last);last.incoming++;}
  }
  const ordered=[],remaining=new Set(nodes),depth=n=>(n.b.x0+n.b.x1+n.b.y0+n.b.y1)/2;
  while(remaining.size){const ready=[...remaining].filter(n=>!n.incoming),next=(ready.length?ready:[...remaining]).sort((a,b)=>depth(a)-depth(b)||a.i-b.i)[0];remaining.delete(next);ordered.push(next.o);for(const n of next.edges)n.incoming--;}
  return ordered;
}
guestScale(o){return o.p?.id==='avatar'?.8:o.g&&!o.seated?.8:1;}
stripeDepth(o,sx,objects){
  if(o.type==='rug')return -Infinity;
  if(o.type==='person'||o.type==='employee'){
    const chair=o.seated&&objects.find(q=>q.p?.id===(o.chairId||o.g?.chairId));
    if(chair){const b=this.depthBounds(chair);return (b.x0+b.x1+b.y0+b.y1)/2+TILE*.1;}
    return o.x+o.y;
  }
  const b=this.depthBounds(o),difference=Math.max(b.x0-b.y1,Math.min(b.x1-b.y0,(sx-this.ox)/(COS*this.scale)));
  const x=Math.min(b.x1,b.y1+difference),y=x-difference;
  return x+y;
}
spriteExtent(o,time){
  const moving=o.g&&(o.g.phase==='walking'||o.g.phase==='leaving'),f=o.type==='person'?window.CafeCharacters.frame(o.id,o.r,o.seated,moving,time):o.type==='employee'?window.CafeCharacters.frame('cedar',o.r,false,false,time):window.CafeMaster.furniture(o.type);
  if(!f){const q=this.project(o.x,o.y);return {left:q.x-150*this.scale,right:q.x+150*this.scale};}
  const b=f.content,factor=o.type==='person'?window.CafeCharacters.scaleFor(o.seated,o.id)*this.guestScale(o):o.type==='employee'?window.CafeCharacters.scaleFor(false,'cedar')*.8:window.CafeMaster.artScale(f),k=this.atlasUnit*factor;
  let a=window.CafeMaster.groundAnchor(f);
  if(o.seated){const hip=window.CafeMaster.seatedAnchor(f),seat=window.CafeMaster.seatAttachment(o.seatKind);a={x:hip.x-(o.r===0?-seat.x:seat.x)/factor,y:hip.y-seat.y/factor};}
  const q=this.project(o.x,o.y),mirror=f.category==='furniture'&&o.r%180?-1:1,l=q.x+(b.x-a.x)*k*mirror,r=l+b.width*k*mirror;return {left:Math.min(l,r),right:Math.max(l,r)};
}
paintScene(objects,time){
  const c=this.ctx,extents=new Map(objects.map(o=>[o,this.spriteExtent(o,time)]));
  // Each screen column has its own floor contact depth, so a long sprite can pass both behind and in front of another object.
  for(let sx=0;sx<this.w;sx+=8){const stripe=objects.filter(o=>extents.get(o).right>sx&&extents.get(o).left<sx+8),nodes=stripe.map((o,i)=>({o,i,depth:this.stripeDepth(o,sx+4,objects)}));
    nodes.sort((a,b)=>a.depth-b.depth||a.i-b.i);
    // A seat's backrest belongs behind its occupant, while nearby tables retain their own floor depth.
    for(const n of nodes.filter(n=>n.o.seated)){const chairIndex=nodes.findIndex(q=>q.o.p?.id===(n.o.chairId||n.o.g?.chairId)),guestIndex=nodes.indexOf(n);if(chairIndex>guestIndex){const [chair]=nodes.splice(chairIndex,1);nodes.splice(guestIndex,0,chair);}}
    c.save();c.beginPath();c.rect(sx,0,Math.min(8,this.w-sx),this.h);c.clip();
    for(const {o} of nodes){if(o.type==='person')this.person(o.id,o.x,o.y,o.r,o.seated,time,o.g&&(o.g.phase==='walking'||o.g.phase==='leaving'),o.seatKind,this.guestScale(o));else this.model(o.type,o.x,o.y,o.r,{time});}c.restore();
  }
}
draw(time){const state=this.hooks.getState();if(!state)return;this.room(this.hooks.getEdit(),state.theme);const objects=[];for(const p of state.placed){const staff=p.item==='employee'&&this.hooks.baristaPosition?.(p),q=staff?{x:staff.x*TILE,y:staff.y*TILE}:this.itemWorld(p);objects.push({type:p.item,p,x:q.x,y:q.y,r:staff?staff.rotation:p.rotation||0,depth:q.x+q.y+(p.item==='counter'?10:0)});}const guests=this.hooks.getGuests();for(const g of guests){const q=this.hooks.guestPosition(g);objects.push({type:'person',id:g.avatarId,g,x:q.x*TILE,y:q.y*TILE,r:g.phase==='seated'?window.CafeMaster.seatRotation(state.placed.find(p=>p.id===g.chairId)?.rotation||0):g.rotation||0,seatKind:state.placed.find(p=>p.id===g.chairId)?.item||'chair',seated:g.phase==='seated',depth:(q.x+q.y)*TILE+12});}const owner=this.hooks.ownerPosition();objects.push({type:'person',id:state.avatarId||'maple',p:{id:'avatar'},x:owner.x*TILE,y:owner.y*TILE,r:owner.rotation||0,seated:!!owner.seated,seatKind:owner.seatKind,chairId:owner.chairId,depth:(owner.x+owner.y)*TILE+13});objects.splice(0,objects.length,...this.depthOrder(objects));this.paintScene(objects,time);this.hits=[];for(const o of objects){if(o.type==='employee'){const q=this.spriteLabel(o,'cedar',false,time),c=this.ctx;c.font='600 9px DM Sans, sans-serif';c.textAlign='center';c.fillStyle='#fcf8ea';c.beginPath();c.roundRect(q.x-23,q.y-10,46,15,5);c.fill();c.fillStyle='#7e725b';c.fillText('Barista',q.x,q.y+1);}if(o.type==='person'){const q=this.spriteLabel(o,o.id,o.seated,time),c=this.ctx,label=o.g?'Guest':'You';c.font='600 9px DM Sans, sans-serif';c.textAlign='center';c.fillStyle=o.g?'#f9f3e6':'#eee7d5';c.beginPath();c.roundRect(q.x-19,q.y-10,38,15,5);c.fill();c.fillStyle='#6a765a';c.fillText(label,q.x,q.y+1);}if(o.p){const q=this.project(o.x,o.y,0),h=(o.type==='person'?115:o.type==='shelf'?115:o.type==='counter'?105:o.type==='rug'?15:90)*this.scale;this.hits.push({id:o.p.id,...(this.spriteHit(o,time)||{x:q.x,y:q.y,w:(o.type==='counter'?90:42)*this.scale,h})});if(this.hooks.getSelected()===o.p.id){this.pose=null;const fp=this.hooks.footprint(o.p),a=o.p.gx*TILE,b=o.p.gy*TILE;this.poly([[a,b,.8],[a+fp.w*TILE,b,.8],[a+fp.w*TILE,b+fp.d*TILE,.8],[a,b+fp.d*TILE,.8]],'#7cad7020','#507950');}}}}
spriteLabel(o,id,seated,time){const f=window.CafeCharacters.frame(id,o.r,seated,!!o.g&&(o.g.phase==='walking'||o.g.phase==='leaving'),time),q=this.project(o.x,o.y);const a=o.seated?window.CafeMaster.seatedAnchor(f):window.CafeMaster.groundAnchor(f),offset=o.seated?window.CafeMaster.seatAttachment(o.seatKind).y:0;return {x:q.x,y:q.y+((f.content.y-a.y)*window.CafeCharacters.scaleFor(seated,id)*(o.type==='employee'?.8:this.guestScale(o))+offset)*this.atlasUnit-12};}
spriteHit(o,time){const f=o.type==='employee'?window.CafeCharacters.frame('cedar',o.r,false,false,time):o.type==='person'?window.CafeCharacters.frame(o.id,o.r,o.seated,false,time):window.CafeMaster.furniture(o.type);if(!f)return null;const b=f.content,a=window.CafeMaster.groundAnchor(f),q=this.project(o.x,o.y),k=this.atlasUnit*(o.type==='employee'?window.CafeCharacters.scaleFor(false,'cedar')*.8:o.type==='person'?window.CafeCharacters.scaleFor(o.seated,o.id)*this.guestScale(o):window.CafeMaster.artScale(f));return {x:q.x+(b.x+b.width/2-a.x)*k*(f.category==='furniture'&&o.r%180?-1:1),y:q.y+(b.y+b.height-a.y)*k,w:b.width*k/2,h:b.height*k};}
coords(e){const r=this.canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
seatContext(e){e.preventDefault();const q=this.coords(e),hits=[...this.hits].reverse(),inside=o=>Math.abs(q.x-o.x)<o.w&&q.y<=o.y+10&&q.y>=o.y-o.h;const state=this.hooks.getState(),hit=hits.find(o=>inside(o)&&(['chair','armchair','stool','sofa'].includes(this.hooks.getItem(o.id)?.item)||(o.id==='avatar'&&state.avatarSeatId)));if(!hit)return;const id=hit.id==='avatar'?state.avatarSeatId:hit.id;this.hooks.onSelect(id);this.hooks.onSeatMenu?.(id);}
down(e){if(e.button!==undefined&&e.button!==0)return;const q=this.coords(e),hit=[...this.hits].reverse().find(o=>Math.abs(q.x-o.x)<o.w&&q.y<=o.y+10&&q.y>=o.y-o.h);if(!hit){this.hooks.onSelect(null);return;}this.hooks.onSelect(hit.id);this.canvas.focus();if(!this.hooks.getEdit())return;const item=this.hooks.getItem(hit.id),base=this.itemWorld(item),floor=this.unproject(q.x,q.y);this.drag={id:hit.id,dx:floor.x-base.x,dy:floor.y-base.y};this.canvas.setPointerCapture(e.pointerId);e.preventDefault();}
move(e){if(!this.drag)return;const q=this.coords(e),world=this.unproject(q.x,q.y),item=this.hooks.getItem(this.drag.id),fp=this.hooks.footprint(item),offset=this.itemOffset(item),gx=Math.max(0,Math.min(8-fp.w,Math.round((world.x-this.drag.dx)/TILE-offset.x))),gy=Math.max(0,Math.min(8-fp.d,Math.round((world.y-this.drag.dy)/TILE-offset.y)));this.hooks.onMove(this.drag.id,gx,gy,false);}
up(){if(this.drag){this.hooks.onCommit();this.drag=null;}}
key(e){const id=this.hooks.getSelected();if(!id||!this.hooks.getEdit())return;const p=this.hooks.getItem(id);if(!p)return;let gx=p.gx,gy=p.gy;if(e.key==='ArrowLeft')gx--;else if(e.key==='ArrowRight')gx++;else if(e.key==='ArrowUp')gy--;else if(e.key==='ArrowDown')gy++;else return;e.preventDefault();this.hooks.onMove(id,Math.max(0,Math.min(7,gx)),Math.max(0,Math.min(7,gy)),true);}
destroy(){this.running=false;cancelAnimationFrame(this.frame);this.observer.disconnect();for(const [name,fn] of [['pointerdown',this.pointerDown],['pointermove',this.pointerMove],['pointerup',this.pointerUp],['pointercancel',this.pointerUp],['keydown',this.keyDown],['contextmenu',this.contextMenu]])this.canvas.removeEventListener(name,fn);}
}
window.CafeRenderer=CafeRenderer;
})();
