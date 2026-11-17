const {test}=require('node:test');
const assert=require('node:assert/strict');
function identity(response){
 if(String(response?.status)!=='1')throw Error('Login não confirmado');
 const session=response?.responseBody?.jsessionid?.$;
 const value=response?.responseBody?.idusu?.$;
 if(typeof session!=='string'||!session||typeof value!=='string'||!value)throw Error('Resposta incompleta');
 const cleaned=value.trim();
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned))throw Error('Identificador inválido');
 const decoded=Buffer.from(cleaned,'base64').toString('utf8');
 if(!/^(0|[1-9]\d*)$/.test(decoded)||!Number.isSafeInteger(Number(decoded)))throw Error('Identificador inválido');
 return Number(decoded);
}
test('identifica os usuários 0 e 96 sem descartar código zero',()=>{for(const [encoded,expected] of [['MA==',0],['OTY=',96]])assert.equal(identity({status:'1',responseBody:{idusu:{$:encoded},jsessionid:{$:'simulada'}}}),expected)});
test('recusa status de falha ou retorno sem identificador ou sessão',()=>{assert.throws(()=>identity({status:'0'}));assert.throws(()=>identity({status:'1',responseBody:{idusu:{$:'OTY='}}}));assert.throws(()=>identity({status:'1',responseBody:{jsessionid:{$:'simulada'}}}))});
