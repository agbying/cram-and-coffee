(() => {
  const formatterCache=new Map();
  function formatter(zone){if(!formatterCache.has(zone))formatterCache.set(zone,new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}));return formatterCache.get(zone);}
  function parts(at,zone){const out={};for(const p of formatter(zone).formatToParts(new Date(at)))if(p.type!=='literal')out[p.type]=Number(p.value);return out;}
  const stamp=p=>Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second||0);
  function wall(at,zone){const p=parts(at,zone),pad=n=>String(n).padStart(2,'0');return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;}
  function parseLocal(value,zone){
    if(!window.CoffeeClock.validTimeZone(zone)||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw new Error('Choose a valid date, time, and time zone.');
    const [year,month,day,hour,minute]=value.match(/\d+/g).map(Number),target=Date.UTC(year,month-1,day,hour,minute),check=new Date(target);
    if(year<2000||year>2100||check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==day||hour>23||minute>59)throw new Error('Choose a valid alarm date and time.');
    let guess=target;for(let i=0;i<4;i++)guess+=target-stamp(parts(guess,zone));
    const candidates=[-120,-90,-60,-30,0,30,60,90,120].map(minutes=>guess+minutes*60000).filter(at=>wall(at,zone)===value);
    if(!candidates.length)throw new Error('That local time does not exist because the clocks change. Choose another time.');
    return new Date(Math.min(...candidates)).toISOString();
  }
  function validate(value){if(value===undefined)return [];if(!Array.isArray(value)||value.length>1000)throw new Error('The backup has invalid alarms.');const ids=new Set();return value.map(a=>{
    if(!a||typeof a.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(a.id)||ids.has(a.id)||typeof a.title!=='string'||!a.title.trim()||a.title.length>80||typeof a.at!=='string'||a.at.length>40||!Number.isFinite(Date.parse(a.at))||!window.CoffeeClock.validTimeZone(a.timeZone)||!['scheduled','ringing','dismissed','cancelled'].includes(a.status)||!['bell','chime','none'].includes(a.sound)||!Number.isFinite(a.volume)||a.volume<0||a.volume>1||(a.firedAt!==null&&(typeof a.firedAt!=='string'||a.firedAt.length>40||!Number.isFinite(Date.parse(a.firedAt))))||(a.status==='scheduled'&&a.firedAt!==null)||(['ringing','dismissed'].includes(a.status)&&a.firedAt===null))throw new Error('The backup contains an invalid alarm.');
    ids.add(a.id);return {id:a.id,title:a.title,at:a.at,timeZone:a.timeZone,status:a.status,sound:a.sound,volume:a.volume,firedAt:a.firedAt};
  });}
  function due(alarms,now=Date.now()){const fired=[];for(const a of alarms)if(a.status==='scheduled'&&Date.parse(a.at)<=now){a.status='ringing';a.firedAt=new Date(now).toISOString();fired.push(a);}return fired;}
  window.CoffeeAlarms={wall,parseLocal,validate,due};
})();
