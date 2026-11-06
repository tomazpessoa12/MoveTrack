const crypto=require('crypto');
function physicalCount(items){return new Set(items.map(p=>p.mixedPalletId?'mixed:'+p.mixedPalletId:'single:'+p.id)).size}
function mix(data,ids){
 if(!Array.isArray(ids)||ids.length<2||ids.length>100||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)throw Error('Selecione ao menos dois paletes diferentes.');
 const items=ids.map(id=>data.pallets.find(p=>p.id===id));
 if(items.some(p=>!p||p.status!=='PRONTO'||p.mixedPalletId))throw Error('Um dos paletes não está disponível. Atualize a tela e tente novamente.');
 const id=crypto.randomUUID();for(const p of items)p.mixedPalletId=id;return id;
}
function unmix(data,id){const items=data.pallets.filter(p=>p.mixedPalletId===id);if(items.length<2||items.some(p=>p.status!=='PRONTO'))throw Error('O palete misto não está disponível para desfazer.');for(const p of items)delete p.mixedPalletId;return items}
function requireSeparate(p){if(p?.mixedPalletId)throw Error('Desfaça a mesclagem do palete antes de alterar este item.');}
function checkReceipt(data,ids){const chosen=new Set(ids);for(const p of data.pallets.filter(p=>chosen.has(p.id)&&p.mixedPalletId)){const group=data.pallets.filter(x=>x.mixedPalletId===p.mixedPalletId);if(group.length<2||group.some(x=>x.status!=='PRONTO'||!chosen.has(x.id)))throw Error('Palete misto incompleto. Leia os QR Codes de todos os produtos deste palete antes de confirmar.')}}
module.exports={physicalCount,mix,unmix,requireSeparate,checkReceipt};
