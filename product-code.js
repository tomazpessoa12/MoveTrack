// The QR identifier is authoritative; descriptions are never used to identify products.
function positiveCode(value){const code=Number(value);return Number.isSafeInteger(code)&&code>0?code:null}
function identifierCode(value){const match=String(value||'').match(/^([1-9]\d*)-\d{6}-\d{2}:\d{2}:\d{2}-\d+(?:::cancelled::.*)?$/);return match?positiveCode(match[1]):null}
function productCode(item){return identifierCode(item.originalQrId)||identifierCode(item.id)||identifierCode(item.sourcePalletId)||positiveCode(item.productCode??item.codprod)}
function productDetails(data,item){const code=productCode(item),known=(data.products||[]).find(product=>Number(product.code)===code);return{code,name:known?.name||String(item.product||'')}}
function restoreProductCodes(data){let changed=false;for(const item of data.pallets||[]){const code=productCode(item);if(code&&item.productCode!==code){item.productCode=code;changed=true}}for(const item of data.partials||[]){const source=(data.pallets||[]).find(pallet=>pallet.id===item.sourcePalletId),code=productCode(source||{})||productCode(item);if(code&&item.productCode!==code){item.productCode=code;changed=true}}return changed}
module.exports={positiveCode,identifierCode,productCode,productDetails,restoreProductCodes};
