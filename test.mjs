import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const nodes=new Map(),storage=new Map(),documentEvents=new Map();
const node=()=>({innerHTML:'',textContent:'',value:'',style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;},append(){},remove(){}});
for(const id of ['#app','#modal','#toast'])nodes.set(id,node());
const context=vm.createContext({console,crypto:webcrypto,structuredClone,Date,Math,JSON,Number,String,Set,Object,Array,Blob,URL,setTimeout:()=>1,clearTimeout(){},setInterval(){},devicePixelRatio:1,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{addEventListener(type,handler){documentEvents.set(type,handler);},querySelector:s=>nodes.get(s)||null,querySelectorAll:()=>[],body:{classList:{toggle(){},remove(){}}},createElement:node},window:{FIREBASE_CONFIG:null,scrollTo(){}},fakeCanvas:{getContext:()=>({})},FormData:class{constructor(f){this.data=f.data;}get(k){return this.data[k]??'';}has(k){return k in this.data;}}});
vm.runInContext(fs.readFileSync(new URL('./supplied-assets.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./master-atlas.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./theme-atlas.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./characters.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./clock.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./plant-care.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./notebooks.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./alarms.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./study-tools.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./audio.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./furniture-assets.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./cafe-renderer.js',import.meta.url),'utf8'),context);
vm.runInContext(fs.readFileSync(new URL('./app.js',import.meta.url),'utf8').replace(/init\(\);\s*$/,''),context);
const run=c=>vm.runInContext(c,context),click=d=>run(`click({target:{closest:()=>({dataset:${d}})}})`);
run('loadGuest();');assert.equal(run('state.coins'),10000);assert.equal(run('state.tasks.length'),0);assert.equal(run('state.sessions.length'),0);assert.equal(run('state.placed.filter(p=>p.item==="chair").length'),1);assert.equal(run('state.placed.filter(p=>p.item==="table").length'),1);assert.equal(run('products.some(p=>p.id==="light"||p.id==="ivy")'),false);
await click("{buy:'plant'}");await click("{buy:'plant'}");assert.equal(run('state.coins'),9600);assert.equal(run('state.inventory.plant'),2);assert.equal(run('availableQuantity("plant")'),2);
await click("{place:'plant'}");await click("{place:'plant'}");assert.equal(run('state.placed.filter(p=>p.item==="plant").length'),2);assert.equal(run('availableQuantity("plant")'),0);
await click("{action:'remove-item'}");assert.equal(run('availableQuantity("plant")'),1);await click("{place:'plant'}");assert.equal(run('state.coins'),9600);assert.equal(run('availableQuantity("plant")'),0);
run('state.coins=10;');await click("{buy:'shelf'}");assert.equal(run('state.coins'),10);assert.equal(run('state.owned.includes("shelf")'),false);
run('state=demo();migrateCafe();state.xp=0;state.coins=0;timer.mode="focus";timer.total=60;timer.sessionId="one";finishSession();');assert.equal(run('state.sessions.length'),1);assert.equal(run('state.coins'),25);assert.equal(run('state.xp'),50);
run('timer.mode="focus";timer.total=60;timer.sessionId="one";finishSession();');assert.equal(run('state.sessions.length'),1);assert.equal(run('state.coins'),25);await click("{action:'skip'}");assert.equal(run('state.sessions.length'),1);
run('state.cards=[{id:uid(),q:"Q",a:"A",subject:"General",due:today(),interval:0}];ensureDecks();activeDeck=state.decks[0].id;reviewIndex=0;advanceCard("good");advanceCard("easy");');assert.equal(run('state.xp'),55);assert.equal(run('state.cards[0].interval'),3);
run('timer.mode="short";finishSession();');await click("{quest:'break'}");await click("{quest:'break'}");assert.equal(run('state.xp'),85);
run('state.classes.push("Biology");state.tasks=parseBulkTasks("Read chapter 1 | 2026-10-05 | 30 | High | Bring notes\\nReview slides", "Biology")');assert.equal(run('state.tasks.length'),2);assert.equal(run('state.tasks[1].minutes'),25);assert.equal(run('state.tasks[0].notes'),'Bring notes');assert.throws(()=>run('parseBulkTasks("Bad date | 2026-02-30", "Biology")'));assert.throws(()=>run('parseBulkTasks("Bad minutes | | 0", "Biology")'));
run('view="tasks";classFilter="Biology";render()');assert.ok(nodes.get('#app').innerHTML.includes('Review slides'));run('classFilter="General";render()');assert.ok(!nodes.get('#app').innerHTML.includes('Review slides'));
await run('submit({preventDefault(){},target:{id:"class-form",data:{name:"Chemistry"}}})');assert.equal(run('state.classes.includes("Chemistry")'),true);
await run('submit({preventDefault(){},target:{id:"bulk-task-form",data:{subject:"Chemistry",tasks:"Lab report\\nRead chapter 2 | 2026-10-09 | 40"}}})');assert.equal(run('state.tasks.filter(t=>t.subject==="Chemistry").length'),2);
run('state=demo();migrateCafe();cafeGuests=[];const seatStart=Date.now();spawnCafeGuest(seatStart);updateCafeGuests(seatStart+3000);');assert.equal(run('cafeGuests[0].phase'),'seated');
run('state=demo();migrateCafe();state.placed=state.placed.filter(p=>p.item!=="chair");state.placed.push({id:"test-register",item:"register",gx:3,gy:1,rotation:0});cafeGuests=[];const queueStart=Date.now();spawnCafeGuest(queueStart);updateCafeGuests(queueStart+3000);');assert.equal(run('cafeGuests[0].phase'),'checking');assert.equal(run('ownerPosition().x'),run('counterPosition(-.8).x'));
run('updateCafeGuests(queueStart+9000);updateCafeGuests(queueStart+9500);');assert.equal(run('state.coins'),10005);assert.equal(run('cafeGuests[0].phase'),'leaving');run('updateCafeGuests(queueStart+13000)');assert.equal(run('cafeGuests.length'),0);
run('state=demo();migrateCafe();const quietInterval=guestInterval();state.sessions.push({date:today(),minutes:25});state.tasks.push({id:uid(),done:true,completedDate:today()});state.quests[today()+":reviews"]=5;');assert.equal(run('guestCapacity()'),10);run('guest=false');assert.equal(run('guestCapacity()'),3);run('guest=true');assert.equal(run('guestInterval()<quietInterval'),true);
assert.equal(run('footprint({item:"counter",rotation:0}).w'),2);assert.equal(run('footprint({item:"counter",rotation:90}).d'),2);assert.equal(run('canPlace({item:"counter",rotation:0},7,7)'),false);
run('const painter=new window.CafePainter(fakeCanvas);painter.scale=.8;painter.ox=400;painter.oy=190;');for(let x=0;x<=512;x+=32)for(let y=0;y<=512;y+=32){assert.ok(run(`Math.abs(painter.unproject(painter.project(${x},${y}).x,painter.project(${x},${y}).y).x-${x})<1e-8`));assert.ok(run(`Math.abs(painter.unproject(painter.project(${x},${y}).x,painter.project(${x},${y}).y).y-${y})<1e-8`));}
await click("{avatar:'sage'}");run('save();state=null;loadGuest();');assert.equal(run('state.avatarId'),'sage');assert.equal(run('state.coins'),10000);
for(const v of ['dashboard','tasks','focus','study','cafe','rewards','stats','settings']){run(`view='${v}';render();`);assert.ok(nodes.get('#app').innerHTML.length>1000);}
assert.equal(run('esc("<script>bad</script>")'),'&lt;script&gt;bad&lt;/script&gt;');
run('state=demo();migrateCafe();state.classes.push("Biology");ensureDecks();');
await run('submit({preventDefault(){},target:{id:"deck-form",dataset:{id:""},querySelector:()=>null,data:{name:"Cells",subject:"Biology",due:"2026-10-12",terms:"Mitosis | Cell division\\nOsmosis\\tMovement of water"}}})');
assert.equal(run('state.decks.length'),1);assert.equal(run('reviewCards().length'),2);assert.equal(run('state.decks[0].due'),'2026-10-12');
run('advanceCard("good");');assert.equal(run('reviewCards()[0].interval'),1);const cardId=run('reviewCards()[0].id');
await run('submit({preventDefault(){},target:{id:"deck-form",dataset:{id:activeDeck},querySelector:()=>null,data:{name:"Cells updated",subject:"Biology",due:"2026-10-15",terms:"Mitosis | Cell division\\nMeiosis | Creates gametes"}}})');
assert.equal(run('state.decks.length'),1);assert.equal(run('reviewCards()[0].id'),cardId);assert.equal(run('reviewCards()[0].interval'),1);
await run('submit({preventDefault(){},target:{id:"deck-form",dataset:{id:""},querySelector:()=>null,data:{name:"Plants",subject:"Biology",due:"",terms:"Leaf | Photosynthesis"}}})');
assert.equal(run('state.decks.length'),2);assert.equal(run('reviewCards().length'),1);assert.ok(run('studyPage().includes("Cells updated")'));
assert.throws(()=>run('window.CoffeeStudyTools.parseTerms("Missing answer")'));assert.throws(()=>run('window.CoffeeStudyTools.parseTerms(" | Only answer")'));
assert.equal(run('window.CoffeeStudyTools.parseTerms(window.CoffeeStudyTools.serializeTerms([{q:"Question | with separator",a:"Answer\\nwith a line break and \\"quotes\\""}]))[0].a'),'Answer\nwith a line break and "quotes"');
const calendar=run('calendarMarkup(new Date(2026,9,1))');assert.equal((calendar.match(/calendar-blank/g)||[]).length,4);assert.ok(calendar.includes('Thursday, October 1, 2026'));assert.ok(calendar.includes('Sun</div>'));
const cleanBackup=run('window.CoffeeStudyTools.validateBackup(JSON.parse(JSON.stringify(state)),initial(),products.map(p=>p.id))');assert.equal(cleanBackup.decks.length,2);assert.equal(cleanBackup.cards.length,3);
assert.throws(()=>run('window.CoffeeStudyTools.validateBackup({cards:[]},initial(),products.map(p=>p.id))'));
assert.throws(()=>run('window.CoffeeStudyTools.validateBackup({...state,coins:-1},initial(),products.map(p=>p.id))'));
assert.throws(()=>run('window.CoffeeStudyTools.validateBackup({...state,decks:[{id:"bad\\\"id",name:"Test",subject:"General",due:""}]},initial(),products.map(p=>p.id))'));
run('const restored=window.CoffeeStudyTools.validateBackup(JSON.parse(JSON.stringify(state)),initial(),products.map(p=>p.id));state.coins=777;restoreProgress(restored);');assert.equal(run('state.coins'),10000);assert.equal(JSON.parse(storage.get('cram-coffee-before-restore')).coins,777);
run('cafeGuests=[{phase:"walking"},{phase:"seated"},{phase:"queued"},{phase:"checking"},{phase:"waiting"},{phase:"leaving"}]');assert.equal(run('visitorCounts().total'),6);assert.equal(run('visitorCounts().counter'),2);assert.ok(run('guestActivity().includes("6 visitors")'));
run('state=demo();timer.mode="focus";');
for(let i=1;i<=8;i++){
  run('timer.mode="focus";timer.total=60;timer.sessionId="cycle-'+i+'";finishSession();');
  assert.equal(run('timer.mode'),i%4===0?'long':'short');
  assert.equal(run('timer.seconds'),i%4===0?900:300);
  run('finishSession();');assert.equal(run('timer.mode'),'focus');
}
assert.equal(run('state.sessions.length'),8);assert.equal(run('cycleText().includes("Focus 1 of 4")'),true);
await click("{action:'skip'}");assert.equal(run('state.sessions.length'),8);
run('state.settings.ambientSound="keys";state.settings.soundVolume=.65;state.settings.endSound="chime";save();loadGuest();');
assert.equal(run('state.settings.ambientSound'),'keys');assert.equal(run('state.settings.soundVolume'),.65);
assert.equal(run('window.CoffeeStudyTools.validateBackup(state,initial(),products.map(p=>p.id)).settings.endSound'),'chime');
assert.throws(()=>run('window.CoffeeStudyTools.validateBackup({...state,settings:{...state.settings,soundVolume:2}},initial(),products.map(p=>p.id))'));
run('soundModal();');assert.ok(nodes.get('#modal').innerHTML.includes('Forest birds'));assert.ok(nodes.get('#modal').innerHTML.includes('Pause ambience')===false);
console.log('PASS: two complete four-session cycles choose long breaks after #4 and #8; skips do not count; sound preferences persist and restore.');
for(const id of run('window.CafeCharacters.profiles.map(p=>p.id)'))for(const theme of ['daytime','evening','spring','autumn','winter','greenhouse','coastal','celestial']){
  run(`state.avatarId=${JSON.stringify(id)};state.theme=${JSON.stringify(theme)};`);
  assert.equal(run('window.CoffeeStudyTools.validateBackup(state,initial(),products.map(p=>p.id)).avatarId'),id);
  assert.equal(run('window.CoffeeStudyTools.validateBackup(state,initial(),products.map(p=>p.id)).theme'),theme);
}
run('save();loadGuest();');assert.equal(run('state.avatarId'),'birch');assert.equal(run('state.theme'),'celestial');
run("state.xp=6000;");await click("{theme:'coastal'}");assert.equal(run('state.theme'),'coastal');
run('const artworkPainter=new window.CafePainter(fakeCanvas);artworkPainter.scale=.7;artworkPainter.ox=330;artworkPainter.oy=220;artworkPainter.floorSin=.5;');
for(let x=0;x<=512;x+=32)for(let y=0;y<=512;y+=32){const q=run(`artworkPainter.unproject(...Object.values(artworkPainter.project(${x},${y})))`);assert.ok(Math.abs(q.x-x)<1e-7&&Math.abs(q.y-y)<1e-7);}
run('state.coins=10000;');await click("{buy:'sofa'}");await click("{place:'sofa'}");assert.equal(run('state.placed.filter(p=>p.item==="sofa").length'),1);assert.equal(run('footprint(state.placed.find(p=>p.item==="sofa")).d'),2);
await click("{action:'rotate'}");assert.equal(run('state.placed.find(p=>p.item==="sofa").rotation'),90);assert.equal(run('footprint(state.placed.find(p=>p.item==="sofa")).w'),2);
console.log('PASS: all 14 characters and eight themes persist and restore; 289 artwork projection round trips; supplied sofa purchase, placement, and rotated footprint.');
console.log('PASS: separate decks by class; bulk terms; editing preserves review history; backup validation/restore/undo copy; weekday alignment; all guest phases counted.');
console.log('PASS: test balance/free starter items; multiple purchases; inventory/place/store; insufficient funds; timer reward deduplication; daily flashcard/quest rewards; bulk classes and filtering; seat arrivals; counter queue/avatar checkout with exactly-once payment; productivity-driven traffic; rotated footprints; 289 projection/inverse round trips; persistence; all screens.');

run('view="stats";calendarMonth=new Date(2026,0,1);');
await click("{action:'calendar-prev'}");assert.equal(run('calendarMonth.getFullYear()'),2025);assert.equal(run('calendarMonth.getMonth()'),11);assert.ok(run('statsPage()').includes('December 2025'));
await click("{action:'calendar-next'}");assert.equal(run('calendarMonth.getFullYear()'),2026);assert.equal(run('calendarMonth.getMonth()'),0);
run('calendarMonth=new Date(2024,1,1);state.sessions.push({date:"2024-02-29",subject:"Math",minutes:25});');
const leap=run('calendarMarkup()');assert.ok(leap.includes('Thursday, February 29, 2024'));assert.equal((leap.match(/calendar-blank/g)||[]).length,4);assert.ok(leap.includes('class="studied " title="Thursday, February 29'));
await click("{action:'calendar-next'}");assert.equal(run('calendarMonth.getDate()'),1);assert.equal(run('calendarMonth.getMonth()'),2);
await click("{action:'calendar-today'}");assert.equal(run('calendarMonth.getMonth()'),new Date().getMonth());assert.equal(run('calendarMonth.getFullYear()'),new Date().getFullYear());
console.log('PASS: calendar browses past/future months across years, preserves leap-day study history, and returns to today.');

run('state.tasks=[{id:"search-task",title:"Review cells",subject:"Biology",notes:"Mitochondria",minutes:20}];state.cards=[{q:"ATP",a:"Energy currency",subject:"Biology"}];');
assert.equal(run('searchMatches(" BIOLOGY ").tasks.length'),1);assert.equal(run('searchMatches("biology").cards.length'),1);assert.equal(run('searchMatches("mitochondria").tasks.length'),1);assert.equal(run('searchMatches("energy").cards.length'),1);assert.equal(run('searchMatches("unknown").tasks.length'),0);assert.equal(run('searchMatches("").cards.length'),0);
await run('submit({preventDefault(){},target:{id:"search-form",data:{query:"biology"}}});');assert.ok(nodes.get('#modal').innerHTML.includes('2 results'));assert.ok(nodes.get('#modal').innerHTML.includes('Review cells'));
run('showSearch("missing");');assert.ok(nodes.get('#modal').innerHTML.includes('No matching tasks.'));assert.ok(nodes.get('#modal').innerHTML.includes('0 results'));
run('showSearch("");');assert.ok(nodes.get('#toast').textContent.includes('Enter a word'));
console.log('PASS: search form submission, class/title/notes/question/answer matching, case/whitespace handling, and clear empty results.');


run('state=demo();migrateCafe();state.placed=state.placed.filter(p=>p.item!=="chair");cafeGuests=[];const staffNow=Date.now();spawnCafeGuest(staffNow);updateCafeGuests(staffNow+3000);');assert.equal(run('cafeGuests[0].phase'),'waiting');
run('state.placed.push({id:"checkout",item:"register",gx:1,gy:3,rotation:0});state.placed.push({id:"barista",item:"employee",gx:6,gy:6,rotation:0});updateCafeGuests(staffNow+4000);updateCafeGuests(staffNow+7000);');assert.equal(run('cafeGuests[0].phase'),'checking');assert.equal(run('ownerPosition().x'),run('state.avatarPosition.gx+1'));assert.equal(run('baristaPosition(state.placed.find(p=>p.id==="barista")).x'),run('counterPosition(-.8).x'));
run('updateCafeGuests(staffNow+13000);updateCafeGuests(staffNow+13500);');assert.equal(run('state.coins'),10005);assert.equal(run('cafeGuests[0].phase'),'leaving');
console.log('PASS: coffee counters never take checkout; guests use registers; placed barista serves while owner stays put; payment occurs exactly once.');

run('state=demo();migrateCafe();cafeGuests=[];for(let i=0;i<10;i++)spawnCafeGuest(Date.now());');assert.equal(run('cafeGuests.length'),10);assert.equal(run('spawnCafeGuest()'),false);console.log('PASS: demo café admits ten guests and stops at capacity.');

run('state=demo();migrateCafe();ready=true;timer.mode="focus";resetTimer();startTimer();');
for(let i=1;i<=8;i++){
 run('timer.deadline=Date.now()-1;tickTimer();');assert.equal(run('timer.running'),true);assert.equal(run('timer.mode'),i%4===0?'long':'short');assert.equal(run('timer.seconds'),run('state.settings[timer.mode]*60'));assert.equal(run('state.sessions.length'),i);
 run('timer.deadline=Date.now()-1;tickTimer();');assert.equal(run('timer.running'),true);assert.equal(run('timer.mode'),'focus');assert.equal(run('timer.seconds'),run('state.settings.focus*60'));
}
await click("{action:'timer'}");assert.equal(run('timer.running'),false);run('timer.deadline=Date.now()-1;tickTimer();');assert.equal(run('state.sessions.length'),8);
await click("{action:'timer'}");assert.equal(run('timer.running'),true);await click("{action:'skip'}");assert.equal(run('timer.running'),true);assert.equal(run('state.sessions.length'),8);await click("{action:'reset-timer'}");assert.equal(run('timer.running'),false);
console.log('PASS: started Pomodoro automatically runs all focus, short break, and long break phases; pause stops progression; resume and running skips continue; reset stops the timer.');

run('state=demo();migrateCafe();ready=true;timer.mode="focus";resetTimer();startTimer();');for(let i=0;i<2;i++){run('timer.deadline=Date.now()-1;tickTimer();timer.deadline=Date.now()-1;tickTimer();');}assert.equal(run('pomodoroCount()'),2);
const preserved=run('JSON.stringify({sessions:state.sessions,coins:state.coins,xp:state.xp})');await click("{action:'reset-pomodoro'}");assert.equal(run('timer.running'),false);assert.equal(run('timer.mode'),'focus');assert.equal(run('pomodoroCount()'),0);assert.equal(run('timer.seconds'),run('state.settings.focus*60'));assert.equal(run('JSON.stringify({sessions:state.sessions,coins:state.coins,xp:state.xp})'),preserved);assert.ok(run('timerMarkup()').includes('Reset Pomodoro'));assert.ok(run('cycleText()').includes('Focus 1 of 4'));
run('startTimer();');for(let i=1;i<=4;i++){run('timer.deadline=Date.now()-1;tickTimer();');assert.equal(run('timer.mode'),i===4?'long':'short');if(i<4)run('timer.deadline=Date.now()-1;tickTimer();');}assert.equal(run('state.sessions.length'),6);await click("{action:'reset-pomodoro'}");assert.equal(run('timer.mode'),'focus');assert.equal(run('timer.running'),false);assert.equal(run('pomodoroCount()'),0);
console.log('PASS: full Pomodoro reset stops the timer, restores focus 1 of 4, preserves history/rewards, and starts a new four-session cycle independently of lifetime sessions.');

run('guestBag=[];');for(let round=0;round<3;round++){const visits=run('Array.from({length:14},()=>nextGuestAvatar())');assert.equal(new Set(visits).size,14);assert.ok(visits.includes('willow'));assert.ok(visits.includes('birch'));}
run('chooseAvatar();');for(const profile of context.window.CafeCharacters.profiles)assert.ok(nodes.get('#modal').innerHTML.includes('<b>'+profile.name+'</b>'));assert.ok(!nodes.get('#modal').innerHTML.includes('matching standing'));
console.log('PASS: shuffled arrivals include all 14 guests before repeating, including both blonde characters; avatar picker displays names below portraits.');

run('state=demo();migrateCafe();cafeGuests=[];const myChair=state.placed.find(p=>p.item==="chair");seatMenu(myChair.id);');assert.ok(nodes.get('#modal').innerHTML.includes('Sit here'));await click("{action:'sit-chair',chair:myChair.id}");assert.equal(run('state.avatarSeatId'),run('myChair.id'));assert.equal(run('ownerPosition().seated'),true);assert.equal(run('availableCafeSeats().some(p=>p.id===myChair.id)'),false);run('spawnCafeGuest();');assert.equal(run('cafeGuests.some(g=>g.chairId===myChair.id)'),false);
run('seatMenu(myChair.id);');assert.ok(nodes.get('#modal').innerHTML.includes('Stand up'));await click("{action:'stand-up'}");assert.equal(run('state.avatarSeatId'),null);assert.equal(run('availableCafeSeats().some(p=>p.id===myChair.id)'),true);
run('cafeGuests=[{id:"reserved",chairId:myChair.id,phase:"walking"}];sitInChair(myChair.id);');assert.equal(run('state.avatarSeatId'),null);run('seatMenu(myChair.id);');assert.ok(nodes.get('#modal').innerHTML.includes('occupied or reserved'));
run('cafeGuests=[];sitInChair(myChair.id);state.placed=state.placed.filter(p=>p.id!==myChair.id);');assert.equal(run('ownerPosition().seated'),undefined);assert.equal(run('state.avatarSeatId'),null);
console.log('PASS: chair sit/stand menu, seated owner pose, owner reservation excludes guest arrivals, guest reservations prevent owner seating, removed chairs clear owner seating.');

run('state=demo();migrateCafe();shopArea="shop";shopFilter="All";');const shopHtml=run('cafePage()');for(const id of ['machine','cups','tray'])assert.ok(!shopHtml.includes('data-buy="'+id+'"'));
run('const shopBalance=state.coins;buyCafeItem("machine");buyCafeItem("cups");buyCafeItem("tray");');assert.equal(run('state.coins'),run('shopBalance'));
run('state.owned.push("machine");state.inventory.machine=1;migrateCafe();shopArea="inventory";');assert.ok(run('cafePage()').includes('data-place="machine"'));assert.ok(!run('cafePage()').includes('data-buy="machine"'));
console.log('PASS: espresso machine, takeaway cups, pastry tray cannot be bought; existing owned copies remain available to place.');

run('state=demo();migrateCafe();state.classes=["General","Biology"];activeDeck=null;view="study";');
const emptyLibrary=run('studyPage()');assert.ok(emptyLibrary.indexOf('class-manager')<emptyLibrary.indexOf('Pick a set'));assert.ok(emptyLibrary.includes('data-edit-class="Biology"'));assert.ok(emptyLibrary.includes('data-remove-class="Biology"'));
for(const name of ['Cells','Plants'])await run(`submit({preventDefault(){},target:{id:"deck-form",dataset:{id:""},querySelector:()=>null,data:{name:"${name}",subject:"Biology",due:"",terms:"Term | Definition"}}})`);
run('advanceCard("good");state.tasks=parseBulkTasks("Study Biology", "Biology");');const archivedCardId=run('reviewCards()[0].id');
await run('submit({preventDefault(){},target:{id:"edit-class-form",dataset:{class:"Biology"},data:{name:"Life Science"}}})');assert.equal(run('state.decks.every(d=>d.subject==="Life Science")'),true);assert.equal(run('state.cards.every(c=>c.subject==="Life Science")'),true);assert.equal(run('state.tasks[0].subject'),'Life Science');assert.equal(run('reviewCards()[0].id'),archivedCardId);assert.equal(run('reviewCards()[0].interval'),1);
run('renameClass("Life Science","General");');assert.equal(run('state.classes.includes("Life Science")'),true);
const archiveCards=run('JSON.stringify(state.cards)');await click("{removeClass:'Life Science'}");assert.equal(run('state.decks.every(d=>d.archived)'),true);assert.equal(run('JSON.stringify(state.cards)'),archiveCards);assert.equal(run('ensureClasses().includes("Life Science")'),false);assert.equal(run('ensureClasses().includes("Life Science")'),false);assert.ok(run('studyPage()').includes('<h2>Archive'));assert.equal(run('reviewCards().length'),1);
run('deckModal(true);');assert.ok(nodes.get('#modal').innerHTML.includes('value="__archive__" selected'));
await run('submit({preventDefault(){},target:{id:"deck-form",dataset:{id:activeDeck},querySelector:()=>null,data:{name:"Plants edited",subject:"__archive__",due:"",terms:"Term | Definition"}}})');assert.equal(run('state.decks.find(d=>d.id===activeDeck).archived'),true);assert.equal(run('reviewCards()[0].id'),archivedCardId);assert.equal(run('reviewCards()[0].interval'),1);
run('state=window.CoffeeStudyTools.validateBackup(JSON.parse(JSON.stringify(state)),initial(),products.map(p=>p.id));ensureDecks();');assert.equal(run('state.decks.every(d=>d.archived)'),true);assert.equal(run('ensureClasses().includes("Life Science")'),false);assert.equal(run('JSON.stringify(state.cards)'),archiveCards);
await run('submit({preventDefault(){},target:{id:"class-form",data:{name:"Life Science"}}})');assert.equal(run('ensureClasses().includes("Life Science")'),true);assert.equal(run('state.decks.every(d=>d.archived)'),true);
await run('submit({preventDefault(){},target:{id:"deck-form",dataset:{id:activeDeck},querySelector:()=>null,data:{name:"Plants restored",subject:"Life Science",due:"",terms:"Term | Definition"}}})');assert.equal(run('state.decks.find(d=>d.id===activeDeck).archived'),false);assert.equal(run('state.decks.filter(d=>d.archived).length'),1);assert.equal(run('reviewCards()[0].interval'),1);
console.log('PASS: class list above set preview, rename updates classes/decks/cards/tasks, duplicate names rejected, removal archives every set without changing cards, archives remain studyable/editable, backups retain archives, readding does not unarchive, reassignment restores a set with review history.');

run('state=demo();migrateCafe();shopArea="shop";shopFilter="All";');
assert.equal(run('level()'),1);assert.equal(run('themeUnlocked("spring")'),true);assert.equal(run('themeUnlocked("daytime")'),true);assert.equal(run('themeUnlocked("celestial")'),false);assert.equal(run('itemUnlocked("employee")'),false);
const lockedBalance=run('state.coins');await click("{buy:'employee'}");assert.equal(run('state.coins'),lockedBalance);assert.equal(run('state.owned.includes("employee")'),false);await click("{theme:'celestial'}");assert.equal(run('state.theme'),'spring');
run('themePicker();');assert.ok(nodes.get('#modal').innerHTML.includes('data-theme="celestial" disabled'));assert.ok(nodes.get('#modal').innerHTML.includes('Level 7 · 6,000 XP'));assert.ok(run('cafePage()').includes('data-buy="employee" disabled'));
for(const [id,required] of Object.entries(run('furnitureLevels'))){run(`state.xp=${(required-1)*1000-1};`);assert.equal(run(`itemUnlocked("${id}")`),false);run('reward(1,0);');assert.equal(run(`itemUnlocked("${id}")`),true);}
for(const [id,required] of Object.entries(run('themeLevels'))){if(required===1)continue;run(`state=demo();migrateCafe();state.xp=${(required-1)*1000-1};`);assert.equal(run(`themeUnlocked("${id}")`),false);run('reward(1,0);');assert.equal(run(`themeUnlocked("${id}")`),true);assert.equal(run(`state.unlockedThemes.includes("${id}")`),true);}
run('state=demo();migrateCafe();state.xp=2999;reward(1,0);');await click("{buy:'employee'}");assert.equal(run('state.coins'),9300);assert.equal(run('state.inventory.employee'),1);
await click("{theme:'coastal'}");assert.equal(run('state.theme'),'coastal');run('save();loadGuest();');assert.equal(run('itemUnlocked("employee")'),true);assert.equal(run('themeUnlocked("coastal")'),true);
run('state=window.CoffeeStudyTools.validateBackup(JSON.parse(JSON.stringify(state)),initial(),products.map(p=>p.id));migrateCafe();');assert.equal(run('state.theme'),'coastal');assert.equal(run('state.unlockedThemes.includes("coastal")'),true);assert.equal(run('state.inventory.employee'),1);
run('state=demo();state.theme="celestial";delete state.unlockedThemes;state.owned.push("sofa");state.inventory={sofa:1};migrateCafe();');assert.equal(run('themeUnlocked("celestial")'),true);assert.equal(run('itemUnlocked("sofa")'),false);assert.ok(run('cafePage()').includes('data-buy="sofa" disabled'));await click("{place:'sofa'}");assert.equal(run('state.placed.some(p=>p.item==="sofa")'),true);await click("{theme:'daytime'}");await click("{theme:'celestial'}");assert.equal(run('state.theme'),'celestial');
const studyToolbar=run('studyPage()').split('<div class="toolbar">')[1].split('<div class="study-layout">')[0];assert.ok(studyToolbar.includes('Create study set'));assert.ok(!studyToolbar.includes('data-action="add-class"'));assert.ok(run('classManager()').includes('data-action="add-class"'));run('deckModal();');assert.ok(nodes.get('#modal').innerHTML.includes('Create study set'));assert.ok(run('rewardsPage()').includes('Grow your café with XP'));assert.ok(run('rewardsPage()').includes('Café barista'));
console.log('PASS: XP threshold boundaries for all theme/furniture/barista unlocks, direct locked purchase/theme prevention, requirements in UI, coins charged only after barista unlock, persistence/backup, existing theme and furniture retained, create study set naming and class button placement.');

run('state=demo();migrateCafe();shopArea="shop";shopFilter="All";');assert.ok(!run('cafePage()').includes('data-buy="desk-lamp"'));const lampBalance=run('state.coins');await click("{buy:'desk-lamp'}");assert.equal(run('state.coins'),lampBalance);assert.equal(run('state.owned.includes("desk-lamp")'),false);run('state.owned.push("desk-lamp");state.inventory["desk-lamp"]=1;shopArea="inventory";');assert.ok(run('cafePage()').includes('data-place="desk-lamp"'));assert.ok(!run('cafePage()').includes('data-buy="desk-lamp"'));
console.log('PASS: reading lamp removed from shop and direct purchases blocked; already owned lamps remain placeable.');

run('state=demo();state.xp=995;state.sessions=[{date:today(),minutes:30,subject:"General"},{date:today(),minutes:30,subject:"General"}];save();');assert.equal(run('state.xp'),1000);assert.equal(run('state.plantCare.stage'),1);assert.equal(run('level()'),2);assert.equal(run('themeUnlocked("evening")'),true);assert.equal(run('state.plantCare.reward'),5);assert.ok(run('plantMarkup()').includes('Care level 1 / 4'));assert.ok(run('plantMarkup()').includes('plant-stage-1.png'));assert.ok(run('plantMarkup()').includes('60 / 60 study minutes'));
const plantEarned=run('state.xp');run('save();render();save();');assert.equal(run('state.xp'),plantEarned);run('state=window.CoffeeStudyTools.validateBackup(JSON.parse(JSON.stringify(state)),initial(),products.map(p=>p.id));save();');assert.equal(run('state.xp'),plantEarned);assert.equal(run('state.plantCare.stage'),1);assert.equal(run('state.plantCare.completed'),true);run('loadGuest();');assert.equal(run('state.xp'),plantEarned);assert.equal(run('state.plantCare.stage'),1);
assert.throws(()=>run('window.CoffeeStudyTools.validateBackup({...state,plantCare:{...state.plantCare,stage:5}},initial(),products.map(p=>p.id))'));assert.throws(()=>run('window.CoffeeStudyTools.validateBackup({...state,plantCare:{...state.plantCare,lastDate:"2026-02-30"}},initial(),products.map(p=>p.id))'));assert.throws(()=>run('window.CoffeeStudyTools.validateBackup({...state,plantCare:{...state.plantCare,reward:15,completed:false}},initial(),products.map(p=>p.id))'));
run('state=demo();state.sessions=[{date:today(),minutes:40,subject:"General"}];save();');assert.equal(run('state.plantCare.stage'),0);await run('submit({preventDefault(){},target:{id:"settings-form",data:{name:"Tester",avatarId:"maple",daily:"40",weekly:"300"}}})');assert.equal(run('state.plantCare.stage'),1);assert.equal(run('state.plantCare.goal'),40);assert.equal(run('state.xp'),5);await run('submit({preventDefault(){},target:{id:"settings-form",data:{name:"Tester",avatarId:"maple",daily:"60",weekly:"300"}}})');assert.equal(run('state.xp'),5);assert.equal(run('state.plantCare.stage'),1);
run('state=demo();state.settings.daily=1;timer.mode="focus";timer.total=60;timer.sessionId="plant-session";finishSession(false);');assert.equal(run('state.xp'),55);assert.equal(run('state.plantCare.stage'),1);assert.equal(run('state.plantCare.completed'),true);run('timer.mode="focus";timer.total=60;timer.sessionId="plant-session";finishSession(false);');assert.equal(run('state.xp'),55);
run('state=demo();state.plantCare.stage=4;state.settings.daily=1;timer.mode="focus";timer.total=60;timer.sessionId="mature-plant-session";finishSession(false);');assert.equal(run('state.xp'),65);assert.equal(run('state.plantCare.reward'),15);assert.ok(run('plantMarkup()').includes('src="assets/plant.png"'));
console.log('PASS: plant care is separate from account level, daily study sessions trigger growth and XP unlocks, repeated render/save/load/backup do not repeat rewards, goal changes update care once, actual Pomodoro awards 5/15 plant XP, malformed care backups rejected.');

run('state=demo();migrateCafe();state.avatarId="fern";');const simpleSettings=run('settingsPage()');assert.ok(!simpleSettings.includes('name="avatarId"'));assert.ok(!simpleSettings.includes('name="dark"'));assert.ok(simpleSettings.includes('name="timeZone"'));
await run('submit({preventDefault(){},target:{id:"settings-form",data:{name:"Clock tester",daily:"60",weekly:"300",timeZone:"Asia/Tokyo"}}})');assert.equal(run('state.avatarId'),'fern');assert.equal(run('state.settings.timeZone'),'Asia/Tokyo');assert.equal(run('state.settings.dark'),false);assert.ok(run('headerDateTime()').includes('data-header-clock'));assert.ok(run('headerDateTime()').includes('title="Asia/Tokyo"'));run('view="dashboard";render();');assert.ok(nodes.get('#app').innerHTML.includes('data-header-date'));assert.ok(nodes.get('#app').innerHTML.includes('data-header-clock'));
run('save();loadGuest();');assert.equal(run('state.settings.timeZone'),'Asia/Tokyo');run('state=window.CoffeeStudyTools.validateBackup(JSON.parse(JSON.stringify(state)),initial(),products.map(p=>p.id));');assert.equal(run('state.settings.timeZone'),'Asia/Tokyo');assert.throws(()=>run('window.CoffeeStudyTools.validateBackup({...state,settings:{...state.settings,timeZone:"Invalid/Zone"}},initial(),products.map(p=>p.id))'));
const liveDate=node(),liveTime=node(),oldQueries=context.document.querySelectorAll;context.document.querySelectorAll=s=>s==='[data-header-date]'?[liveDate]:s==='[data-header-clock]'?[liveTime]:[];run('updateHeaderClock();');assert.ok(liveDate.textContent.length>0);assert.match(liveTime.textContent,/JST|GMT\+9/);assert.equal(liveTime.title,'Asia/Tokyo');assert.ok(!Number.isNaN(Date.parse(liveTime.dateTime)));run('state.settings.timeZone="UTC";updateHeaderClock();');assert.equal(liveTime.title,'UTC');assert.ok(liveTime.textContent.includes('UTC'));context.document.querySelectorAll=oldQueries;
const settingsBefore=run('JSON.stringify(state.settings)');await run('submit({preventDefault(){},target:{id:"settings-form",data:{name:"Invalid test",daily:"60",weekly:"300",timeZone:"Invalid/Zone"}}})');assert.equal(run('JSON.stringify(state.settings)'),settingsBefore);assert.equal(run('state.avatarId'),'fern');
console.log('PASS: Settings removes avatar dropdown/evening checkbox, preserves chosen avatar, saves valid time zone, header date/clock render and update in selected zone, persists/restores preferences, rejects invalid zone.');

run('state=demo();migrateCafe();view="cafe";render();');const cafeProfileHeader=nodes.get('#app').innerHTML.split('<div class="cafe-account">')[1].split('</header>')[0];assert.ok(cafeProfileHeader.includes('data-view="settings"'));assert.ok(!cafeProfileHeader.includes('data-action="choose-avatar"'));await click("{view:'settings'}");assert.equal(run('view'),'settings');assert.ok(nodes.get('#app').innerHTML.includes('id="settings-form"'));assert.ok(nodes.get('#app').innerHTML.includes('aria-label="Profile settings"'));
console.log('PASS: café top-right profile routes to Settings and the shared profile button keeps the same navigation.');

run('modal.close();state=demo();migrateCafe();view="study";state.classes=["General"];state.decks=[{id:"full-set",subject:"General",name:"Fullscreen set",due:""},{id:"other-set",subject:"General",name:"Other set",due:""}];state.cards=Array.from({length:8},(_,i)=>({id:"full-card-"+i,deckId:i<6?"full-set":"other-set",subject:"General",q:"Question "+i,a:"Answer "+i,due:today(),interval:i}));activeDeck="full-set";reviewIndex=2;flipped=false;quiz=false;render();');assert.ok(nodes.get('#app').innerHTML.includes('Full screen'));const fullscreenSet=run('activeDeck');await click("{action:'flashcard-fullscreen'}");assert.equal(run('flashcardFullscreen'),true);assert.ok(nodes.get('#app').innerHTML.includes('class="flashcard-fullscreen"'));assert.ok(!nodes.get('#app').innerHTML.includes('class="sidebar"'));assert.ok(nodes.get('#app').innerHTML.includes('Question 2'));await click("{action:'flip-card'}");assert.ok(nodes.get('#app').innerHTML.includes('Answer 2'));await click("{action:'next-card'}");assert.equal(run('reviewIndex'),3);await click("{action:'quiz-mode'}");assert.ok(nodes.get('#app').innerHTML.includes('id="quiz-answer"'));
const shuffleBefore=run('reviewCards().map(c=>c.id).join(",")'),otherBefore=run('JSON.stringify(state.cards.filter(c=>c.deckId==="other-set"))'),cardHistory=run('JSON.stringify(state.cards.slice().sort((a,b)=>a.id.localeCompare(b.id)))');await click("{action:'random-card'}");assert.notEqual(run('reviewCards().map(c=>c.id).join(",")'),shuffleBefore);assert.equal(run('reviewCards().length'),6);assert.equal(run('new Set(reviewCards().map(c=>c.id)).size'),6);assert.equal(run('JSON.stringify(state.cards.filter(c=>c.deckId==="other-set"))'),otherBefore);assert.equal(run('JSON.stringify(state.cards.slice().sort((a,b)=>a.id.localeCompare(b.id)))'),cardHistory);assert.equal(run('reviewIndex'),0);assert.equal(run('flipped'),false);assert.equal(run('flashcardFullscreen'),true);const shuffled=run('reviewCards().map(c=>c.id).join(",")');await click("{action:'next-card'}");assert.equal(run('reviewIndex'),1);await click("{action:'flashcard-fullscreen'}");assert.equal(run('flashcardFullscreen'),false);assert.equal(run('activeDeck'),fullscreenSet);assert.equal(run('reviewIndex'),1);assert.ok(nodes.get('#app').innerHTML.includes('class="sidebar"'));assert.equal(run('reviewCards().map(c=>c.id).join(",")'),shuffled);
await click("{action:'flashcard-fullscreen'}");await documentEvents.get('keydown')({key:'Escape',preventDefault(){}});assert.equal(run('flashcardFullscreen'),false);
context.document.documentElement={async requestFullscreen(){context.document.fullscreenElement=this;}};context.document.exitFullscreen=async()=>{context.document.fullscreenElement=null;};await click("{action:'flashcard-fullscreen'}");assert.equal(run('nativeFlashcardFullscreen'),true);assert.equal(context.document.fullscreenElement,context.document.documentElement);context.document.fullscreenElement=null;documentEvents.get('fullscreenchange')();assert.equal(run('flashcardFullscreen'),false);assert.equal(run('nativeFlashcardFullscreen'),false);
context.document.documentElement.requestFullscreen=async()=>{throw Error('Fullscreen blocked');};await click("{action:'flashcard-fullscreen'}");assert.equal(run('flashcardFullscreen'),true);assert.equal(run('nativeFlashcardFullscreen'),false);await click("{action:'flashcard-fullscreen'}");assert.equal(run('flashcardFullscreen'),false);delete context.document.documentElement;delete context.document.exitFullscreen;
run('state.cards=state.cards.filter(c=>c.deckId!==activeDeck||c.id===reviewCards()[0].id);');await click("{action:'random-card'}");assert.equal(run('reviewCards().length'),1);assert.equal(run('reviewIndex'),0);
console.log('PASS: full-screen review/quiz/flip/next controls preserve set and position on exit, Escape and native fullscreen exits restore library, denied browser fullscreen falls back to window viewer; Shuffle reorders the entire selected set without changing other sets or review history.');

// Notebook lifecycle, typography, persistence and safe backup round trips.
run('flashcardFullscreen=false;state=demo();guest=true;ready=true;view="notebooks";activeNotebook=null;render()');
assert.ok(nodes.get('#app').innerHTML.includes('A fresh page awaits'));
await run('submit({preventDefault(){},target:{id:"notebook-form",dataset:{id:""},data:{title:"Biology notes"}}})');
const biologyId=run('activeNotebook');assert.equal(run('state.notebooks.length'),1);
run('notebookInput({dataset:{notebookText:currentNotebookPage().blocks[0].id},value:"Cell structure\\nReview mitochondria"})');
assert.equal(JSON.parse(storage.get('cram-coffee-guest')).notebooks[0].pages[0].blocks[0].text,'Cell structure\nReview mitochondria');
await click('{action:"notebook-add-block",type:"heading"}');
assert.equal(run('currentNotebookPage().blocks[1].size'),28);
run('notebookInput({dataset:{notebookText:currentNotebookPage().blocks[1].id},value:"Chapter one"});notebookStyleChange({dataset:{notebookBlock:currentNotebookPage().blocks[1].id,notebookStyle:"font"},value:"mono"});notebookStyleChange({dataset:{notebookBlock:currentNotebookPage().blocks[1].id,notebookStyle:"size"},value:"32"});notebookStyleChange({dataset:{notebookTitleStyle:"true",notebookStyle:"font"},value:"hand"})');
assert.equal(run('currentNotebookPage().blocks[1].font'),'mono');assert.equal(run('currentNotebookPage().blocks[1].size'),32);assert.equal(run('currentNotebook().titleFont'),'hand');
assert.ok(nodes.get('#app').innerHTML.includes('32px'));
await run('submit({preventDefault(){},target:{id:"notebook-form",dataset:{id:""},data:{title:"Ideas"}}})');
assert.equal(run('state.notebooks.length'),2);assert.equal(run('currentNotebook().title'),'Ideas');
await click(JSON.stringify({notebook:biologyId}));assert.equal(run('currentNotebookPage().blocks[0].text'),'Cell structure\nReview mitochondria');
await run('submit({preventDefault(){},target:{id:"notebook-form",dataset:{id:activeNotebook},data:{title:"Biology journal"}}})');
assert.equal(run('currentNotebook().title'),'Biology journal');assert.equal(run('currentNotebookPage().blocks[1].font'),'mono');
run('notebookInput({dataset:{notebookText:currentNotebookPage().blocks[0].id},value:"<script>alert(1)</script>"});render()');
assert.ok(!nodes.get('#app').innerHTML.includes('<script>alert(1)</script>'));assert.ok(nodes.get('#app').innerHTML.includes('&lt;script&gt;'));
const notesBackup=run('window.CoffeeStudyTools.validateBackup(JSON.parse(JSON.stringify(state)),initial(),products.map(p=>p.id))');
assert.equal(notesBackup.notebooks.length,2);assert.equal(notesBackup.notebooks[0].title,'Ideas');assert.equal(notesBackup.notebooks[1].pages[0].blocks[1].size,32);
run('loadGuest();view="notebooks";render()');assert.equal(run('state.notebooks.length'),2);
await click('{action:"delete-notebook"}');assert.equal(run('state.notebooks.length'),2);assert.ok(nodes.get('#modal').innerHTML.includes('Delete notebook?'));
await click(JSON.stringify({action:'confirm-delete-notebook',notebookId:biologyId}));assert.equal(run('state.notebooks.length'),1);
context.notebookRestore=notesBackup;run('restoreProgress(notebookRestore);view="notebooks";render()');assert.equal(run('state.notebooks.length'),2);
await click(JSON.stringify({notebook:biologyId}));assert.equal(run('currentNotebook().title'),'Biology journal');
run('const oldNotebookBackup=structuredClone(state);delete oldNotebookBackup.notebooks;globalThis.oldNotebookResult=window.CoffeeStudyTools.validateBackup(oldNotebookBackup,initial(),products.map(p=>p.id))');assert.equal(run('oldNotebookResult.notebooks.length'),0);
assert.throws(()=>run('const badNotes=structuredClone(state);badNotes.notebooks[0].pages[0].blocks[0].font="serif; background:url(evil)";window.CoffeeStudyTools.validateBackup(badNotes,initial(),products.map(p=>p.id))'),/notebook section/);
assert.throws(()=>run('const repeatedNotes=structuredClone(state);repeatedNotes.notebooks.push(repeatedNotes.notebooks[0]);window.CoffeeStudyTools.validateBackup(repeatedNotes,initial(),products.map(p=>p.id))'),/invalid notebook/);
run('guest=false;user={uid:"notes-user"};globalThis.savedNotes=[];cloud={db:{},doc:()=>({}),setDoc:async(_ref,data)=>savedNotes.push(data.data)};notebookInput({dataset:{notebookText:currentNotebookPage().blocks[0].id},value:"Cloud notebook update"})');
await click('{view:"dashboard"}');await run('saveQueue');assert.equal(run('savedNotes.at(-1).notebooks.find(n=>n.id===activeNotebook).pages[0].blocks[0].text'),'Cloud notebook update');
console.log('PASS: multiple notebooks, named sections, font and size controls, autosave locally and to cloud, navigation flush, rename, delete confirmation, reload, backup restore, older backups, and safe rendering/validation.');
// Paged notebooks, nested folders, inline emphasis, exports, migration, and note search.
run('state=demo();guest=true;user=null;cloud=null;ready=true;view="notebooks";activeNotebook=null;activeNotebookPage=null;notebookFolder="all";render()');
await run('submit({preventDefault(){},target:{id:"notebook-folder-form",dataset:{id:""},data:{name:"Semester 1",parentId:""}}})');
const semesterFolder=run('notebookFolder');
await run('submit({preventDefault(){},target:{id:"notebook-folder-form",dataset:{id:""},data:{name:"Biology",parentId:notebookFolder}}})');
const subjectFolder=run('notebookFolder');assert.equal(run('state.notebookFolders[1].parentId'),semesterFolder);
await run('submit({preventDefault(){},target:{id:"notebook-form",dataset:{id:""},data:{title:"Lecture notebook",color:"#62849b",folderId:notebookFolder}}})');
const lectureId=run('activeNotebook'),firstPage=run('activeNotebookPage');assert.equal(run('currentNotebook().folderId'),subjectFolder);assert.equal(run('currentNotebook().color'),'#62849b');
run('notebookInput({dataset:{notebookText:currentNotebookPage().blocks[0].id},value:"The first lecture"})');
await run('submit({preventDefault(){},target:{id:"notebook-page-form",dataset:{id:""},data:{title:"Microscopy"}}})');
const microscopyPage=run('activeNotebookPage');assert.notEqual(microscopyPage,firstPage);assert.equal(run('currentNotebook().pages.length'),2);
run('notebookInput({dataset:{notebookText:currentNotebookPage().blocks[0].id},value:"Microscopy reveals cell detail."})');
assert.equal(run('currentNotebook().pages[0].blocks[0].text'),'The first lecture');
assert.ok(nodes.get('#app').innerHTML.includes('Open page 1: Page 1'));assert.ok(nodes.get('#app').innerHTML.includes('Open page 2: Microscopy'));
await click(JSON.stringify({notebookPage:firstPage}));assert.equal(run('currentNotebookPage().blocks[0].text'),'The first lecture');
await click(JSON.stringify({notebookPage:microscopyPage}));await click('{action:"notebook-move-page",direction:"up"}');assert.equal(run('currentNotebook().pages[0].id'),microscopyPage);
context.semesterFolder=semesterFolder;context.subjectFolder=subjectFolder;
await run('submit({preventDefault(){},target:{id:"notebook-folder-form",dataset:{id:semesterFolder},data:{name:"Semester 1",parentId:subjectFolder}}})');assert.equal(run('state.notebookFolders[0].parentId'),null);
const textNode=text=>({nodeType:3,nodeValue:text}),element=(tag,children,style={})=>({nodeType:1,tagName:tag,childNodes:children,style});
context.richTest=element('DIV',[textNode('Study '),element('STRONG',[textNode('cells')]),textNode(' with '),element('EM',[element('U',[textNode('care')])]),element('DIV',[textNode('Tomorrow')])]);
const parsed=run('notebookTools.readEditor(richTest)');assert.equal(parsed.map(r=>r.text).join(''),'Study cells with care\nTomorrow');assert.equal(parsed.find(r=>r.text==='cells').bold,true);assert.equal(parsed.find(r=>r.text==='care').italic,true);assert.equal(parsed.find(r=>r.text==='care').underline,true);
run('richTest.dataset={notebookRich:currentNotebookPage().blocks[0].id};notebookInput(richTest)');
assert.equal(JSON.parse(storage.get('cram-coffee-guest')).notebooks[0].pages[0].blocks[0].runs.find(r=>r.text==='cells').bold,true);
run('render()');assert.ok(nodes.get('#app').innerHTML.includes('<strong>cells</strong>'));assert.ok(nodes.get('#app').innerHTML.includes('<em><u>care</u></em>'));
run('showSearch("CELLS")');assert.ok(nodes.get('#modal').innerHTML.includes('data-notebook-result'));assert.equal(run('searchMatches("CELLS").notes[0].pageId'),microscopyPage);
await click(JSON.stringify({notebookResult:lectureId,page:microscopyPage}));assert.equal(run('view'),'notebooks');assert.equal(run('activeNotebookPage'),microscopyPage);assert.equal(nodes.get('#modal').open,false);
run('state.scratch="Notebook search also finds quick reminders";showSearch("quick reminders")');assert.ok(nodes.get('#modal').innerHTML.includes('open-scratch-notes'));
const notebookFullBackup=run('window.CoffeeStudyTools.validateBackup(structuredClone(state),initial(),products.map(p=>p.id))');assert.equal(notebookFullBackup.notebookFolders.length,2);assert.equal(notebookFullBackup.notebooks[0].pages[0].blocks[0].runs.find(r=>r.text==='care').underline,true);
context.notebookFullBackup=notebookFullBackup;run('restoreProgress(notebookFullBackup);view="notebooks";render()');assert.equal(run('currentNotebook().pages.length'),2);
run('downloadNotebookFile=(...args)=>{globalThis.notebookDownload=args};exportNotebook("json")');const editableNotebook=JSON.parse(run('notebookDownload[2]'));assert.equal(editableNotebook.format,'cram-coffee-notebook');assert.equal(editableNotebook.notebook.folderId,null);assert.equal(editableNotebook.notebook.pages.length,2);assert.ok(run('notebookDownload[0]').endsWith('.json'));
run('exportNotebook("html")');const htmlNotebook=run('notebookDownload[2]');assert.ok(htmlNotebook.includes('<strong>cells</strong>'));assert.ok(htmlNotebook.includes('<em><u>care</u></em>'));assert.ok(htmlNotebook.includes('break-after:page'));assert.ok(htmlNotebook.includes('#62849b'));assert.ok(htmlNotebook.includes('Microscopy'));
context.importableNotebook=JSON.stringify(editableNotebook);await run('importNotebook({size:importableNotebook.length,text:async()=>importableNotebook})');assert.equal(run('state.notebooks.length'),2);assert.notEqual(run('activeNotebook'),lectureId);assert.equal(run('currentNotebook().pages.length'),2);
run('globalThis.legacyNotebook={id:"legacy-note",title:"Old notes",titleFont:"serif",titleSize:36,updatedAt:new Date().toISOString(),blocks:[{id:"legacy-section",type:"body",text:"Existing notes stay safe.",font:"sans",size:16}]}');
const oldMigrated=run('notebookTools.validate([legacyNotebook])');assert.equal(oldMigrated[0].pages[0].blocks[0].text,'Existing notes stay safe.');assert.equal(oldMigrated[0].color,'#647f58');assert.equal(run('legacyNotebook.pages'),undefined);
run('state.notebooks.push(structuredClone(legacyNotebook));notebookTools.migrate(state)');assert.equal(run('state.notebooks.at(-1).pages[0].blocks[0].text'),'Existing notes stay safe.');assert.equal(run('state.notebooks.at(-1).blocks'),undefined);
assert.throws(()=>run('notebookTools.validateFolders([{id:"a",name:"A",parentId:"b"},{id:"b",name:"B",parentId:"a"}])'),/cycle/);
assert.throws(()=>run('notebookTools.validateFolders([{id:"a",name:"A",parentId:"missing"}])'),/missing parent/);
assert.throws(()=>run('notebookTools.validate([{...currentNotebook(),folderId:"missing"}],state.notebookFolders)'),/invalid notebook/);
assert.throws(()=>run('const badFormatting=structuredClone(currentNotebook());badFormatting.pages[0].blocks[0].runs=[{text:"Wrong text",bold:true}];notebookTools.validate([badFormatting],state.notebookFolders)'),/formatting/);
assert.throws(()=>run('notebookTools.validate([{...currentNotebook(),color:"red;position:absolute"}],state.notebookFolders)'),/invalid notebook/);
run('globalThis.exportAttack={...currentNotebook(),title:"<script>alert(1)</script>",color:"#62849b",pages:[{id:"safe",title:"<img src=x onerror=alert(1)>",blocks:[{type:"body",text:"<script>alert(2)</script>",runs:[],font:"sans",size:16}]}]}');const safeExport=run('notebookTools.exportHTML(exportAttack)');assert.ok(!safeExport.includes('<script>'));assert.ok(!safeExport.includes('<img src=x'));assert.ok(safeExport.includes('&lt;script&gt;'));
// Folder deletion keeps notes and reparents immediate subfolders.
run('state.notebooks[0].folderId=semesterFolder;notebookFolder="all";activeNotebook=state.notebooks[0].id;render()');const noteCount=run('state.notebooks.length');
await click(JSON.stringify({action:'delete-notebook-folder',folder:semesterFolder}));assert.equal(run('state.notebookFolders.length'),2);
await click(JSON.stringify({action:'confirm-delete-notebook-folder',folder:semesterFolder}));assert.equal(run('state.notebookFolders.length'),1);assert.equal(run('state.notebookFolders[0].parentId'),null);assert.equal(run('state.notebooks.length'),noteCount);assert.equal(run('state.notebooks[0].folderId'),null);
await click('{action:"delete-notebook-page"}');assert.ok(nodes.get('#modal').innerHTML.includes('Delete page?'));const pageToDelete=run('activeNotebookPage');await click(JSON.stringify({action:'confirm-delete-notebook-page',page:pageToDelete}));assert.equal(run('currentNotebook().pages.length'),1);await click('{action:"confirm-delete-notebook-page",page:"anything"}');assert.equal(run('currentNotebook().pages.length'),1);
console.log('PASS: pages and thumbnails, page selection/reorder/deletion, colors, folder/subfolder organization and cycle prevention, rich text parsing/persistence, page-linked search and scratch notes, legacy migration, safe backup/export round trips, HTML print layout, standalone JSON import, and non-destructive folder deletion.');
const originalCreateElement=context.document.createElement;let printed=0,printFrame;
context.document.createElement=tag=>tag==='iframe'?(printFrame={style:{},contentWindow:{addEventListener(){},focus(){},print(){printed++;}},remove(){}}):node();
context.document.body.append=frame=>{assert.equal(frame,printFrame);};
run('exportNotebook("print")');assert.ok(printFrame.srcdoc.includes('Lecture notebook'));printFrame.onload();assert.equal(printed,1);context.document.createElement=originalCreateElement;
console.log('PASS: notebook print action creates an isolated formatted document and invokes the browser print dialog.');
// Study-tools icon and storing all placed items retain every owned copy.
run('state=demo();guest=true;user=null;cloud=null;ready=true;view="dashboard";audio=null;render()');
assert.equal(run('navs.find(n=>n[0]==="study")[1]'),'flashcards');assert.equal(run('navs.find(n=>n[0]==="notebooks")[1]'),'book');
run('state.inventory={table:2,chair:1,counter:1,plant:2};state.owned.push("plant");state.placed.push({id:"table-extra",item:"table",gx:5,gy:5,rotation:0},{id:"plant-a",item:"plant",gx:0,gy:1,rotation:0},{id:"plant-b",item:"plant",gx:1,gy:1,rotation:0});state.avatarSeatId=state.placed.find(p=>p.item==="chair").id;cafeGuests=[];spawnCafeGuest();shopArea="inventory";selected="table-extra";moving="plant-a";');
const beforeStore=run('JSON.stringify({inventory:state.inventory,coins:state.coins,xp:state.xp,avatarId:state.avatarId,theme:state.theme})');assert.ok(run('cafePage()').includes('Store all café objects'));
await click('{action:"store-all-cafe"}');assert.equal(run('state.placed.length'),6);assert.ok(nodes.get('#modal').innerHTML.includes('Store all café objects?'));
await click('{action:"confirm-store-all-cafe"}');assert.equal(run('state.placed.length'),0);assert.equal(run('state.avatarSeatId'),null);assert.equal(run('selected'),null);assert.equal(run('moving'),null);assert.equal(run('cafeGuests.some(g=>g.chairId)'),false);assert.equal(run('JSON.stringify({inventory:state.inventory,coins:state.coins,xp:state.xp,avatarId:state.avatarId,theme:state.theme})'),beforeStore);
assert.equal(run('availableQuantity("table")'),2);assert.equal(run('availableQuantity("plant")'),2);await click('{place:"table"}');assert.equal(run('state.placed.length'),1);assert.equal(run('state.inventory.table'),2);assert.equal(run('availableQuantity("table")'),1);
assert.equal(JSON.parse(storage.get('cram-coffee-guest')).inventory.plant,2);
// One-time alarms: zone conversion, scheduling, cancellation, catch-up, and exactly-once alerts.
nodes.set('#alarm-alerts',node());nodes.set('#alarm-form-error',node());nodes.set('#alarm-list',node());
assert.equal(run('window.CoffeeAlarms.parseLocal("2026-10-03T10:00","America/Denver")'),'2026-10-03T16:00:00.000Z');
assert.equal(run('window.CoffeeAlarms.parseLocal("2026-10-03T10:00","Asia/Kathmandu")'),'2026-10-03T04:15:00.000Z');
assert.throws(()=>run('window.CoffeeAlarms.parseLocal("2026-03-08T02:30","America/Denver")'),/clocks change/);
assert.equal(run('window.CoffeeAlarms.parseLocal("2026-11-01T01:30","America/Denver")'),'2026-11-01T07:30:00.000Z');
assert.throws(()=>run('window.CoffeeAlarms.parseLocal("2026-02-30T10:00","America/Denver")'),/valid alarm date/);
run('globalThis.alarmTones=[];audio={prepare:async()=>true,endTone:(sound,volume)=>alarmTones.push({sound,volume})};state.alarms=[];view="focus";render()');assert.ok(nodes.get('#app').innerHTML.includes('data-action="alarms"'));
await run('submit({preventDefault(){},target:{id:"alarm-form",dataset:{id:""},data:{title:"Stretch",at:"2099-10-03T10:00",timeZone:"America/Denver",sound:"chime",volume:"65"}}})');
assert.equal(run('state.alarms.length'),1);const scheduledAlarm=run('state.alarms[0].id'),alarmAt=run('Date.parse(state.alarms[0].at)');assert.equal(run('state.alarms[0].status'),'scheduled');assert.equal(run('state.alarms[0].volume'),.65);
run('tickAlarms(Date.parse(state.alarms[0].at)-1)');assert.equal(run('alarmTones.length'),0);run('tickAlarms(Date.parse(state.alarms[0].at));tickAlarms(Date.parse(state.alarms[0].at)+99999)');assert.equal(run('alarmTones.length'),1);assert.equal(run('state.alarms[0].status'),'ringing');assert.ok(nodes.get('#alarm-alerts').innerHTML.includes('Stretch'));assert.equal(nodes.get('#alarm-alerts').hidden,false);
assert.equal(JSON.parse(storage.get('cram-coffee-guest')).alarms[0].status,'ringing');await click(JSON.stringify({action:'dismiss-alarm',alarm:scheduledAlarm}));assert.equal(run('state.alarms[0].status'),'dismissed');assert.equal(nodes.get('#alarm-alerts').hidden,true);
run('tickAlarms(Date.parse(state.alarms[0].at)+86400000)');assert.equal(run('alarmTones.length'),1);
await run('submit({preventDefault(){},target:{id:"alarm-form",dataset:{id:""},data:{title:"Cancelled reminder",at:"2099-10-04T11:00",timeZone:"UTC",sound:"bell",volume:"50"}}})');
const cancelledAlarm=run('state.alarms[1].id');await click(JSON.stringify({action:'cancel-alarm',alarm:cancelledAlarm}));run('tickAlarms(Date.parse(state.alarms[1].at)+86400000)');assert.equal(run('state.alarms[1].status'),'cancelled');assert.equal(run('alarmTones.length'),1);
await run('submit({preventDefault(){},target:{id:"alarm-form",dataset:{id:""},data:{title:"Past alarm",at:"2001-01-01T10:00",timeZone:"UTC",sound:"bell",volume:"50"}}})');assert.equal(run('state.alarms.length'),2);assert.ok(nodes.get('#alarm-form-error').textContent.includes('future'));
const alarmBackup=run('window.CoffeeStudyTools.validateBackup(structuredClone(state),initial(),products.map(p=>p.id))');assert.equal(alarmBackup.alarms[0].status,'dismissed');assert.equal(alarmBackup.alarms[1].status,'cancelled');
assert.throws(()=>run('window.CoffeeAlarms.validate([{...state.alarms[0],status:"daily"}])'),/invalid alarm/);
assert.throws(()=>run('window.CoffeeAlarms.validate([{...state.alarms[0],timeZone:"Invalid/Zone"}])'),/invalid alarm/);
assert.throws(()=>run('window.CoffeeAlarms.validate([{...state.alarms[0],status:"scheduled"}])'),/invalid alarm/);
context.alarmBackup=alarmBackup;run('audio=null;restoreProgress(alarmBackup);tickAlarms(Date.parse(state.alarms[0].at)+864000000)');assert.equal(run('state.alarms[0].status'),'dismissed');assert.equal(run('state.alarms[1].status'),'cancelled');
const legacyAlarms=run('const withoutAlarms=structuredClone(state);delete withoutAlarms.alarms;window.CoffeeStudyTools.validateBackup(withoutAlarms,initial(),products.map(p=>p.id)).alarms');assert.equal(legacyAlarms.length,0);
console.log('PASS: flashcard navigation icon; clear all café objects returns quantities to inventory and clears chair reservations without altering coins/theme/avatar; one-time alarms honor time zones/DST, persist, fire exactly once, cancel/dismiss, validate backups, and do not repeat after reload or restore.');

// Notebook box sizes persist independently of rich text and survive backups.
run('loadGuest();state.notebooks=[notebookTools.create("Resizable notes")];view="notebooks";activeNotebook=state.notebooks[0].id;render()');
let resizeHandler;context.ResizeObserver=class{constructor(handler){resizeHandler=handler;}disconnect(){}observe(){}};
run('watchNotebookBoxes()');const resizedBox={isConnected:true,dataset:{notebookRich:run('currentNotebookPage().blocks[0].id')},style:{width:'300px',height:'240px'},parentElement:{clientWidth:600}};
resizeHandler([{target:resizedBox}]);assert.equal(run('currentNotebookPage().blocks[0].boxWidth'),50);assert.equal(run('currentNotebookPage().blocks[0].boxHeight'),240);
assert.equal(JSON.parse(storage.get('cram-coffee-guest')).notebooks[0].pages[0].blocks[0].boxHeight,240);
run('render()');assert.ok(nodes.get('#app').innerHTML.includes('width:50%;height:240px;'));
assert.equal(run('notebookTools.validate(state.notebooks)[0].pages[0].blocks[0].boxWidth'),50);
assert.throws(()=>run('notebookTools.validate([{...currentNotebook(),pages:[{...currentNotebookPage(),blocks:[{...currentNotebookPage().blocks[0],boxWidth:101}]}]}])'),/dimensions/);
assert.ok(run('notebookTools.exportHTML(currentNotebook())').includes('width:50%;min-height:240px;'));
// Classes with no tasks or flashcards must appear in focus, and removed classes must not.
run('state.classes=["General","Empty class","Art & design"];state.tasks=[];state.cards=[];state.decks=[];state.removedClasses=[];timer.subject="Empty class"');
let focusClasses=run('focusPage()');assert.ok(focusClasses.includes('value="Empty class" selected'));assert.ok(focusClasses.includes('Art &amp; design'));
run('state.removedClasses=["Empty class"];focusPage()');assert.equal(run('timer.subject'),'General');assert.ok(!run('focusPage()').includes('value="Empty class"'));
console.log('PASS: notebook resize saves width/height, renders saved sizes, validates/imports/exports dimensions; focus dropdown includes empty classes and excludes removed classes.');

// Session restoration keeps guest data and scopes page memory to each account.
context.localStorage.removeItem=k=>storage.delete(k);
run('cloud=null;loadGuest();view="notebooks";render()');const savedGuest=storage.get('cram-coffee-guest');
run('ready=false;guest=false;user=null;view="dashboard"');await run('init()');
assert.equal(run('ready'),true);assert.equal(run('guest'),true);assert.equal(run('view'),'notebooks');assert.equal(storage.get('cram-coffee-guest'),savedGuest);
await click('{action:"logout"}');assert.equal(storage.has('cram-coffee-session'),false);
await run('init()');assert.equal(run('ready'),false);assert.ok(nodes.get('#app').innerHTML.includes('Enter the guest café'));
run('loadGuest();view="focus";render();localStorage.setItem("cram-coffee-last-page-accountA","tasks");localStorage.setItem("cram-coffee-last-page-accountB","study");guest=false;ready=false;user=null;cloud={db:{},doc:(db,collection,id)=>id,getDoc:async()=>({exists:()=>true,data:()=>({data:initial()})}),signOut:async()=>{},setDoc:async()=>{}}');
await run('handleAuthState({uid:"accountA",displayName:"A"})');assert.equal(run('view'),'tasks');assert.equal(run('state.name'),'A');assert.equal(storage.get('cram-coffee-session'),'account');
await run('handleAuthState({uid:"accountB",displayName:"B"})');assert.equal(run('view'),'study');assert.equal(run('state.name'),'B');
await run('handleAuthState({uid:"newAccount",displayName:"New"})');assert.equal(run('view'),'dashboard');
run('view="cafe";render()');assert.equal(storage.get('cram-coffee-last-page-newAccount'),'cafe');
await click('{action:"logout"}');assert.equal(storage.has('cram-coffee-session'),false);assert.equal(run('ready'),false);assert.equal(storage.get('cram-coffee-last-page-newAccount'),'cafe');
run('localStorage.setItem("cram-coffee-last-page-guest","invalid-page");loadGuest()');assert.equal(run('view'),'dashboard');
await run('handleAuthState({uid:"accountA"})');assert.equal(run('guest'),true);assert.equal(run('user'),null);
console.log('PASS: guest reload resumes the last page with data intact, explicit logout returns to login, account page choices stay separate, new/invalid page defaults are safe, and restored Firebase accounts do not replace an active guest session.');


run('loadGuest();filter="all";classFilter="all";state.tasks=[{id:"future",title:"Future task",subject:"General",due:"2026-10-10",minutes:10},{id:"undated",title:"Undated task",subject:"General",due:"",minutes:10},{id:"early",title:"Earlier task",subject:"General",due:"2026-10-06",minutes:10},{id:"same",title:"Same day task",subject:"General",due:"2026-10-06",minutes:10,done:true}]');
const dayGroups=run('tasksPage()');assert.ok(dayGroups.indexOf('Earlier task')<dayGroups.indexOf('Same day task'));assert.ok(dayGroups.indexOf('Same day task')<dayGroups.indexOf('Future task'));assert.ok(dayGroups.indexOf('Future task')<dayGroups.indexOf('Undated task'));assert.equal((dayGroups.match(/Tuesday, October 6, 2026/g)||[]).length,1);assert.equal(run('state.tasks[0].id'),'future');assert.ok(dayGroups.includes('No due date'));
console.log('PASS: All tasks groups shared due dates under weekday headings, sorts chronologically, puts undated tasks last, and preserves stored task order.');

run('state.tasks=[{id:"a",title:"Reading",subject:"General",due:today(),minutes:45,done:false},{id:"b",title:"Practice",subject:"General",due:today(),minutes:50,done:false},{id:"c",title:"Finished",subject:"General",due:today(),minutes:25,done:true},{id:"d",title:"Undated",subject:"Other",due:"",minutes:15,done:false}];classFilter="all";filter="all"');
assert.ok(run('tasksPage()').includes('2h allotted'));assert.ok(run('tasksPage()').includes('15 min allotted'));
run('filter="upcoming"');assert.ok(run('tasksPage()').includes('1h 35m allotted'));assert.ok(!run('tasksPage()').includes('Finished'));
run('classFilter="Other"');assert.ok(!run('tasksPage()').includes('1h 35m allotted'));assert.ok(run('tasksPage()').includes('15 min allotted'));
console.log('PASS: daily allotted time sums displayed tasks in All and Upcoming, formats hours/minutes, and respects completed/class filters.');
