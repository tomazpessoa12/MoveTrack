/* MoveTrack v1.2.1 — interface de movimentação. */
document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="/movetrack.css">');
const mtIconNames={report:'chart-line',register:'boxes-stacked',pending:'clipboard-list',partial:'box',receive:'truck',catalog:'tags',settings:'gear',camera:'qrcode',check:'circle-check',alert:'triangle-exclamation',image:'image',collapse:'chevron-left',expand:'chevron-right'};
const mtIcon=name=>{const [viewBox,body]=window.mtFaIcons?.[mtIconNames[name]||name]||window.mtFaIcons['circle-info'];return `<svg viewBox="${viewBox}" fill="currentColor" aria-hidden="true">${body}</svg>`};
const mtCatalog = () => state.products || state.productCatalog || [];
function mtProductCode(item) {
  const explicit=Number(item.productCode);
  if (Number.isSafeInteger(explicit) && explicit>0) return explicit;
  const label=String(item.product||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const matches=mtCatalog().filter(p=>{
    const name=p.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    return name===label || new RegExp(`(^|\\D)${p.code}(\\D|$)`).test(label);
  });
  return matches.length===1?matches[0].code:null;
}
function mtProductImage(item) {
  const code=mtProductCode(item);
  return code?`<span class="mt-product-image"><img src="https://nnpessoa.agilecdn.com.br/${code}.jpg" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span hidden aria-label="Imagem indisponível">${mtIcon('image')}</span></span>`:`<span class="mt-product-image mt-image-missing" aria-label="Imagem indisponível">${mtIcon('image')}</span>`;
}
function mtProductDetails(item){
  const same=(state.pallets||[]).concat(state.partials||[]).find(source=>source.product===item.product && source.productCode);
  const code=mtProductCode(item)||(same?mtProductCode(same):null);
  const known=mtCatalog().find(product=>product.code===code);
  const name=known?.name||String(item.product||'').replace(code?new RegExp(`^\\s*${code}\\s*[-·:]?\\s+`):/^$/, '');
  return {code,name};
}
function mtSummaryCard(item){
  const {code,name}=mtProductDetails(item);
  return `<div class="line-product" style="--line:${productLine(name).color}"><strong>${esc(name)}</strong><small>Cód: ${code??'—'} - ${fmt(item.quantity)} unidades</small></div>`;
}
function mtSummaryProducts(items,report=false){
  const sorted=[...items].sort((a,b)=>mtProductDetails(a).name.localeCompare(mtProductDetails(b).name,'pt-BR'));
  const columns=[];for(let i=0;i<sorted.length;i+=2)columns.push(sorted.slice(i,i+2));
  return `<div class="product-scroll mt-summary-products ${report?'report-products':''}" data-item-count="${sorted.length}">${columns.map(column=>`<div class="product-column">${column.map(mtSummaryCard).join('')}</div>`).join('')||'<span class="small">Nenhum item no período.</span>'}</div>`;
}
// Poucos itens usam uma linha; resumos maiores preservam duas linhas por coluna.
function mtSummaryRowCount(count,width,gap=10,cardWidth=210){
  const capacity=Math.max(1,Math.floor((width+gap)/(cardWidth+gap)));
  return count<=capacity?1:2;
}
function mtArrangeSummary(element){
  const style=getComputedStyle(element);
  const width=element.clientWidth-parseFloat(style.paddingLeft||0)-parseFloat(style.paddingRight||0);
  const rows=mtSummaryRowCount(Number(element.dataset.itemCount||0),width,parseFloat(style.columnGap)||10,210);
  element.classList.toggle('mt-summary-single-row',rows===1);
}
const mtSummaryWatched=new Set();
const mtSummaryResize=typeof ResizeObserver==='function'?new ResizeObserver(entries=>entries.forEach(entry=>mtArrangeSummary(entry.target))):null;
function mtWatchSummaries(){
  for(const element of mtSummaryWatched){if(!element.isConnected){mtSummaryResize?.unobserve(element);mtSummaryWatched.delete(element)}}
  document.querySelectorAll('.mt-summary-products').forEach(element=>{
    if(mtSummaryWatched.has(element))return;
    mtSummaryWatched.add(element);mtArrangeSummary(element);mtSummaryResize?.observe(element);
  });
}
window.addEventListener('resize',()=>document.querySelectorAll('.mt-summary-products').forEach(mtArrangeSummary));
cards=function(){const s=state.summary;return `<section class="movement-summary"><div class="movement-title">AGUARDANDO TRANSFERÊNCIA</div><div class="movement-counts"><div class="movement-count"><strong>${s.pallets}</strong><span>PALLETS</span></div><div class="movement-count"><strong>${s.partials}</strong><span>AVULSOS</span></div></div><h3 class="mt-summary-title">Resumo de itens</h3>${mtSummaryProducts(s.products)}</section>`};
let mtToastTimer;
function mtToast(message,error=false) {
  clearTimeout(mtToastTimer);
  document.querySelector('.mt-toast')?.remove();
  const element=document.createElement('div');element.className=`mt-toast ${error?'mt-toast-error':'mt-toast-success'}`;
  element.setAttribute('role',error?'alert':'status');
  element.innerHTML=`<span class="mt-toast-icon">${mtIcon(error?'alert':'check')}</span><span>${esc(message)}</span><button type="button" aria-label="Fechar aviso">${mtIcon('xmark')}</button>`;
  let closing=false;
  const close=()=>{
    if(closing)return;closing=true;
    clearTimeout(mtToastTimer);
    const remove=()=>element.remove();
    element.addEventListener('animationend',event=>{
      if(event.target===element && event.animationName==='mt-toast-out')remove();
    });
    element.classList.add('mt-toast-leaving');
    setTimeout(remove,650);
  };
  document.body.append(element);element.querySelector('button').onclick=close;
  mtToastTimer=setTimeout(close,3000);
}
msg=function(message,error=false){mtToast(message,error)};
const mtOriginalLayout=layout;
layout=function(title,content){
  const feedback=state.feedback;
  mtOriginalLayout(title,content);
  const shell=app.querySelector('.shell'),brand=shell?.querySelector('.brand-wrap');
  if(brand)brand.innerHTML=`<img class="mt-header-logo" src="/movetrack-logo.svg" alt="MoveTrack™"><span class="mt-header-area area-label">${route==='/admin'?'ADMIN':route==='/logistica'?'LOGÍSTICA':'PRODUÇÃO'}</span>`;
  const top=shell?.querySelector('.top'),right=document.createElement('div');right.className='mt-header-right';
  right.innerHTML='<img class="mt-melodia" src="/melodia-logo.png" alt="Melodia Pet">';
  const logout=top?.querySelector('#admin-logout');if(logout)right.append(logout);
  top?.append(right);
  shell?.querySelector('#message')?.replaceChildren();
  const footer=document.querySelector('.app-version');if(footer)footer.textContent=`MoveTrack · Melodia Pet · ${SYSTEM_VERSION}`;
  if(feedback)mtToast(feedback.text,!!feedback.error);
};
const mtOriginalTable=table;
const mtOpNumber=value=>String(value??'').trim().replace(/^OP(?:[-\s#:]*|$)/i,'');
opLabel=value=>esc(mtOpNumber(value));
table=function(items,cancel=false){
  const output=mtOriginalTable(items,cancel);
  const container=document.createElement('template');container.innerHTML=output;
  if(cancel)container.content.querySelector('table')?.classList.add('mt-pending-table');
  container.content.querySelectorAll('tbody tr').forEach((row,index)=>{
    const item=items[index],cell=row.querySelector('td');
    if(item&&cell){
      const details=mtProductDetails(item);
      cell.innerHTML=`<span class="mt-pallet-product">${mtProductImage({...item,productCode:details.code})}<span class="mt-pallet-copy"><strong>${esc(details.name)}</strong><small>Cód: ${details.code??'—'}</small></span></span>`;
      const opCell=row.querySelectorAll('td')[1];if(opCell)opCell.textContent=mtOpNumber(item.op);
    }
  });
  return container.innerHTML;
};
function mtDecorateBatch(){
  const list=app.querySelector('.card.span-7 .scanlist');
  if(!list)return;
  const chosen=(state.batch||[]).map(id=>state.pallets?.find(p=>p.id===id&&p.status==='PRONTO')).filter(Boolean);
  list.querySelectorAll(':scope > li').forEach((row,index)=>{if(chosen[index]&&!row.querySelector('.mt-product-image'))row.insertAdjacentHTML('afterbegin',mtProductImage(chosen[index]))});
}
const mtProduction=production,mtLogistics=logistics;
production=function(){mtProduction();mtEnhancePublic()};
logistics=function(){mtLogistics();mtEnhancePublic();mtDecorateBatch()};
function mtEnhancePublic(){app.querySelectorAll('button.camera').forEach(button=>button.classList.add('mt-camera-button'))}
const mtBaseBindPublic=bindPublic;
bindPublic=function(){
  mtBaseBindPublic();
  document.querySelectorAll('.cancel').forEach(button=>button.onclick=async()=>{
    try{
      await api('/public/cancel',{method:'POST',body:JSON.stringify({id:button.dataset.id})});
      state.feedback={text:'Palete cancelado com sucesso.'};load();
    }catch(error){msg(error.message,true)}
  });
};

function mtButtonIconName(button){
  const id=button.id||'',label=(button.getAttribute('aria-label')||button.textContent||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  if(id==='toggle-password')return label.includes('ocultar')?'eye':'eye-slash';
  if(id==='apply')return 'filter';if(id==='pdf')return 'file-pdf';if(id==='csv')return 'file-csv';
  if(id==='clear')return 'trash';if(id==='test')return 'paper-plane';
  if(button.classList.contains('receipt-row'))return button.getAttribute('aria-expanded')==='true'?'chevron-down':'chevron-right';
  if(button.classList.contains('camera')||/qr code/.test(label))return 'qrcode';
  if(/camera/.test(label))return 'camera';
  if(/senha/.test(label))return 'eye';
  if(/sair|entrar/.test(label))return 'right-from-bracket';
  if(/relatorio/.test(label))return 'chart-line';
  if(/pdf/.test(label))return 'file-pdf';if(/csv/.test(label))return 'file-csv';
  if(/salvar/.test(label))return 'floppy-disk';if(/importar|baixar|exportar/.test(label))return 'download';
  if(/editar/.test(label))return 'pen';if(/remover|retirar|cancelar|excluir|fechar/.test(label))return 'xmark';
  if(/devolver|voltar/.test(label))return 'arrow-rotate-left';if(/limpar/.test(label))return 'trash';
  if(/enviar|teste/.test(label))return 'paper-plane';if(/trocar/.test(label))return 'arrows-rotate';
  if(/zoom|buscar|pesquisar/.test(label))return 'magnifying-glass';
  if(/orden|filtr|aplicar/.test(label))return 'filter';
  if(/pendente/.test(label))return 'clipboard-list';
  if(/avulso/.test(label))return 'box';if(/registrar.*(?:palete|pallet)/.test(label))return 'boxes-stacked';if(/palete|pallet/.test(label))return 'boxes-stacked';
  if(/transferencia|receber/.test(label))return 'truck';
  if(/adicionar|novo|registrar|incluir/.test(label))return 'plus';
  if(/confirmar|continuar/.test(label))return 'check';
  if(/configurac/.test(label))return 'gear';
  return 'circle-info';
}
function mtEnhanceButtons(root=document){
  const buttons=root.querySelectorAll?.('button')||[];
  buttons.forEach(button=>{
    if(button.matches('.mt-menu-item,#mt-collapse,.mt-mobile-menu,.mt-toast button,.receipt-row'))return;
    if(button.querySelector('.mt-button-icon'))return;
    if(button.id==='toggle-password')button.replaceChildren();
    else if(button.querySelector('svg'))return;
    const icon=document.createElement('span');icon.className='mt-button-icon';icon.innerHTML=mtIcon(mtButtonIconName(button));
    button.prepend(icon);button.classList.add('mt-iconized');
  });
}
new MutationObserver(()=>{mtEnhanceButtons();mtWatchSummaries()}).observe(document.body,{childList:true,subtree:true});

const mtNativeFetch=window.fetch.bind(window);
let mtBusyCount=0,mtBusyDelay;
window.fetch=async function(resource,options={}){
  const method=(options.method||'GET').toUpperCase();
  const busy=String(resource).startsWith('/api/')&&method!=='GET';
  const active=document.activeElement;
  if(busy){
    mtBusyCount++;
    if(active?.tagName==='BUTTON')active.disabled=true;
    clearTimeout(mtBusyDelay);
    mtBusyDelay=setTimeout(()=>{
      if(mtBusyCount&&!document.querySelector('.mt-busy')){
        const panel=document.createElement('div');panel.className='mt-busy';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
        panel.innerHTML='<div><span class="mt-stack-loader" aria-hidden="true"><img class="mt-loader-pallet" src="/assets/loader-pallet.webp" alt=""><img class="mt-loader-box mt-loader-box-base-back" src="/assets/loader-box.webp" alt=""><img class="mt-loader-box mt-loader-box-base-left" src="/assets/loader-box.webp" alt=""><img class="mt-loader-box mt-loader-box-base-right" src="/assets/loader-box.webp" alt=""><img class="mt-loader-box mt-loader-box-base-front" src="/assets/loader-box.webp" alt=""><img class="mt-loader-box mt-loader-box-top-back" src="/assets/loader-box.webp" alt=""><img class="mt-loader-box mt-loader-box-one" src="/assets/loader-box.webp" alt=""><img class="mt-loader-box mt-loader-box-two" src="/assets/loader-box.webp" alt=""><img class="mt-loader-box mt-loader-box-three" src="/assets/loader-box.webp" alt=""></span><strong>Processando...</strong><small>Aguarde a confirmação da operação.</small></div>';
        document.body.append(panel);
      }
    },160);
  }
  try{return await mtNativeFetch(resource,options)}finally{
    if(busy){mtBusyCount--;if(active?.tagName==='BUTTON')active.disabled=false;if(!mtBusyCount){clearTimeout(mtBusyDelay);document.querySelector('.mt-busy')?.remove()}}
  }
};

const mtOldLogin=adminLogin;
adminLogin=function(){
  state.adminView='relatorio';
  mtOldLogin();
  const shell=app.querySelector('.shell'),panel=app.querySelector('.login');if(!panel)return;
  shell.classList.add('mt-login-page');
  const hero=document.createElement('section');hero.className='mt-login-hero';
  hero.innerHTML=`<div class="mt-hero-top"><img class="mt-hero-logo" src="/movetrack-logo-light.svg" alt="MoveTrack™"><img class="mt-hero-melodia" src="/melodia-logo.png" alt="Melodia Pet"></div><div class="mt-hero-copy"><h1>Seu fluxo em<br><em>boas mãos.</em></h1><p>Do palete pronto ao recebimento: clareza em cada etapa.</p></div><div class="mt-dock-scene" aria-hidden="true"><canvas class="mt-dock-canvas" width="1774" height="887"></canvas></div><div class="mt-hero-bottom">© 2026 Melodia Pet · Todos os direitos reservados.</div>`;
  panel.querySelector('h1').textContent='Acessar MoveTrack';
  panel.querySelector('p.small').textContent='Entre com a senha administrativa para acompanhar a operação.';
  const wrapper=document.createElement('div');wrapper.className='mt-login-grid';panel.parentElement.insertBefore(wrapper,panel);wrapper.append(hero,panel);
  const input=panel.querySelector('[name=password]');input?.setAttribute('autocomplete','current-password');
  mtStartDockScene(hero.querySelector('.mt-dock-canvas'));
};

const mtReleaseNotes=[
  {version:'1.2.1',improvements:[
    'Abas operacionais padronizadas como Paletes e Avulsos, com ícones distintos.',
    'Resumo preenche uma única linha quando os itens cabem na largura disponível; demais itens mantêm duas linhas por coluna.',
    'Texto e descrição da cor padrão organizados ao lado do seletor.',
    'Resumos e pendentes com nome destacado e código do produto; ícone instalado com a borda neon aprovada.'
  ],fixes:[
    'Recebimentos com numeração à esquerda, assinatura junto às informações e uma única seta à direita.',
    'Recebimentos com cores aprovadas na prévia e número em destaque separado; alinhamento preservado.'
  ]},
  {version:'1.2.0',improvements:[
    'Nova identidade MoveTrack™, menu lateral por área e ícones Font Awesome Free.',
    'Login com ciclo contínuo na doca: ré de 7 segundos, palete em camadas e partida imediata após carregar.',
    'Catálogo local com importação, edição por ícone, exclusão pela seleção e contador dos produtos exibidos.',
    'Fotos nos paletes, feedback destacado, confirmações e loading de caixas sendo empilhadas no palete.',
    'Relatório com filtros em 17% mês, 17% tipo e 21% ordenação; botões em 45%.'
  ],fixes:[
    'Seletor de mês abre com um clique e mantém a seta alinhada aos demais filtros.',
    'Espaçamento dos filtros, alinhamento dos dias do Discord e ordenação do changelog corrigidos.',
    'Palete cancelado pode ser registrado novamente com o mesmo QR, preservando o histórico.',
    'Cancelamento sem motivo obrigatório, OP sem prefixo repetido e feedback sem duplicidade.',
    'Avisos fecham após 3 segundos com fade subindo; olho da senha e colunas de pendentes alinhados.'
  ]},
  {version:'1.1.9',improvements:[
    'Relatório ordenável por data, paletes e unidades, com data decrescente como padrão.',
    'Filtros com campos e setas uniformes.'
  ],fixes:['Seletor de tipo fecha ao clicar fora.','Ícone da senha acompanha o estado de visualização.']},
  {version:'1.1.8',improvements:[
    'Filtros e ações do relatório lado a lado em telas maiores.',
    'Ordenação com sentido da data e controle de visualização integrado ao campo de senha.'
  ],fixes:['Rótulo e checkboxes do filtro de tipo seguem o padrão visual do sistema.']}
];
function mtRenderChangelog(){
  const grid=app.querySelector('.changelog-grid');if(!grid)return;
  const compare=(a,b)=>{const av=a.version.split('.').map(Number),bv=b.version.split('.').map(Number);for(let i=0;i<3;i++){const delta=bv[i]-av[i];if(delta)return delta}return 0};
  const notes=[...mtReleaseNotes].sort(compare).slice(0,3);
  grid.innerHTML=notes.map((note,index)=>`<article><h4>v${esc(note.version)}${index===0?' <span>Atual</span>':''}</h4><b>Melhorias</b><ul>${note.improvements.map(text=>`<li>${esc(text)}</li>`).join('')}</ul><b>Correções de bugs</b><ul>${note.fixes.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></article>`).join('');
}
const mtAdmin=admin;
admin=function(){
  if(state.adminView==='catalogo'){
    state.adminView='relatorio';mtAdmin();state.adminView='catalogo';
    const card=app.querySelector('.shell > .card');if(card)card.outerHTML=mtCatalogView();
    mtWireCatalog();
  }else mtAdmin();
  mtSidebar();mtEnhancePublic();mtDecorateBatch();
  mtRenderChangelog();
};
const mtMenu=[['Administração',[['relatorio','Relatório','report'],['catalogo','Catálogo de produtos','catalog'],['configuracoes','Configurações','settings']]],['Produção',[['registrar','Registrar palete','register'],['pendentes','Pendentes','pending'],['avulso','Avulsos','partial']]],['Logística',[['receber','Receber transferências','receive']]]];
function mtSidebar(){
  const shell=app.querySelector('.shell'),nav=shell?.querySelector('.admin-nav');if(!nav)return;
  const page=document.createElement('div');page.className='mt-admin-layout';
  const aside=document.createElement('aside');aside.className='mt-sidebar';aside.id='mt-sidebar';
  aside.innerHTML=`<div class="mt-sidebar-head"><strong>Menu</strong><button type="button" id="mt-collapse" aria-label="Recolher menu" title="Recolher menu">${mtIcon('collapse')}${mtIcon('expand')}</button></div>${mtMenu.map(([group,items])=>`<div class="mt-menu-group mt-group-${group==='Produção'?'production':group==='Logística'?'logistics':'admin'}"><h3>${group}</h3>${items.map(([id,label,icon])=>`<button type="button" class="mt-menu-item ${state.adminView===id?'active':''} mt-menu-${group==='Produção'?'production':group==='Logística'?'logistics':'admin'}" data-mt-view="${id}" title="${label}" aria-current="${state.adminView===id?'page':'false'}">${mtIcon(icon)}<span>${label}</span></button>`).join('')}</div>`).join('')}`;
  const main=document.createElement('div');main.className='mt-admin-content';
  while(nav.nextSibling)main.append(nav.nextSibling);
  nav.replaceWith(page);page.append(aside,main);
  if(localStorage.getItem('mt-menu-collapsed')==='1')page.classList.add('mt-collapsed');
  const collapse=aside.querySelector('#mt-collapse');
  const syncToggle=()=>{const name=page.classList.contains('mt-collapsed')?'Expandir menu':'Recolher menu';collapse.setAttribute('aria-label',name);collapse.title=name;collapse.setAttribute('aria-expanded',String(!page.classList.contains('mt-collapsed')))};
  collapse.onclick=()=>{page.classList.toggle('mt-collapsed');localStorage.setItem('mt-menu-collapsed',page.classList.contains('mt-collapsed')?'1':'0');syncToggle()};syncToggle();
  aside.querySelectorAll('[data-mt-view]').forEach(button=>button.onclick=()=>{state.adminView=button.dataset.mtView;admin()});
  const top=shell.querySelector('.top');const mobile=document.createElement('button');mobile.className='mt-mobile-menu';mobile.type='button';mobile.innerHTML=`${mtIcon('bars')}<span>Menu</span>`;mobile.setAttribute('aria-controls','mt-sidebar');mobile.onclick=()=>page.classList.toggle('mt-mobile-open');top.insertBefore(mobile,top.querySelector('.mt-header-right'));
}
function mtCatalogView(){
  return `<section class="card mt-catalog"><div class="mt-catalog-head"><h2>Catálogo de produtos</h2><div class="mt-catalog-actions"><button type="button" id="mt-new" class="mt-catalog-add">Adicionar produto</button><button type="button" id="mt-import" class="mt-catalog-import">Importar cadastro</button></div></div><div class="mt-catalog-controls"><label>Buscar por nome, código ou código de barras<input id="mt-search" type="search" placeholder="Digite para pesquisar" value="${esc(state.catalogSearch||'')}"></label><label>Ordenar por<select id="mt-sort"><option value="name">Nome</option><option value="code">Código</option><option value="brand">Marca</option></select></label></div><div class="mt-catalog-selection"><label><input id="mt-select-visible" type="checkbox"> Selecionar itens exibidos</label><div class="mt-catalog-selection-actions"><span id="mt-product-count" class="mt-product-count" role="status" aria-live="polite"></span><button type="button" id="mt-delete-selected" class="danger" disabled>Excluir selecionados (0)</button></div></div><div class="mt-product-list" id="mt-products"></div></section>`;
}
async function mtDeleteProducts(codes){
  if(!codes.length)return;
  try{
    const result=await api('/admin/products',{method:'DELETE',body:JSON.stringify({codes})});
    const selected=state.catalogSelected||new Set();codes.forEach(code=>selected.delete(code));
    state.feedback={text:`${result.deleted} produto${result.deleted===1?'':'s'} excluído${result.deleted===1?'':'s'} do catálogo.`};
    await load();
  }catch(error){msg(error.message,true)}
}
function mtRenderCatalog(){
  const query=(state.catalogSearch||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const sort=state.catalogSort||'name';
  const rows=[...(state.products||[])].filter(item=>[item.name,item.code,item.barcode,item.brand].some(value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query))).sort((a,b)=>sort==='code'?a.code-b.code:String(a[sort]).localeCompare(String(b[sort]),'pt-BR',{numeric:true}));
  const list=document.querySelector('#mt-products');if(!list)return;
  const counter=document.querySelector('#mt-product-count');if(counter)counter.textContent=`${rows.length} produto${rows.length===1?'':'s'}${query?' encontrado'+(rows.length===1?'':'s'):''}`;
  const selected=state.catalogSelected||(state.catalogSelected=new Set());
  list.innerHTML=rows.map(item=>`<article class="mt-product-row"><input class="mt-product-select" type="checkbox" value="${item.code}" aria-label="Selecionar ${esc(item.name)}" ${selected.has(item.code)?'checked':''}>${mtProductImage({productCode:item.code,product:item.name})}<div class="mt-product-info"><strong>${esc(item.name)}</strong><span>${esc(item.brand)} · Cód. ${item.code} · EAN ${esc(item.barcode)}</span></div><button type="button" class="secondary mt-edit mt-iconized" data-code="${item.code}" aria-label="Editar ${esc(item.name)}" title="Editar produto">${mtIcon('pen')}</button></article>`).join('')||'<p class="small">Nenhum produto encontrado.</p>';
  list.querySelectorAll('.mt-edit').forEach(button=>button.onclick=()=>mtProductModal((state.products||[]).find(p=>p.code===Number(button.dataset.code))));
  const selectAll=document.querySelector('#mt-select-visible'),deleteButton=document.querySelector('#mt-delete-selected');
  const refresh=()=>{deleteButton.disabled=!selected.size;deleteButton.textContent=`Excluir selecionados (${selected.size})`;selectAll.checked=!!rows.length&&rows.every(row=>selected.has(row.code));selectAll.indeterminate=rows.some(row=>selected.has(row.code))&&!selectAll.checked};
  list.querySelectorAll('.mt-product-select').forEach(box=>box.onchange=()=>{const code=Number(box.value);box.checked?selected.add(code):selected.delete(code);refresh()});
  selectAll.onchange=()=>{rows.forEach(row=>selectAll.checked?selected.add(row.code):selected.delete(row.code));mtRenderCatalog()};
  refresh();
}
function mtWireCatalog(){
  document.querySelector('#mt-search').oninput=event=>{state.catalogSearch=event.target.value;mtRenderCatalog()};
  document.querySelector('#mt-sort').value=state.catalogSort||'name';
  document.querySelector('#mt-sort').onchange=event=>{state.catalogSort=event.target.value;mtRenderCatalog()};
  document.querySelector('#mt-new').onclick=()=>mtProductModal();
  document.querySelector('#mt-import').onclick=mtImportModal;
  document.querySelector('#mt-delete-selected').onclick=()=>mtDeleteProducts([...(state.catalogSelected||[])]);
  mtRenderCatalog();
}
function mtModal(inner){
  const overlay=document.createElement('div');overlay.className='modal mt-modal';
  overlay.innerHTML=`<div class="modal-card" role="dialog" aria-modal="true">${inner}</div>`;document.body.append(overlay);
  overlay.addEventListener('click',event=>{if(event.target===overlay)overlay.remove()});
  overlay.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>overlay.remove());
  return overlay;
}
function mtConfirmAction(message){
  return new Promise(resolve=>{
    const overlay=mtModal(`<h2>Confirmar ação</h2><p>${esc(message)}</p><div class="actions"><button type="button" class="danger mt-confirm-yes">Confirmar</button><button type="button" class="secondary mt-confirm-no">Voltar</button></div>`);
    const finish=value=>{overlay.remove();resolve(value)};
    overlay.querySelector('.mt-confirm-yes').onclick=()=>finish(true);
    overlay.querySelector('.mt-confirm-no').onclick=()=>finish(false);
    overlay.addEventListener('click',event=>{if(event.target===overlay)finish(false)});
    overlay.addEventListener('keydown',event=>{if(event.key==='Escape')finish(false)});
    overlay.querySelector('.mt-confirm-no').focus();
  });
}
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('button.cancel,button.remove,button.av-remove,button.admin-av-remove,button.partial-remove,button.return-partial,button.mt-delete,button#mt-delete-selected,button.line-remove');
  if(!button||button.disabled)return;
  if(button.dataset.mtConfirmed==='1'){delete button.dataset.mtConfirmed;return}
  event.preventDefault();event.stopImmediatePropagation();
  const message=button.matches('.cancel')?'Cancelar este palete pendente? O QR poderá ser registrado novamente.':
    button.matches('.mt-delete,#mt-delete-selected')?'Excluir o produto ou os produtos selecionados do catálogo? Os paletes já registrados permanecem no histórico.':
    button.matches('.line-remove')?'Remover esta linha de produto das configurações?':
    button.matches('.return-partial')?'Devolver unidades avulsas ao palete de origem?':
    'Remover este item do recebimento em andamento?';
  if(await mtConfirmAction(message)){button.dataset.mtConfirmed='1';button.click()}
},true);
function mtProductModal(product){
  const overlay=mtModal(`<h2>${product?'Editar produto':'Novo produto'}</h2><form id="mt-product-form" class="form"><label>Código do produto<input name="code" type="number" min="1" required value="${product?.code||''}"></label><label>Nome do produto<input name="name" required maxlength="180" value="${esc(product?.name||'')}"></label><label>Marca<input name="brand" required maxlength="80" value="${esc(product?.brand||'')}"></label><label>Código de barras (EAN-13)<input name="barcode" required inputmode="numeric" pattern="[0-9]{13}" maxlength="13" value="${esc(product?.barcode||'')}"></label><label class="mt-inline-check"><input name="active" type="checkbox" ${product?.active===false?'':'checked'}> Ativo</label><p class="small">A foto será buscada em CODIGO.jpg pelo código do produto.</p><div class="actions"><button>Salvar produto</button><button type="button" class="secondary" data-close>Cancelar</button></div></form>`);
  overlay.querySelector('form').onsubmit=async event=>{event.preventDefault();const form=new FormData(event.target);try{await api('/admin/products',{method:'POST',body:JSON.stringify({originalCode:product?.code,code:Number(form.get('code')),name:form.get('name'),brand:form.get('brand'),barcode:form.get('barcode'),active:form.has('active')})});overlay.remove();state.feedback={text:'Produto salvo no catálogo.'};await load()}catch(error){msg(error.message,true)}};
}
const MT_SQL=`SELECT PRO.CODPROD, OBTEM_NOME_LIMPO(PRO.CODPROD) AS DESCRICAO, PRO.MARCA, BAR.CODBARRA
FROM TGFPRO PRO
JOIN TGFMAR MAR ON MAR.DESCRICAO = PRO.MARCA
JOIN TGFBAR BAR ON BAR.CODPROD = PRO.CODPROD AND BAR.CODVOL = PRO.CODVOL
WHERE PRO.ATIVO = 'S'
AND MAR.AD_SEGMENTO = 'MELODIAPET'`;
function mtParseCSV(text){
  const first=text.replace(/^\uFEFF/,'').split(/\r?\n/)[0];
  const delimiter=[';',',','\t'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
  const rows=[];let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const char=text[i];
    if(char==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else quoted=!quoted}
    else if(char===delimiter&&!quoted){row.push(field);field=''}
    else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(cell=>cell.trim()))rows.push(row);row=[];field=''}
    else field+=char;
  }
  if(quoted)throw Error('CSV com aspas não fechadas.');row.push(field);if(row.some(cell=>cell.trim()))rows.push(row);
  const headers=(rows.shift()||[]).map(cell=>cell.replace(/^\uFEFF/,'').trim().toUpperCase());
  const indexes=['CODPROD','DESCRICAO','MARCA','CODBARRA'].map(name=>headers.indexOf(name));
  if(indexes.some(index=>index<0))throw Error('O CSV precisa das colunas CODPROD, DESCRICAO, MARCA e CODBARRA.');
  return rows.map((cells,index)=>{
    if(cells.length!==headers.length)throw Error(`A linha ${index+2} tem um número diferente de colunas.`);
    return {code:cells[indexes[0]].trim(),name:cells[indexes[1]].trim(),brand:cells[indexes[2]].trim(),barcode:cells[indexes[3]].trim()};
  });
}
function mtImportModal(){
  const overlay=mtModal(`<h2>Importar cadastro</h2><p>Execute a consulta no SQL Developer do Sankhya, exporte o resultado em CSV com cabeçalhos e selecione o arquivo abaixo. Os produtos existentes são atualizados pelo código; os demais são adicionados. Nenhum produto é removido.</p><pre class="mt-sql"><code>${esc(MT_SQL)}</code></pre><label>Arquivo CSV<input id="mt-csv" type="file" accept=".csv,text/csv,text/plain"></label><p id="mt-import-preview" class="small">Aguardando arquivo.</p><div class="actions"><button type="button" id="mt-import-confirm" disabled>Importar produtos</button><button type="button" class="secondary" data-close>Cancelar</button></div>`);
  const file=overlay.querySelector('#mt-csv'),confirm=overlay.querySelector('#mt-import-confirm'),preview=overlay.querySelector('#mt-import-preview');let rows=[];
  file.onchange=async()=>{try{rows=mtParseCSV(await file.files[0].text());if(!rows.length)throw Error('Arquivo sem produtos.');const existing=new Set((state.products||[]).map(item=>item.code));const additions=rows.filter(row=>!existing.has(Number(row.code))).length;preview.textContent=`${rows.length} produtos no arquivo · ${additions} novos · ${rows.length-additions} para atualizar.`;confirm.disabled=false}catch(error){rows=[];confirm.disabled=true;preview.textContent=error.message;msg(error.message,true)}};
  confirm.onclick=async()=>{try{const result=await api('/admin/products/import',{method:'POST',body:JSON.stringify({rows})});overlay.remove();state.feedback={text:`Cadastro importado: ${result.created} novos e ${result.updated} atualizados.`};await load()}catch(error){msg(error.message,true)}};
}

load();
