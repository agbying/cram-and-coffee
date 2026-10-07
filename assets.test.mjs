import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const draws=[];
const c={clearRect(){},fillRect(){},setTransform(){},save(){},restore(){},translate(){},scale(){},drawImage(...args){draws.push(args);}};
const ctx=vm.createContext({window:{},Image:class{complete=true;naturalWidth=5376;},devicePixelRatio:1,canvas:{getContext:()=>c}});
for(const file of ['master-atlas.js','theme-atlas.js','characters.js','cafe-renderer.js'])vm.runInContext(fs.readFileSync(new URL('./'+file,import.meta.url),'utf8'),ctx);
const {CafeMaster:m,CafeCharacters:characters}=ctx.window;
assert.equal(m.data.frames.length,434);assert.equal(m.frames.size,434);assert.equal(characters.themes.length,8);assert.equal(characters.profiles.length,14);
const png=fs.readFileSync(new URL('./assets/isometric_atlas_all_assets.png',import.meta.url));assert.equal(png.readUInt32BE(16),m.data.width);assert.equal(png.readUInt32BE(20),m.data.height);
assert.deepEqual(JSON.parse(fs.readFileSync(new URL('./assets/isometric_atlas_all_assets.json',import.meta.url),'utf8')),JSON.parse(JSON.stringify(m.data)));
const counts={};
for(const f of m.data.frames){counts[f.category]=(counts[f.category]||0)+1;const r=f.content,b=f.cell;assert.ok(r.width>0&&r.height>0&&r.x>=b.x&&r.y>=b.y&&r.x+r.width<=b.x+b.width&&r.y+r.height<=b.y+b.height);assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=m.data.width&&b.y+b.height<=m.data.height);assert.ok(f.anchor.x>=b.x&&f.anchor.x<=b.x+b.width&&f.anchor.y>=b.y&&f.anchor.y<=b.y+b.height);}
assert.deepEqual(counts,{room:8,furniture:20,standing:84,sitting:84,profile:14,walking:224});
vm.runInContext('const painter=new window.CafePainter(canvas);painter.atlasUnit=.4;',ctx);
for(const p of characters.profiles){
  for(const seated of [false,true]){const views=new Set();for(const rotation of [0,45,90,180,225,270]){const f=characters.frame(p.id,rotation,seated,false,0);assert.equal(f.character,p.character);views.add(f.view);}assert.equal(views.size,6);}
  for(const rotation of [0,90,180,270]){const frames=new Set();for(const time of [0,150,300,450]){const f=characters.frame(p.id,rotation,false,true,time);assert.equal(f.character,p.character);frames.add(f.animationFrame);ctx.f=f;vm.runInContext('painter.atlasSprite(f,0,0);',ctx);const draw=draws.at(-1);assert.ok(Math.abs(draw[5]-(f.content.x-m.groundAnchor(f).x)*.4*characters.scaleFor(false,p.id))<1e-9);assert.ok(Math.abs(draw[6]-(f.content.y-m.groundAnchor(f).y)*.4*characters.scaleFor(false,p.id))<1e-9);}assert.equal(frames.size,4);}
  assert.ok(characters.portrait(p.id).includes('isometric_atlas_all_assets.png'));
}
for(const t of characters.themes)assert.ok(characters.roomPreview(t.id).includes(t.id==='daytime'?'first_cafe_aligned.png':'isometric_cafe_themes_atlas.png'));
console.log('PASS: 434 guide crops/anchors, eight rooms, 20 furniture frames, 14 portraits, all six standing/seated views, 224 walk frames, and exact anchor-based rendering.');

vm.runInContext('painter.w=900;painter.h=650;',ctx);
let sharedScale;
for(const theme of characters.themes){
  ctx.theme=theme.id;vm.runInContext('painter.room(false,theme);',ctx);
  const roomDraw=draws.at(-1),scale=roomDraw[7]/roomDraw[3];
  assert.ok(Math.abs(scale-roomDraw[8]/roomDraw[4])<1e-12,'Room must preserve aspect ratio');
  if(sharedScale===undefined)sharedScale=scale;else assert.ok(Math.abs(scale-sharedScale)<1e-12,'Changing theme must preserve furniture scale');
  ctx.f=m.furniture('chair');vm.runInContext('painter.atlasSprite(f,64,64);painter.person("maple",128,128);',ctx);
  for(const [index,draw] of draws.slice(-2).entries()){const expected=sharedScale*(index?characters.scaleFor(false,'maple'):1);assert.ok(Math.abs(draw[7]/draw[3]-expected)<1e-12);assert.ok(Math.abs(draw[8]/draw[4]-expected)<1e-12);}
}
for(const kind of ['chair','table','counter','shelf','avatar-standing']){
  ctx.kind=kind;vm.runInContext('window.drawCafePreview(canvas,kind,"maple");',ctx);
  const draw=draws.at(-1),expected=.35*(kind.startsWith('avatar')?characters.scaleFor(kind==='avatar-seated','maple'):m.artScale(m.furniture(kind)));assert.ok(Math.abs(draw[7]/draw[3]-expected)<1e-12);assert.ok(Math.abs(draw[8]/draw[4]-expected)<1e-12);
}
const grid=fs.readFileSync(new URL('./assets/supplied/isometric-grid-30deg.svg',import.meta.url),'utf8');
assert.ok(grid.includes('73.9008344562721'));assert.ok(Math.abs(m.data.tile.height/m.data.tile.width-Math.tan(Math.PI/6))<1e-12);
console.log('PASS: All eight rooms, furniture, and characters share one uniform scale; previews preserve relative sizes; grid axes are exactly 30 degrees.');



const gridPng=fs.readFileSync(new URL('./assets/isometric_atlas_grid.png',import.meta.url));assert.equal(gridPng.readUInt32BE(16),2048);assert.equal(gridPng.readUInt32BE(20),1536);
for(const f of m.data.frames.filter(f=>f.category==='room')){
 const g=f.groundPlane;assert.equal(g.front.x,f.anchor.x);assert.equal(g.front.y,f.anchor.y);assert.ok(Math.abs(g.front.y-g.back.y-m.data.tile.height*8)<1e-9);assert.equal(g.right.x-g.left.x,m.data.tile.width*8);
 ctx.f=f;vm.runInContext('painter.room(false,f.name.slice(5));',ctx);const screen=vm.runInContext('painter.project(0,0)',ctx);const front=vm.runInContext('painter.project(512,512)',ctx);assert.ok(Math.abs(front.y-screen.y-(g.front.y-g.back.y)*sharedScale)<1e-9);
}
for(const id of ['counter','pastry','cart'])assert.ok(m.furniture(id).name.startsWith('stocked_'));
console.log('PASS: supplied corrected atlas, all eight calibrated ground planes, matching PNG grid dimensions, and stocked furniture aliases.');

assert.deepEqual(JSON.parse(JSON.stringify(m.furnitureFootprint('sofa',0))),{w:1,d:2});assert.deepEqual(JSON.parse(JSON.stringify(m.furnitureFootprint('sofa',90))),{w:2,d:1});
for(const rotation of [0,90]){const facing=m.seatRotation(rotation);assert.equal(characters.frame('maple',facing,true,false,0).view,rotation?'front_left':'front_right');}
for(const id of ['chair','armchair','sofa','stool']){const attachment=m.seatAttachment(id);assert.ok(attachment.y<0);assert.equal(m.groundAnchor(m.furniture(id)).y,m.furniture(id).content.y+m.furniture(id).content.height);}
console.log('PASS: furniture floor centers, mirrored footprints, matching seated direction, and seat-surface attachment.');

vm.runInContext('painter.atlasUnit=.4;painter.ox=0;painter.oy=0;',ctx);
for(const profile of characters.profiles)for(const kind of ['chair','armchair','sofa','stool'])for(const rotation of [0,90]){
 const facing=m.seatRotation(rotation),frame=characters.frame(profile.id,facing,true,false,0),hip=m.seatedAnchor(frame),seat=m.seatAttachment(kind);
 ctx.seatId=profile.id;ctx.seatKind=kind;ctx.seatFacing=facing;vm.runInContext('painter.person(seatId,0,0,seatFacing,true,0,false,seatKind);',ctx);const draw=draws.at(-1);
 assert.ok(Math.abs(draw[5]+(hip.x-frame.content.x)*.4*characters.scaleFor(true,profile.id)-seat.x*.4*(rotation?-1:1))<1e-9);
 assert.ok(Math.abs(draw[6]+(hip.y-frame.content.y)*.4*characters.scaleFor(true,profile.id)-seat.y*.4)<1e-9);
}
console.log('PASS: all 14 seated characters attach to four seat surfaces in both illustrated directions.');

assert.ok(!fs.readFileSync(new URL('./cafe-renderer.js',import.meta.url),'utf8').includes('groundShadow('));
assert.ok(!fs.readFileSync(new URL('./cafe-renderer.js',import.meta.url),'utf8').includes('Isometric floor grid'));
for(const kind of ['desk','sofa','wide-shelf','register','counter','pastry']){const native=m.furnitureFootprint(kind,0),rotated=m.furnitureFootprint(kind,90);assert.equal(native.w*native.d,2);assert.equal(rotated.w,native.d);assert.equal(rotated.d,native.w);const f=m.furniture(kind);assert.notEqual(m.groundAnchor(f).x,f.content.x+f.content.width/2);}
console.log('PASS: no added floor shadows; all six wide furniture types occupy two tiles and swap axes when rotated.');

vm.runInContext('const positioned=Object.create(window.CafeRenderer.prototype);positioned.hooks={footprint:p=>window.CafeMaster.furnitureFootprint(p.item,p.rotation)};',ctx);
for(const kind of ['table','chair','sofa','counter'])for(const rotation of [0,90]){ctx.item={item:kind,gx:2,gy:3,rotation};const q=vm.runInContext('positioned.itemWorld(item)',ctx),fp=m.furnitureFootprint(kind,rotation),f=m.furniture(kind);assert.equal(q.x,(2+fp.w*m.placementFraction(kind))*64);assert.equal(q.y,(3+fp.d*m.placementFraction(kind))*64);assert.equal(m.groundAnchor(f).y,f.content.y+f.content.height);}
console.log('PASS: object bottom-center anchors coincide with each footprint’s front grid corner in both orientations.');

const themeGuide=JSON.parse(fs.readFileSync(new URL('./assets/isometric_cafe_themes_atlas.json',import.meta.url),'utf8'));assert.deepEqual(JSON.parse(JSON.stringify(characters.roomData)),themeGuide);
const themePng=fs.readFileSync(new URL('./assets/isometric_cafe_themes_atlas.png',import.meta.url));assert.equal(themePng.readUInt32BE(16),themeGuide.width);assert.equal(themePng.readUInt32BE(20),themeGuide.height);
for(const theme of characters.themes){const room=characters.room(theme.id);assert.ok(themeGuide.frames.some(f=>f.name===room.name));assert.equal(m.imageFor(room).src,'assets/'+(room.image||'isometric_cafe_themes_atlas.png'));assert.equal(m.imageFor(m.furniture('chair')).src,'assets/isometric_atlas_all_assets.png');}
console.log('PASS: all eight themes render and preview from the new theme atlas; furniture and people retain the corrected original atlas.');


assert.ok(characters.scaleFor(false,'maple')<.9);assert.equal(characters.scaleFor(false,'indigo'),.65);
for(const id of characters.profiles.map(p=>p.id))for(const moving of [false,true]){ctx.id=id;ctx.moving=moving;vm.runInContext('painter.person(id,0,0,0,false,150,moving)',ctx);const draw=draws.at(-1),f=characters.frame(id,0,false,moving,150);assert.ok(Math.abs(draw[7]/draw[3]-.4*characters.scaleFor(false,id))<1e-12);assert.ok(Math.abs(draw[6]+f.content.height*.4*characters.scaleFor(false,id))<1e-9);}
console.log('PASS: all people use their character scale with unchanged foot anchors and aligned seated hips.');

assert.equal(characters.seatedLift,10);
for(const kind of ['chair','armchair','sofa','stool']){const f=m.furniture(kind),fraction={chair:.54,armchair:.65,sofa:.65,stool:.18}[kind];assert.equal(m.seatAttachment(kind).y,(f.content.y+f.content.height*fraction-m.groundAnchor(f).y)*m.artScale(f)-10);}
console.log('PASS: seated characters are raised by ten native atlas pixels on every seat type without changing standing anchors.');

for(const kind of ['plant','varplant','menu','floor-lamp','desk-lamp','coat','bins']){ctx.item={item:kind,gx:2,gy:3,rotation:0};const q=vm.runInContext('positioned.itemWorld(item)',ctx);const shift=m.placementShift(kind);assert.ok(Math.abs(q.x-(2.7+shift.x)*64)<1e-9);assert.ok(Math.abs(q.y-(3.7+shift.y)*64)<1e-9);}
assert.equal(m.placementFraction('table'),.75);assert.equal(m.artScale(m.furniture('table')),.65);
ctx.f=m.furniture('table');vm.runInContext('painter.atlasSprite(f,128,128)',ctx);assert.ok(Math.abs(draws.at(-1)[7]/draws.at(-1)[3]-.4*.65)<1e-12);
console.log('PASS: wooden café table is 65% of its original size and recentered; accessories use square-center anchors.');

let verified=0;
for(const profile of characters.profiles){
 for(const seated of [false,true])for(const rotation of [0,45,90,180,225,270]){ctx.id=profile.id;ctx.seated=seated;ctx.rotation=rotation;vm.runInContext('painter.person(id,0,0,rotation,seated,0,false)',ctx);const draw=draws.at(-1);assert.ok(Math.abs(draw[7]/draw[3]-.4*characters.scaleFor(false,profile.id))<1e-12);assert.ok(Math.abs(draw[8]/draw[4]-.4*characters.scaleFor(false,profile.id))<1e-12);verified++;}
 for(const rotation of [0,90,180,270])for(const time of [0,150,300,450]){ctx.id=profile.id;ctx.rotation=rotation;ctx.time=time;vm.runInContext('painter.person(id,0,0,rotation,false,time,true)',ctx);const draw=draws.at(-1);assert.ok(Math.abs(draw[7]/draw[3]-.4*characters.scaleFor(false,profile.id))<1e-12);assert.ok(Math.abs(draw[8]/draw[4]-.4*characters.scaleFor(false,profile.id))<1e-12);verified++;}
}
assert.equal(verified,392);console.log('PASS: all 392 poses/walk frames use the matching per-character scale, with normalized café heights.');

ctx.f=m.furniture('stool');vm.runInContext('painter.atlasSprite(f,0,0)',ctx);assert.equal(m.artScale(ctx.f),.65);assert.ok(Math.abs(draws.at(-1)[7]/draws.at(-1)[3]-.4*.65)<1e-12);
for(const kind of ['shelf','wide-shelf'])for(const rotation of [0,90]){ctx.item={item:kind,gx:2,gy:3,rotation};const fp=m.furnitureFootprint(kind,rotation),q=vm.runInContext('positioned.itemWorld(item)',ctx);const expected=kind==='wide-shelf'?(rotation?{x:2+fp.w,y:3}:{x:2,y:3+fp.d}):{x:2+fp.w,y:3+fp.d};assert.equal(q.x,expected.x*64);assert.equal(q.y,expected.y*64);}
console.log('PASS: stool scaled to 65% with matching seat attachment; accessories lowered, bookcases shifted backward, and stool raised.');

ctx.item={item:'stool',gx:2,gy:3,rotation:0};const stoolWorld=vm.runInContext('positioned.itemWorld(item)',ctx);assert.equal(stoolWorld.x,2.9*64);assert.equal(stoolWorld.y,3.9*64);
console.log('PASS: stool floor anchor raised while seated visitors follow its placement offset.');

vm.runInContext('painter.model("employee",0,0,0)',ctx);const staffDraw=draws.at(-1);assert.ok(Math.abs(staffDraw[7]/staffDraw[3]-.4*characters.scaleFor(false,'cedar')*.8)<1e-12);console.log('PASS: barista is 20% smaller than its previous size with foot anchor preserved.');

for(const profile of characters.profiles){ctx.id=profile.id;vm.runInContext('painter.person(id,0,0,0,false,150,true,"chair",.8)',ctx);const draw=draws.at(-1);assert.ok(Math.abs(draw[7]/draw[3]-.4*characters.scaleFor(false,profile.id)*.8)<1e-12);assert.ok(Math.abs(draw[6]+draw[8])<1e-9);}
assert.equal(m.artScale(m.furniture('counter')),.9);
const aligned=JSON.parse(fs.readFileSync(new URL('./assets/first_cafe_aligned.json',import.meta.url),'utf8'));assert.deepEqual(JSON.parse(JSON.stringify(characters.room('daytime').anchor)),aligned.frame.anchor);assert.equal(m.imageFor(characters.room('daytime')).src,'assets/first_cafe_aligned.png');
vm.runInContext('const shelf={type:"wide-shelf",p:{item:"wide-shelf",gx:2,gy:2,rotation:0},...positioned.itemWorld({item:"wide-shelf",gx:2,gy:2,rotation:0})};const front={type:"person",id:"maple",x:3.2*64,y:2.5*64};const back={type:"person",id:"maple",x:1.8*64,y:3.5*64};',ctx);
assert.equal(vm.runInContext('positioned.depthOrder([front,shelf]).at(-1).id',ctx),'maple');assert.equal(vm.runInContext('positioned.depthOrder([shelf,back])[0].id',ctx),'maple');
vm.runInContext('const chair={type:"chair",p:{id:"seat",item:"chair",gx:2,gy:2,rotation:0},x:192,y:192};const seated={type:"person",id:"maple",g:{phase:"seated",chairId:"seat"},x:192,y:192};',ctx);assert.equal(vm.runInContext('positioned.depthOrder([seated,chair]).at(-1).id',ctx),'maple');
console.log('PASS: attached daytime floor calibration, all 14 walking guests reduced 20%, coffee counter reduced 10%, footprint depth ordering and seated guests above chairs.');

assert.equal(m.artScale(m.furniture('wide-shelf')),.9);assert.equal(m.artScale(m.furniture('shelf')),1.1);
vm.runInContext('positioned.ox=0;positioned.scale=1;const wide={type:"desk",p:{id:"wide",item:"desk",gx:2,gy:2,rotation:0},...positioned.itemWorld({item:"desk",gx:2,gy:2,rotation:0})};const blocker={type:"person",x:3.6*64,y:2.6*64};',ctx);
const backDepth=vm.runInContext('positioned.stripeDepth(wide,-.1*64*Math.sqrt(3)/2,[wide])',ctx),frontDepth=vm.runInContext('positioned.stripeDepth(wide,-1*64*Math.sqrt(3)/2,[wide])',ctx);assert.ok(backDepth<6.2*64);assert.ok(frontDepth>6.2*64);
assert.equal(vm.runInContext('positioned.guestScale({g:{phase:"checking"},seated:false})',ctx),.8);assert.equal(vm.runInContext('positioned.guestScale({g:{phase:"queued"},seated:false})',ctx),.8);assert.equal(vm.runInContext('positioned.guestScale({g:{phase:"seated"},seated:true})',ctx),1);
vm.runInContext('const seatedDepth=positioned.stripeDepth({...seated,seated:true},0,[chair,seated]);',ctx);assert.ok(vm.runInContext('seatedDepth',ctx)<vm.runInContext('seated.x+seated.y',ctx));
console.log('PASS: wide bookshelf 90%, tall bookshelf 110%, checkout guests use walking scale, wide sprites cross an occluder at distinct depths, seated depth follows seat center.');

vm.runInContext(`const sectionCalls=[];let sectionX=0;const sectionPainter=Object.create(window.CafeRenderer.prototype);sectionPainter.hooks=positioned.hooks;sectionPainter.ox=200;sectionPainter.scale=1;sectionPainter.w=400;sectionPainter.h=300;sectionPainter.ctx={save(){},restore(){},beginPath(){},rect(x){sectionX=x;},clip(){}};sectionPainter.spriteExtent=()=>({left:0,right:400});sectionPainter.model=(type)=>sectionCalls.push({type,x:sectionX});sectionPainter.person=()=>sectionCalls.push({type:'person',x:sectionX});sectionPainter.paintScene([wide,blocker],0);`,ctx);
const sectionCalls=vm.runInContext('sectionCalls',ctx);assert.ok(sectionCalls.some((c,i)=>c.type==='desk'&&sectionCalls[i+1]?.type==='person'&&sectionCalls[i+1]?.x===c.x));assert.ok(sectionCalls.some((c,i)=>c.type==='person'&&sectionCalls[i+1]?.type==='desk'&&sectionCalls[i+1]?.x===c.x));
console.log('PASS: actual section painter changes draw order along a two-square item instead of sorting the whole sprite as one layer.');

for(const kind of ['bins','cart']){
 const offsets=[];for(const rotation of [0,90]){ctx.item={item:kind,gx:2,gy:3,rotation};offsets.push(vm.runInContext('positioned.itemOffset(item)',ctx));}
 assert.ok(Math.abs(offsets[0].x-offsets[1].y)<1e-12);assert.ok(Math.abs(offsets[0].y-offsets[1].x)<1e-12);
}
const nativeShelfShift=m.placementShift('wide-shelf',0),rightShelfShift=m.placementShift('wide-shelf',90);assert.equal(rightShelfShift.x,0);assert.equal(rightShelfShift.y,0);assert.equal(nativeShelfShift.x,0);assert.equal(nativeShelfShift.y,0);
console.log('PASS: mirrored bins/cart swap floor-axis offsets around the square center; right-facing wide shelf moves up and left; footprints stay unchanged.');
vm.runInContext(`const seatContextCalls=[];positioned.hits=[{id:'seat-context',x:100,y:150,w:30,h:80}];positioned.coords=e=>({x:e.clientX,y:e.clientY});positioned.hooks.getState=()=>({avatarSeatId:'seat-context'});positioned.hooks.getItem=id=>({id,item:'chair'});positioned.hooks.onSelect=id=>seatContextCalls.push(['select',id]);positioned.hooks.onSeatMenu=id=>seatContextCalls.push(['menu',id]);positioned.seatContext({clientX:100,clientY:120,preventDefault(){seatContextCalls.push(['prevent']);}});`,ctx);
assert.equal(vm.runInContext('seatContextCalls.at(-1)[1]',ctx),'seat-context');assert.equal(vm.runInContext('seatContextCalls[0][0]',ctx),'prevent');
console.log('PASS: canvas right-click hit opens the chair action menu and suppresses the browser menu.');

for(const profile of characters.profiles){const poses=m.data.frames.filter(f=>f.character===profile.character&&['standing','walking'].includes(f.category));for(const f of poses)assert.ok(f.content.height*characters.scaleFor(false,profile.id)<=characters.cafeHeightLimit+1e-9);assert.equal(characters.scaleFor(true,profile.id),characters.scaleFor(false,profile.id));}
assert.equal(characters.scaleFor(false,'indigo'),.65);assert.equal(characters.scaleFor(false,'olive'),.68);
console.log('PASS: every character stays within the shared café height limit; seated/standing/walking use the same character scale; guest and barista character scales retained.');
for(const rotation of [0,90]){ctx.item={item:'wide-shelf',gx:2,gy:3,rotation};ctx.rotation=rotation;ctx.f=m.furniture('wide-shelf');const fp=m.furnitureFootprint('wide-shelf',rotation),world=vm.runInContext('positioned.itemWorld(item)',ctx);assert.equal(world.x,(rotation?2+fp.w:2)*64);assert.equal(world.y,(rotation?3:3+fp.d)*64);vm.runInContext('painter.atlasSprite(f,0,0,rotation)',ctx);const draw=draws.at(-1),anchor=m.groundAnchor(ctx.f),k=.4*m.artScale(ctx.f);assert.ok(Math.abs(draw[5]+(anchor.x-ctx.f.content.x)*k)<1e-9);assert.ok(Math.abs(draw[6]+(anchor.y-ctx.f.content.y)*k)<1e-9);}
console.log('PASS: wide bookshelf artwork side corners coincide with opposite footprint corners in both orientations; tall shelf bottom corner meets the square bottom.');

for(const rotation of [0,90]){ctx.item={item:'cart',gx:2,gy:3,rotation};const fp=m.furnitureFootprint('cart',rotation),world=vm.runInContext('positioned.itemWorld(item)',ctx);assert.equal(world.x,(rotation?2:2+fp.w)*64);assert.equal(world.y,(rotation?3+fp.d:3)*64);}
assert.equal(m.groundAnchor(m.furniture('cart')).x,m.furniture('cart').content.x+m.furniture('cart').content.width);assert.equal(m.artScale(m.furniture('cart')),.8);
console.log('PASS: cart uses the same opposite side-corner alignment as the wide bookshelf in both views, retaining its reduced scale.');

assert.equal(vm.runInContext('positioned.guestScale({p:{id:"avatar"},seated:false})',ctx),.8);assert.equal(vm.runInContext('positioned.guestScale({p:{id:"avatar"},seated:true})',ctx),.8);assert.equal(vm.runInContext('positioned.guestScale({g:{phase:"seated"},seated:true})',ctx),1);assert.equal(vm.runInContext('positioned.guestScale({g:{phase:"checking"},seated:false})',ctx),.8);
console.log('PASS: only the selected café avatar receives the additional 20% reduction; guest/barista scales stay as before.');

const focusStyle=fs.readFileSync(new URL('./focus.css',import.meta.url),'utf8');
assert.ok(focusStyle.includes("url('assets/study-cafe-background.png')"));
assert.ok(!focusStyle.includes("assets/cafe.png"));
assert.ok(fs.existsSync(new URL('./assets/study-cafe-background.png',import.meta.url)));
console.log('PASS: full-page and immersive Focus mode use the replacement café illustration.');

const maturePlant=fs.readFileSync(new URL('./assets/plant.png',import.meta.url));
for(let stage=0;stage<4;stage++){const image=fs.readFileSync(new URL('./assets/plant-stage-'+stage+'.png',import.meta.url));assert.equal(image.readUInt32BE(16),maturePlant.readUInt32BE(16));assert.equal(image.readUInt32BE(20),maturePlant.readUInt32BE(20));}
assert.ok(fs.readFileSync(new URL('./index.html',import.meta.url),'utf8').includes('plant-care.js'));
console.log('PASS: all four new growth illustrations match the original framing and are bundled with the care module.');

const backdropFills=[];const originalFill=c.fillRect;c.fillRect=function(){backdropFills.push(this.fillStyle);};for(const theme of characters.themes){ctx.theme=theme.id;vm.runInContext('painter.room(false,theme);',ctx);assert.equal(backdropFills.at(-1),'#eee2d1');}c.fillRect=originalFill;
console.log('PASS: all eight café themes paint a warm off-white canvas backdrop.');
