/* Supplied looping recordings, synthesized brown noise, and phase-end tones. */
(() => {
  const names={rain:'Rain',brown:'Brown noise',fire:'Fireplace',forest:'Forest birds',cafe:'Café hum',keys:'Piano'};
  const recordings={rain:'rain.mp3',fire:'fire.m4a',forest:'bird.mp3',cafe:'cafe.m4a',keys:'piano.m4a'};
  class CoffeeAudio {
    constructor(){this.context=null;this.group=null;this.kind=null;this.volume=.35;this.version=0;}
    async prepare(){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;if(!this.context)this.context=new Audio();if(this.context.state==='suspended')await this.context.resume();return true;}
    setVolume(volume){this.volume=Math.max(0,Math.min(1,Number(volume)||0));if(this.group)this.group.gain.gain.setTargetAtTime(this.volume*.32,this.context.currentTime,.08);}
    stop(){this.version++;if(this.group){for(const fn of this.group.cleanup)try{fn();}catch{}this.group.gain.disconnect();this.group=null;}this.kind=null;}
    async start(kind,volume=this.volume){
      if(!names[kind])throw new Error('Choose an available background sound.');
      const version=++this.version;
      if(!await this.prepare())throw new Error('Audio is unavailable in this browser.');
      if(version!==this.version)return;
      this.stop();this.kind=kind;this.volume=Math.max(0,Math.min(1,Number(volume)||0));
      const ctx=this.context,gain=ctx.createGain();gain.gain.value=this.volume*.32;gain.connect(ctx.destination);this.group={gain,cleanup:[]};
      const noise=(type,frequency,level)=>{
        const length=ctx.sampleRate*9,buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;
        for(let i=0;i<length;i++){const white=Math.random()*2-1;brown=(brown+.025*white)/1.025;data[i]=type==='brown'?Math.tanh(brown*4):white*.45;}
        const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),amp=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type=type==='high'?'highpass':'lowpass';filter.frequency.value=frequency;amp.gain.value=level;source.connect(filter).connect(amp).connect(gain);source.start();
        this.group.cleanup.push(()=>{source.stop();source.disconnect();filter.disconnect();amp.disconnect();});
      };
      if(kind==='brown'){noise('brown',800,1);return;}
      const group=this.group,media=new window.Audio('assets/audio/'+recordings[kind]);
      media.loop=true;media.preload='auto';
      const source=ctx.createMediaElementSource(media);source.connect(gain);
      group.cleanup.push(()=>{media.pause();media.removeAttribute('src');media.load();source.disconnect();});
      try{await media.play();}catch(error){
        if(this.group===group){this.stop();throw new Error('Could not play this recording. Try starting it again.');}
      }

    }
    endTone(choice='bell',volume=this.volume){
      if(choice==='none'||!this.context||this.context.state!=='running'||volume<=0)return;
      const ctx=this.context,notes=choice==='chime'?[523.25,659.25,783.99]:[880,1320],at=ctx.currentTime;
      notes.forEach((freq,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;const start=at+i*.16;gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume*.16,start+.01);gain.gain.exponentialRampToValueAtTime(.0001,start+1.15);osc.connect(gain).connect(ctx.destination);osc.start(start);osc.stop(start+1.2);osc.onended=()=>{osc.disconnect();gain.disconnect();};});
    }
  }
  window.CoffeeAudio=CoffeeAudio;window.CoffeeAudioNames=names;
})();
