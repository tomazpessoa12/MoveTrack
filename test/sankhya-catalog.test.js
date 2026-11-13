const {test}=require('node:test');const assert=require('node:assert/strict');
const {parseResult,synchronize,updateCatalog,SQL}=require('../sankhya-catalog');
const fields=['CODPROD','DESCRICAO','MARCA','CODBARRA','TOTAL_REGISTROS'];
const row=(c,n,b,e,t)=>[c,n,b,e,t];const response=rows=>({status:'1',responseBody:{fieldsMetadata:fields.map(name=>({name})),rows}});
const validate=p=>{let code=Number(p.code);if(!Number.isSafeInteger(code)||code<=0||!p.name||!p.brand||!/^\d{13}$/.test(p.barcode))throw Error('Produto inválido');return{...p,code,active:true}};
test('confere completude, colunas e status antes de permitir qualquer alteração',()=>{
 const records=[row(1,'A','MARCA','7897190280175',2),row(2,'B','MARCA','7897190280168',2)];assert.equal(parseResult(response(records)).length,2);
 assert.throws(()=>parseResult(response(records.slice(0,1))),/incompletos/);assert.throws(()=>parseResult(response([])),/não retornou/);assert.throws(()=>parseResult({status:'0',statusMessage:'erro',responseBody:{}}),/recusou/);assert.throws(()=>parseResult({status:'1',responseBody:{rows:[records[0]]}}),/Colunas/);
});
test('identifica produtos adicionados, alterados, inativados e preserva demais campos',()=>{
 const existing=[{code:1,name:'Antigo',brand:'M',barcode:'7897190280175',active:true,extra:'ok'},{code:2,name:'B',brand:'M',barcode:'7897190280168',active:true}];
 const incoming=[{code:1,name:'Novo',brand:'M',barcode:'7897190280175'},{code:3,name:'C',brand:'M',barcode:'7897190280182'}];const r=updateCatalog(existing,incoming,validate);
 assert.deepEqual([r.created,r.updated,r.inactivated,r.unchanged],[1,1,1,0]);assert.equal(r.products[0].extra,'ok');assert.equal(r.products[1].active,false);assert.equal(existing[1].active,true);
 const duplicate=updateCatalog(existing,[incoming[0],incoming[0]],validate);assert.equal(duplicate.errors.length,2);assert.equal(duplicate.products[0].name,'Antigo');assert.equal(duplicate.products[1].active,true);
 const partial=updateCatalog(existing,[{...incoming[0],barcode:'erro'},incoming[1]],validate);assert.equal(partial.errors.length,1);assert.equal(partial.errors[0].code,'1');assert.equal(partial.errors[0].barcode,'erro');assert.equal(partial.created,1);assert.equal(partial.products[0].name,'Antigo');assert.equal(partial.products[1].active,true);assert.equal(partial.inactivationSkipped,true);
 assert.deepEqual(partial.lists.created,[{code:3,name:'C',barcode:'7897190280182'}]);assert.deepEqual(r.lists.updated,[{code:1,name:'Novo',barcode:'7897190280175'}]);assert.deepEqual(r.lists.inactivated,[{code:2,name:'B',barcode:'7897190280168'}]);
 const badDuplicate=updateCatalog(existing,[{...incoming[0],barcode:'erro'},incoming[0],incoming[1]],validate);assert.equal(badDuplicate.errors.filter(e=>e.code==='1').length,3);assert.equal(badDuplicate.products[0].name,'Antigo');assert.equal(badDuplicate.created,1);
});
test('autentica no ambiente escolhido e executa apenas consulta fixa com estágios reais',async()=>{
 const stages=[],calls=[];const fetchFn=async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>calls.length===1?{access_token:'SECRET-TOKEN'}:response([row(1,'A','MARCA','7897190280175',1)])}};
 const data=await synchronize({env:{SANKHYA_AMBIENTE:'sandbox',SANKHYA_CLIENT_ID:'id',SANKHYA_CLIENT_SECRET:'secret',SANKHYA_TOKEN:'token'},fetchFn,onStage:s=>stages.push(s)});
 assert.equal(data.length,1);assert.deepEqual(stages,['autenticando','consultando','validando']);assert.match(calls[0].url,/api\.sandbox\.sankhya\.com\.br\/authenticate/);assert.equal(calls[1].options.headers.Authorization,'Bearer SECRET-TOKEN');assert.equal(JSON.parse(calls[1].options.body).requestBody.sql,SQL);assert.match(SQL,/TGFBAR/);assert.match(SQL,/BAR\.CODVOL = PRO\.CODVOL/);assert.match(SQL,/SELECT DISTINCT/);assert.match(SQL,/EXISTS/);assert.match(SQL,/COUNT\(\*\) OVER/);
 await assert.rejects(()=>synchronize({env:{},fetchFn}),/Credenciais/);await assert.rejects(()=>synchronize({env:{SANKHYA_AMBIENTE:'invalid'},fetchFn}),/Ambiente/);
});
