const {productDetails}=require('./product-code');
const {physicalCount}=require('./mixed-pallets');
const fmt=value=>Number(value).toLocaleString('pt-BR');
function groupedProducts(data,items){
 const products=new Map();
 for(const item of items){
  const details=productDetails(data,item),key=details.code?'code:'+details.code:'name:'+details.name;
  const product=products.get(key)||{name:details.name,quantity:0};
  product.quantity+=Number(item.quantity||0);products.set(key,product);
 }
 return [...products.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
}
function digestText(data,now=new Date()){
 const pending=(data.pallets||[]).filter(item=>item.status==='PRONTO');
 const singles=pending.filter(item=>!item.mixedPalletId);
 const partials=(data.partials||[]).filter(item=>item.status==='PENDENTE');
 const groups=new Map();
 for(const item of pending){if(!item.mixedPalletId)continue;const group=groups.get(item.mixedPalletId)||[];group.push(item);groups.set(item.mixedPalletId,group)}
 const count=physicalCount(pending);
 const lines=[`**Paletes aguardando transferência — ${new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Recife'}).format(now)}**`,`**Total: ${count} palete${count===1?'':'s'}**`];
 if(singles.length){lines.push('',`**Paletes individuais: ${singles.length}**`);for(const p of groupedProducts(data,singles))lines.push(`- ${p.name}: ${fmt(p.quantity)} unidades`)}
 if(groups.size){lines.push('',`**Paletes mistos: ${groups.size}**`);let n=0;for(const items of groups.values()){
  lines.push(`Palete misto ${++n} — ${fmt(items.reduce((sum,item)=>sum+Number(item.quantity||0),0))} unidades`);
  for(const p of groupedProducts(data,items))lines.push(`  • ${p.name}: ${fmt(p.quantity)} unidades`);
 }}
 if(partials.length){lines.push('',`**Avulsos: ${partials.length}**`);for(const p of groupedProducts(data,partials))lines.push(`- ${p.name}: ${fmt(p.quantity)} unidades`)}
 if(!count&&!partials.length)lines.push('','Nenhum item aguardando transferência.');
 return lines.join('\n');
}
module.exports={digestText};
