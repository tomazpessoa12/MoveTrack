const fs=require('fs');
const path=require('path');
const {monthlyPdf,monthTitle}=require('./reports');
const ZONE='America/Recife';
function schedule(data,now=new Date()){
 const s=data.settings;if(!s.monthlyReportEnabled||!s.discordWebhook)return null;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit'}).formatToParts(now),year=Number(parts.find(p=>p.type==='year').value),month=Number(parts.find(p=>p.type==='month').value);
 const day=Math.min(Number(s.monthlyReportDay)||1,new Date(Date.UTC(year,month,0)).getUTCDate()),hour=s.monthlyReportHour||'07:00';
 const due=new Date(`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}T${hour}:00-03:00`),enabledAt=new Date(s.monthlyReportEnabledAt);
 if(!Number.isFinite(enabledAt.getTime())||due>now||due<enabledAt)return null;
 return{month:new Date(Date.UTC(year,month-2,1)).toISOString().slice(0,7),due:due.toISOString(),webhook:s.discordWebhook};
}
function createMonthlyScheduler({readData,stateFile,pdf=monthlyPdf,fetchImpl=globalThis.fetch,clock=()=>new Date()}){
 let running=false;
 function state(){try{return JSON.parse(fs.readFileSync(stateFile,'utf8'))}catch(error){if(error.code==='ENOENT')return{sent:{}};throw error}}
 function save(value){fs.mkdirSync(path.dirname(stateFile),{recursive:true});fs.writeFileSync(stateFile+'.tmp',JSON.stringify(value,null,2),{mode:0o600});fs.renameSync(stateFile+'.tmp',stateFile)}
 async function tick(){
  if(running)return;running=true;let month;
  try{
   const now=clock(),data=readData(),job=schedule(data,now);if(!job)return;
   month=job.month;const record=state();if(record.sent?.[month]||record.retry?.month===month&&new Date(record.retry.after)>now)return;
   const buffer=await pdf(data,{month,types:['pallet','avulso'],order:'date-asc',generatedAt:now});
   const latest=schedule(readData(),clock());if(!latest||latest.month!==month||latest.webhook!==job.webhook||latest.due!==job.due)return;
   const filename=`MoveTrack-Relatorio-${month}.pdf`,form=new FormData();
   form.append('payload_json',JSON.stringify({content:`Relatório Mensal - ${monthTitle(month)}\nMovimentações de paletes e avulsos do mês anterior.`,allowed_mentions:{parse:[]},attachments:[{id:0,filename}]}));form.append('files[0]',new Blob([buffer],{type:'application/pdf'}),filename);
   const url=new URL(job.webhook);url.searchParams.set('wait','true');
   const result=await fetchImpl(url.toString(),{method:'POST',body:form,signal:AbortSignal.timeout(30000)});
   if(!result.ok)throw Error(`Discord recusou o relatório mensal (HTTP ${result.status}).`);
   const message=await result.json();if(!message.id)throw Error('Discord não confirmou a mensagem do relatório mensal.');
   const fresh=state();fresh.sent=fresh.sent||{};fresh.sent[month]={messageId:String(message.id),sentAt:clock().toISOString()};delete fresh.retry;save(fresh);return{sent:true,month};
  }catch(error){if(month){const record=state();record.retry={month,after:new Date(clock().getTime()+5*60*1000).toISOString()};save(record)}throw error}
  finally{running=false}
 }
 return{tick};
}
module.exports={schedule,createMonthlyScheduler};
