const PDFDocument=require('pdfkit');
const path=require('path');
const fs=require('fs');
const {productDetails}=require('./product-code');
const VERSION=require('./package.json').version;
const ZONE='America/Recife';
const number=n=>Number(n).toLocaleString('pt-BR');
const stamp=value=>new Intl.DateTimeFormat('pt-BR',{timeZone:ZONE,dateStyle:'short',timeStyle:'medium'}).format(new Date(value));
function receiptMonth(value){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit'}).formatToParts(new Date(value));return `${parts.find(p=>p.type==='year').value}-${parts.find(p=>p.type==='month').value}`}
function monthTitle(month){const [year,m]=month.split('-').map(Number),label=new Intl.DateTimeFormat('pt-BR',{timeZone:ZONE,month:'long'}).format(new Date(Date.UTC(year,m-1,15)));return `${label[0].toUpperCase()+label.slice(1)} de ${year}`}
function reportGroups(data,options){
 const month=String(options.month||'');if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Mês inválido para o relatório.');
 const types=options.types===undefined?['pallet','avulso']:options.types;if(!Array.isArray(types)||types.some(type=>!['pallet','avulso'].includes(type)))throw Error('Tipo de relatório inválido.');
 const order=options.order||'date-asc';if(!['date-asc','date-desc','pallets-asc','pallets-desc','units-asc','units-desc'].includes(order))throw Error('Ordenação inválida.');
 const findItems=(ids,items)=>ids.map(id=>items.find(item=>item.id===id)).filter(Boolean).map(item=>({...item,...productDetails(data,item)}));
 const groups=(data.receipts||[]).filter(receipt=>receiptMonth(receipt.receivedAt)===month).map(receipt=>({...receipt,pallets:types.includes('pallet')?findItems(receipt.palletIds||[],data.pallets||[]):[],partials:types.includes('avulso')?findItems(receipt.partialIds||[],data.partials||[]):[]})).filter(receipt=>receipt.pallets.length+receipt.partials.length);
 const units=receipt=>[...receipt.pallets,...receipt.partials].reduce((n,item)=>n+Number(item.quantity||0),0);
 const [key,direction]=order.split('-'),sign=direction==='desc'?-1:1;
 groups.sort((a,b)=>{const av=key==='date'?new Date(a.receivedAt).getTime():key==='pallets'?a.pallets.length:units(a),bv=key==='date'?new Date(b.receivedAt).getTime():key==='pallets'?b.pallets.length:units(b);return sign*(av-bv)||new Date(a.receivedAt)-new Date(b.receivedAt)||String(a.id).localeCompare(String(b.id))});
 return{month,groups,totals:{receipts:groups.length,pallets:groups.reduce((n,g)=>n+g.pallets.length,0),partials:groups.reduce((n,g)=>n+g.partials.length,0),units:groups.reduce((n,g)=>n+units(g),0)},units};
}
function monthlyPdf(data,options={}){
 const report=reportGroups(data,options),generatedAt=options.generatedAt||new Date();
 return new Promise((resolve,reject)=>{
  const doc=new PDFDocument({size:'A4',margins:{top:42,left:42,right:42,bottom:56},bufferPages:true,info:{Title:`Relatório Mensal - ${monthTitle(report.month)}`,Author:'Melodia Pet - MoveTrack',Creator:`MoveTrack v${VERSION}`}}),chunks=[];
  doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
  try{
   const left=42,width=doc.page.width-84,right=left+width,bottom=doc.page.height-60,ink='#001834',muted='#61758d';let y=42;
   const font=(size,bold=false,color=ink)=>doc.font(bold?'Helvetica-Bold':'Helvetica').fontSize(size).fillColor(color);
   const text=(value,x,top,w,size=9,bold=false,color=ink)=>{font(size,bold,color);doc.text(String(value),x,top,{width:w,lineGap:2,align:'left',characterSpacing:0,wordSpacing:0})};
   const line=top=>doc.save().strokeColor('#d7e0e9').lineWidth(.6).moveTo(left,top).lineTo(right,top).stroke().restore();
   const title=`Relatório Mensal - ${monthTitle(report.month)}`;
   const nextPage=()=>{doc.addPage();y=42;text(title,left,y,width,10,true);line(y+22);y+=36};
   const logo=options.logoPath||path.join(__dirname,'public','melodia-logo.png');
   if(fs.existsSync(logo))doc.image(logo,left,y,{fit:[105,44],align:'left',valign:'center'});
   text(title,left+124,y+2,width-124,17,true);text(`Gerado em ${stamp(generatedAt)} · v${VERSION}`,left+124,y+42,width-124,8,false,muted);y+=74;
   const metrics=[[report.totals.receipts,'RECEBIMENTOS'],[report.totals.units,'UNIDADES'],[report.totals.pallets,'PALETES'],[report.totals.partials,'AVULSOS']],gap=8,cardWidth=(width-3*gap)/4;
   metrics.forEach(([value,label],i)=>{const x=left+i*(cardWidth+gap);doc.save().roundedRect(x,y,cardWidth,57,6).lineWidth(.7).strokeColor('#d7e0e9').stroke().restore();font(22,true);doc.text(number(value),x,y+10,{width:cardWidth,align:'center',lineBreak:false});font(8,true,muted);doc.text(label,x,y+39,{width:cardWidth,align:'center',lineBreak:false})});y+=83;
   text('DETALHAMENTO DOS RECEBIMENTOS',left,y,width,11,true);line(y+21);y+=35;
   const wrap=(value,w,size=9)=>{font(size);const result=[];for(const paragraph of String(value).split(/\r?\n/)){let current='';for(const word of paragraph.split(/\s+/).filter(Boolean)){if(doc.widthOfString((current?current+' ':'')+word)<=w){current+=(current?' ':'')+word;continue}if(current){result.push(current);current=''}let part='';for(const char of word){if(part&&doc.widthOfString(part+char)>w){result.push(part);part=''}part+=char}current=part}result.push(current)}return result};
   const listWidth=(width-28-24)/2,xs=[left+28,left+28+(width-28+24)/2];
   const receiptHead=(receipt,index,continued=false)=>{doc.save().roundedRect(left,y,20,20,4).fill(ink).restore();font(9,true,'#ffffff');doc.text(String(index+1),left,y+5,{width:20,align:'center',lineBreak:false});text(`${stamp(receipt.receivedAt)} · ${receipt.pallets.length} paletes · ${number(report.units(receipt))} unidades${continued?' (continuação)':''}`,left+28,y+4,width-28,9,true);y+=32};
   const columnHeads=receipt=>{text(`PALETES (${receipt.pallets.length})`,xs[0],y,listWidth,9,true);text(`AVULSOS (${receipt.partials.length})`,xs[1],y,listWidth,9,true);y+=19};
   for(const [index,receipt] of report.groups.entries()){
    const rows=[receipt.pallets,receipt.partials].map(items=>items.length?[...items].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(item=>({lines:wrap(`${item.name} · ${number(item.quantity)} un.`,listWidth),code:item.code?`Cód: ${item.code}`:''})):[{lines:['Nenhum item.'],code:''}]);
    const rowHeight=row=>row.lines.length*12+(row.code?12:0)+8;
    const rowsHeight=Math.max(...rows.map(items=>items.reduce((n,item)=>n+rowHeight(item),0))),observation=receipt.observation?wrap(receipt.observation,width-28):[];
    const blockHeight=32+19+rowsHeight+(observation.length?22+observation.length*12:0)+17;
    if(y+Math.min(blockHeight,150)>bottom||(blockHeight<bottom-80&&y+blockHeight>bottom))nextPage();
    receiptHead(receipt,index);columnHeads(receipt);
    for(let i=0;i<Math.max(...rows.map(items=>items.length));i++){
     const row=rows.map(items=>items[i]),height=Math.max(...row.map(item=>item?rowHeight(item):0));
     if(y+height>bottom){nextPage();receiptHead(receipt,index,true);columnHeads(receipt)}
     const top=y;row.forEach((item,column)=>{if(!item)return;item.lines.forEach((value,n)=>text(value,xs[column],top+n*12,listWidth,9));if(item.code)text(item.code,xs[column],top+item.lines.length*12,listWidth,8,false,muted)});y=top+height;
    }
    if(observation.length){if(y+40>bottom){nextPage();receiptHead(receipt,index,true)}text('OBSERVAÇÃO',left+28,y+4,width-28,8,true,muted);y+=20;for(const value of observation){if(y+12>bottom){nextPage();receiptHead(receipt,index,true)}text(value,left+28,y,width-28,9);y+=12}}
    y+=8;line(y);y+=16;
   }
   if(!report.groups.length)text('Nenhum recebimento neste mês.',left,y,width,10,false,muted);
   const pages=doc.bufferedPageRange();for(let i=0;i<pages.count;i++){doc.switchToPage(pages.start+i);doc.page.margins.bottom=0;doc.save().strokeColor('#d7e0e9').moveTo(left,doc.page.height-43).lineTo(right,doc.page.height-43).stroke().restore();font(8,false,muted);doc.text(`PÁG ${i+1} DE ${pages.count}`,left,doc.page.height-31,{width,align:'right',lineBreak:false})}
   doc.end();
  }catch(error){doc.destroy(error);reject(error)}
 });
}
module.exports={monthlyPdf,reportGroups,receiptMonth,monthTitle};
