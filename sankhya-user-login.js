'use strict';
const targets={sandbox:'https://api.sandbox.sankhya.com.br',producao:'https://api.sankhya.com.br'};
async function loginSankhya({ambiente,clientId,clientSecret,token,username,password},fetchFn=fetch){
 const base=targets[ambiente];if(!base||![clientId,clientSecret,token,username,password].every(x=>typeof x==='string'&&x.length>0&&x.length<=4096))throw Error('Informações de autenticação ausentes ou inválidas.');
 const options={redirect:'error',signal:AbortSignal.timeout(30000)};
 let auth;try{auth=await fetchFn(base+'/authenticate',{...options,method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Token':token},body:new URLSearchParams({grant_type:'client_credentials',client_id:clientId,client_secret:clientSecret})});}catch{throw Error('Não foi possível conectar ao Sankhya.');}
 if(!auth.ok)throw Error('A conexão da integração com o Sankhya foi recusada.');
 let a;try{a=await auth.json()}catch{throw Error('Resposta de autenticação não reconhecida.');}if(typeof a.access_token!=='string'||!a.access_token)throw Error('Resposta de autenticação não reconhecida.');
 let reply;try{reply=await fetchFn(base+'/gateway/v1/mge/service.sbr?serviceName=MobileLoginSP.login&outputType=json',{...options,method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+a.access_token},body:JSON.stringify({serviceName:'MobileLoginSP.login',requestBody:{NOMUSU:{$:username},INTERNO:{$:password},KEEPCONNECTED:{$:'N'}}})})}catch{throw Error('Não foi possível consultar o login no Sankhya.');}
 if(!reply.ok)throw Error('O serviço de login do Sankhya recusou a consulta.');let result;try{result=await reply.json()}catch{throw Error('Resposta de login não reconhecida.');}
 if(String(result?.status)!=='1')throw Error('Usuário ou senha não confirmados.');
 const response=result.responseBody||{},session=response.jsessionid?.$||response.jsessionId?.$,encoded=response.idusu?.$;
 if(typeof session!=='string'||!session||typeof encoded!=='string')throw Error('Resposta de login incompleta.');
 const compact=encoded.trim();if(!/^[A-Za-z0-9+/]+={0,2}$/.test(compact))throw Error('Identificador de usuário inválido.');
 const code=Buffer.from(compact,'base64').toString('utf8');if(!/^(0|[1-9]\d*)$/.test(code)||!Number.isSafeInteger(Number(code)))throw Error('Identificador de usuário inválido.');
 return {code:Number(code)};
}
module.exports={loginSankhya};
