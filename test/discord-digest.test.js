const {test}=require('node:test');
const assert=require('node:assert/strict');
const {digestText}=require('../discord-digest');
const date=new Date('2026-11-09T21:00:00Z');
const pallet=(id,code,name,quantity,mixedPalletId)=>({id,productCode:code,product:name,quantity,mixedPalletId,status:'PRONTO'});
test('separa quantidades de paletes individuais, mistos e avulsos',()=>{
 const data={products:[],pallets:[pallet('a',10116,'CALOPSITA',1100),pallet('b',10116,'CALOPSITA',1100),pallet('c',10127,'PAPAGAIO',880),pallet('d',10127,'PAPAGAIO',880),pallet('e',10129,'PASSARINA',600),pallet('f',11131,'PERIQUITO',40,'m'),pallet('g',11127,'BIOAVIS',40,'m'),pallet('h',11237,'RING NECK',200,'m')],partials:[{id:'av',productCode:10116,product:'CALOPSITA',quantity:15,status:'PENDENTE'},{id:'returned',product:'IGNORADO',quantity:99,status:'DEVOLVIDO'}]};
 const msg=digestText(data,date),[individual,mixedAndPartial]=msg.split('**Paletes mistos: 1**'),[mixed,partial]=mixedAndPartial.split('**Avulsos: 1**');
 assert.match(msg,/09\/11\/2026/);assert.match(msg,/Total: 6 paletes/);
 assert.match(individual,/Paletes individuais: 5/);assert.match(individual,/CALOPSITA: 2\.200 unidades/);assert.match(individual,/PAPAGAIO: 1\.760 unidades/);assert.match(individual,/PASSARINA: 600 unidades/);
 assert.doesNotMatch(individual,/PERIQUITO|BIOAVIS|RING NECK/);
 assert.match(mixed,/Palete misto 1 — 280 unidades/);assert.match(mixed,/PERIQUITO: 40 unidades/);assert.match(mixed,/BIOAVIS: 40 unidades/);assert.match(mixed,/RING NECK: 200 unidades/);
 assert.match(partial,/CALOPSITA: 15 unidades/);assert.doesNotMatch(msg,/IGNORADO/);
});
test('não perde produtos que aparecem em seções distintas e trata somente mistos ou nenhuma pendência',()=>{
 const data={products:[],pallets:[pallet('a',10116,'CALOPSITA',500),pallet('b',10116,'CALOPSITA',100,'m'),pallet('c',10127,'PAPAGAIO',80,'m')],partials:[]};
 const msg=digestText(data,date),[individual,mixed]=msg.split('**Paletes mistos: 1**');assert.match(individual,/CALOPSITA: 500 unidades/);assert.match(mixed,/CALOPSITA: 100 unidades/);assert.doesNotMatch(individual,/CALOPSITA: 600 unidades/);
 data.pallets.shift();assert.doesNotMatch(digestText(data,date),/Paletes individuais/);data.pallets=[];assert.match(digestText(data,date),/Nenhum item aguardando transferência/);
});
