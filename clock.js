/* Live header date/clock formatting in the selected display time zone. */
(() => {
  function validTimeZone(zone){try{if(typeof zone!=='string'||zone.length>80)return false;new Intl.DateTimeFormat('en-US',{timeZone:zone}).format();return true;}catch{return false;}}
  function defaultTimeZone(){return Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Denver';}
  function timeZones(selected){const common=['UTC','America/Denver','America/Los_Angeles','America/Chicago','America/New_York','America/Phoenix','Europe/London','Europe/Paris','Asia/Kolkata','Asia/Tokyo','Australia/Sydney','Pacific/Auckland'];let supported=[];try{supported=Intl.supportedValuesOf('timeZone');}catch{}return [...new Set([selected,...common,...supported].filter(validTimeZone))].sort();}
  let cached;
  function format(now,zone){if(!validTimeZone(zone))zone=defaultTimeZone();if(cached?.zone!==zone)cached={zone,date:new Intl.DateTimeFormat('en-US',{timeZone:zone,weekday:'long',month:'short',day:'numeric'}),time:new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'})};return {date:cached.date.format(now),time:cached.time.format(now),zone};}
  window.CoffeeClock={validTimeZone,defaultTimeZone,timeZones,format};
})();
