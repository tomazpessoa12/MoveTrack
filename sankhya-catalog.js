'use strict';
// This fixed, read-only query never accepts SQL or URLs supplied by a browser.
const SQL=`SELECT PRODUTOS.*, COUNT(*) OVER () AS TOTAL_REGISTROS
FROM (
 SELECT DISTINCT PRO.CODPROD, OBTEM_NOME_LIMPO(PRO.CODPROD) AS DESCRICAO, PRO.MARCA, BAR.CODBARRA
 FROM TGFPRO PRO
 JOIN TGFBAR BAR ON BAR.CODPROD = PRO.CODPROD AND BAR.CODVOL = PRO.CODVOL
 WHERE PRO.ATIVO = 'S'
 AND EXISTS (SELECT 1 FROM TGFMAR MAR WHERE MAR.DESCRICAO = PRO.MARCA AND MAR.AD_SEGMENTO = 'MELODIAPET')
) PRODUTOS
ORDER BY PRODUTOS.CODPROD`;
const URLS={sandbox:'https://api.sandbox.sankhya.com.br',producao:'https://api.sankhya.com.br'};
const REQUIRED=['CODPROD','DESCRICAO','MARCA','CODBARRA','TOTAL_REGISTROS'];
function unwrap(v){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.hasOwn(v,'$')?v.$:v}
function parseResult(payload){
 if(String(payload?.status)!=='1')throw Error('O Sankhya recusou a consulta. Verifique a autorização do DbExplorer e da função OBTEM_NOME_LIMPO.');
 const b=payload.responseBody;if(!b||typeof b!=='object')throw Error('Resposta de consulta incompleta. Nenhuma alteração foi feita.');
 let raw=b.rows;if(raw&&!Array.isArray(raw)&&Array.isArray(raw.row))raw=raw.row;
 if(!Array.isArray(raw)||!raw.length)throw Error('A consulta não retornou produtos válidos; o catálogo foi preservado.');
 let meta=b.fieldsMetadata?.field||b.fieldsMetadata||[];if(!Array.isArray(meta))meta=[meta];
 const fields=meta.map(x=>String(unwrap(x?.name??x?.fieldName??x?.NAME??x)||'').toUpperCase());
 const result=raw.map(row=>{
  let obj={};if(Array.isArray(row)){if(fields.length!==row.length||!REQUIRED.every(f=>fields.includes(f)))throw Error('Colunas da resposta não reconhecidas; catálogo preservado.');fields.forEach((f,i)=>obj[f]=unwrap(row[i]));}
  else if(row&&typeof row==='object'){for(const [k,v] of Object.entries(row))obj[k.toUpperCase()]=unwrap(v)}
  else throw Error('Linha inválida na resposta do Sankhya.');
  if(REQUIRED.some(k=>!Object.hasOwn(obj,k))||obj.TOTAL_REGISTROS==null)throw Error('Resposta sem todas as colunas necessárias; catálogo preservado.');
  return {code:obj.CODPROD,name:obj.DESCRICAO,brand:obj.MARCA,barcode:String(obj.CODBARRA??'').trim(),total:Number(obj.TOTAL_REGISTROS)};
 });
 if(result.some(p=>!Number.isSafeInteger(p.total)||p.total!==result.length))throw Error('A consulta retornou dados incompletos; o catálogo foi preservado.');
 return result.map(({total,...product})=>product);
}
async function synchronize({env=process.env,fetchFn=fetch,onStage=()=>{}}={}){
 const environment=String(env.SANKHYA_AMBIENTE||'sandbox').toLowerCase(),url=URLS[environment];
 if(!url)throw Error('Ambiente inválido. Use sandbox ou producao no arquivo .env.');
 const clientId=env.SANKHYA_CLIENT_ID,secret=env.SANKHYA_CLIENT_SECRET,token=env.SANKHYA_TOKEN;
 if(!clientId||!secret||!token)throw Error('Credenciais de integração ausentes. Configure os dados Sankhya no arquivo .env.');
 const request=async(endpoint,options,label)=>{let res;try{res=await fetchFn(url+endpoint,{...options,redirect:'error',signal:AbortSignal.timeout(45000)})}catch{throw Error(`Não foi possível conectar ao Sankhya durante ${label}. Confira a rede e tente novamente.`)}if(!res.ok)throw Error(`Sankhya recusou ${label} (HTTP ${res.status}). Confira credenciais, ambiente e permissões.`);try{return await res.json()}catch{throw Error(`Resposta inválida do Sankhya durante ${label}.`)}};
 onStage('autenticando');
 const auth=await request('/authenticate',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Token':token},body:new URLSearchParams({grant_type:'client_credentials',client_id:clientId,client_secret:secret})},'a autenticação');
 if(!auth.access_token||typeof auth.access_token!=='string')throw Error('A autenticação não retornou um token válido.');
 onStage('consultando');
 const payload=await request('/gateway/v1/mge/service.sbr?serviceName=DbExplorerSP.executeQuery&outputType=json',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth.access_token},body:JSON.stringify({serviceName:'DbExplorerSP.executeQuery',requestBody:{sql:SQL}})},'a consulta');
 onStage('validando');return parseResult(payload);
}
function updateCatalog(existing,incoming,validate){
 const errors=[], candidates=[], lists={created:[],updated:[],inactivated:[],unchanged:[]};
 const report=(p,reason)=>errors.push({code:String(p.code??''),name:String(p.name??''),barcode:String(p.barcode??''),reason});
 for(const p of incoming){try{candidates.push({raw:p,product:validate(p)})}catch(e){report(p,e.message||'Dados inválidos.')}}
 const codeCounts=new Map(),barcodeCounts=new Map();
 for(const p of incoming){const code=Number(p.code);if(Number.isSafeInteger(code)&&code>0)codeCounts.set(code,(codeCounts.get(code)||0)+1)}
 for(const p of incoming){const code=Number(p.code);if(codeCounts.get(code)>1&&!candidates.some(c=>c.raw===p))report(p,'Código de produto duplicado na consulta.')};
 for(const {product:p} of candidates)barcodeCounts.set(p.barcode,(barcodeCounts.get(p.barcode)||0)+1);
 const localBarcodes=new Map(existing.filter(p=>p.barcode).map(p=>[p.barcode,p.code])),byCode=new Map();
 for(const {raw,product:p} of candidates){
  if(codeCounts.get(p.code)>1){report(raw,'Código de produto duplicado na consulta.');continue}
  if(barcodeCounts.get(p.barcode)>1){report(raw,'Código de barras duplicado na consulta.');continue}
  if(localBarcodes.has(p.barcode)&&localBarcodes.get(p.barcode)!==p.code){report(raw,'Código de barras já pertence a outro produto no catálogo.');continue}
  byCode.set(p.code,p);
 }
 const old=new Map(existing.map(p=>[p.code,p]));let created=0,updated=0,inactivated=0,unchanged=0;
 const next=existing.map(p=>{const n=byCode.get(p.code);if(!n){if(!errors.length&&p.active!==false){inactivated++;lists.inactivated.push({code:p.code,name:p.name,barcode:p.barcode});return {...p,active:false}}return p}byCode.delete(p.code);if(p.name!==n.name||p.brand!==n.brand||p.barcode!==n.barcode||p.active===false){updated++;lists.updated.push({code:n.code,name:n.name,barcode:n.barcode});return {...p,...n}}unchanged++;lists.unchanged.push({code:p.code,name:p.name,barcode:p.barcode});return p});
 for(const p of byCode.values()){created++;lists.created.push({code:p.code,name:p.name,barcode:p.barcode});next.push(p)}
 // Reject collisions even with retained inactive products; never silently corrupt a catalog.
 const all=new Map();for(const p of next){if(!p.barcode)continue;if(all.has(p.barcode)&&all.get(p.barcode)!==p.code)throw Error('Código de barras já pertence a outro produto local; catálogo preservado.');all.set(p.barcode,p.code)}
 return {products:next,created,updated,inactivated,unchanged,total:incoming.length,errors,lists,inactivationSkipped:errors.length>0};
}
module.exports={SQL,parseResult,synchronize,updateCatalog};
