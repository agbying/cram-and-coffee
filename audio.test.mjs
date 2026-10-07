import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const intervals=new Map(),nodes=[],buffers=[];let sequence=0;
const parameter=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}});
const node=()=>{const n={gain:parameter(),frequency:parameter(),connect(){return this;},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};nodes.push(n);return n;};
class FakeAudioContext{
  constructor(){this.sampleRate=1000;this.state='suspended';this.currentTime=0;this.destination={};}
  async resume(){this.state='running';}
  createMediaElementSource(media){const n=node();n.media=media;return n;}
  createGain(){return node();}
  createOscillator(){return node();}
  createBufferSource(){return node();}
  createBiquadFilter(){return node();}
  createBuffer(_,length){const data=new Float32Array(length);buffers.push(data);return {getChannelData:()=>data};}
}
const players=[];
class FakeMedia{constructor(src){this.src=src;players.push(this);}async play(){this.playing=true;if(this.fail)throw Error('decode failure');}pause(){this.paused=true;}removeAttribute(name){if(name==='src')this.src='';}load(){this.released=true;}}
const context=vm.createContext({window:{AudioContext:FakeAudioContext,Audio:FakeMedia},Math,Number,Object,Array,console,setInterval(fn){const id=++sequence;intervals.set(id,fn);return id;},clearInterval(id){intervals.delete(id);}});
vm.runInContext(fs.readFileSync(new URL('./audio.js',import.meta.url),'utf8'),context);
const Audio=context.window.CoffeeAudio,engine=new Audio();
for(const kind of Object.keys(context.window.CoffeeAudioNames)){
  await engine.start(kind,.35);assert.equal(engine.kind,kind);assert.equal(engine.context.state,'running');
  if(kind!=='brown'){const player=players.at(-1);assert.equal(player.loop,true);assert.equal(player.playing,true);const file={rain:'rain.mp3',fire:'fire.m4a',forest:'bird.mp3',cafe:'cafe.m4a',keys:'piano.m4a'}[kind];assert.equal(player.src,'assets/audio/'+file);assert.ok(fs.statSync(new URL('./assets/audio/'+file,import.meta.url)).size>0);}
  engine.setVolume(.6);assert.equal(engine.group.gain.gain.value,.192);
  for(const fn of intervals.values())fn();
  const active=engine.group.gain;engine.stop();assert.equal(engine.kind,null);assert.equal(engine.group,null);assert.equal(active.disconnected,true);assert.equal(intervals.size,0);if(kind!=='brown'){assert.equal(players.at(-1).paused,true);assert.equal(players.at(-1).released,true);}
}
assert.ok(buffers.every(data=>data.every(v=>Number.isFinite(v)&&Math.abs(v)<=1)));
const before=nodes.length;engine.endTone('none',.5);engine.endTone('bell',0);assert.equal(nodes.length,before);
engine.endTone('bell',.5);assert.equal(nodes.length,before+4);
engine.endTone('chime',.5);assert.equal(nodes.length,before+10);
await assert.rejects(()=>engine.start('unknown'),/available/);
await Promise.all([engine.start('rain'),engine.start('keys')]);assert.equal(engine.kind,'keys');engine.stop();assert.equal(intervals.size,0);
context.window.Audio=class extends FakeMedia{constructor(src){super(src);this.fail=true;}};await assert.rejects(()=>engine.start('rain'),/Could not play/);assert.equal(engine.kind,null);assert.equal(engine.group,null);assert.equal(players.at(-1).released,true);
context.window.AudioContext=null;const unsupported=new Audio();assert.equal(await unsupported.prepare(),false);
console.log('PASS: five supplied recordings loop and release on stop/switch, playback failures clean up, brown noise stays synthesized, volume updates, bell/chime/off tones, and unsupported audio handling.');
