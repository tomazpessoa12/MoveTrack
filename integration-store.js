'use strict';
const fs=require('fs'),path=require('path');
const file=()=>path.join(path.dirname(process.env.DATA_FILE||path.join(__dirname,'data.json')),'integration-test.json');
function read(){try{const d=JSON.parse(fs.readFileSync(file(),'utf8'));return {...d,access:Array.isArray(d.access)?d.access:[96]}}catch(e){if(e.code==='ENOENT')return {ambiente:process.env.SANKHYA_AMBIENTE||'sandbox',clientId:process.env.SANKHYA_CLIENT_ID||'',clientSecret:process.env.SANKHYA_CLIENT_SECRET||'',token:process.env.SANKHYA_TOKEN||'',host:process.env.APP_HOST||'localhost',access:[96]};throw e}}
function save(data){const f=file();fs.mkdirSync(path.dirname(f),{recursive:true});let tmp=f+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2),{mode:0o600});fs.renameSync(tmp,f);fs.chmodSync(f,0o600)}
function env(){const c=read();return {...process.env,SANKHYA_AMBIENTE:c.ambiente,SANKHYA_CLIENT_ID:c.clientId,SANKHYA_CLIENT_SECRET:c.clientSecret,SANKHYA_TOKEN:c.token}}
module.exports={read,save,env};
