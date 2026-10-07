/* Calendar-day plant care is independent of the account's XP level. */
(() => {
  const names=['Soil only','Sprout','Seedling','Young plant','Fully grown'];
  const nextDay=day=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
  function update(state,day){
    const goal=Math.max(1,Number(state.settings.daily)||60);let changed=false,xp=0,grown=0,missed=0;
    if(!state.plantCare){state.plantCare={stage:0,lastDate:day,goal,completed:false,reward:0};changed=true;}
    const care=state.plantCare;
    if(day<care.lastDate)return {changed,xp,grown,missed};
    const totals=new Map();for(const s of state.sessions)totals.set(s.date,(totals.get(s.date)||0)+s.minutes);
    function qualify(){if(!care.completed&&(totals.get(care.lastDate)||0)>=care.goal){care.reward=care.stage===4?15:5;xp+=care.reward;care.stage=Math.min(4,care.stage+1);care.completed=true;grown++;changed=true;}}
    while(care.lastDate<day){qualify();if(!care.completed){care.stage=Math.max(0,care.stage-1);missed++;}care.lastDate=nextDay(care.lastDate);care.completed=false;care.reward=0;changed=true;}
    if(care.goal!==goal){care.goal=goal;changed=true;}
    qualify();if(xp)state.xp+=xp;
    return {changed,xp,grown,missed};
  }
  window.CoffeePlant={names,nextDay,update,image:stage=>stage===4?'assets/plant.png':'assets/plant-stage-'+stage+'.png'};
})();
