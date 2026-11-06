const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mix,unmix,physicalCount,checkReceipt,requireSeparate}=require('../mixed-pallets');
const {reportGroups}=require('../reports');
const make=(id,code,qty)=>({id,productCode:code,product:'Produto '+code,quantity:qty,status:'PRONTO'});
test('mesclagem mantém registros e saldo, valida situação e pode ser desfeita',()=>{
 const data={pallets:[make('a',10116,1000),make('b',10127,880),make('c',10116,100)]};
 assert.throws(()=>mix(data,['a','a']),/dois/);assert.throws(()=>mix(data,['a','x']),/disponível/);
 const group=mix(data,['a','b']);assert.equal(physicalCount(data.pallets),2);assert.equal(data.pallets[0].quantity,1000);assert.equal(data.pallets[1].quantity,880);
 assert.throws(()=>mix(data,['a','c']),/disponível/);assert.throws(()=>requireSeparate(data.pallets[0]),/Desfaça/);
 assert.throws(()=>checkReceipt(data,['a']),/incompleto/);assert.doesNotThrow(()=>checkReceipt(data,['a','b']));
 unmix(data,group);assert.equal(physicalCount(data.pallets),3);assert.equal(data.pallets[0].mixedPalletId,undefined);
});
test('relatório conta um palete misto e conserva os dois produtos',()=>{
 const pallets=[make('a',10116,1000),make('b',10127,880),make('c',10116,100)];const data={pallets,partials:[],products:[],receipts:[]};mix(data,['a','b']);data.receipts.push({id:'r',receivedAt:'2026-11-06T15:00:00Z',palletIds:['a','b','c']});
 const r=reportGroups(data,{month:'2026-11'});assert.equal(r.totals.pallets,2);assert.equal(r.totals.units,1980);assert.equal(r.groups[0].pallets.length,3);
});
