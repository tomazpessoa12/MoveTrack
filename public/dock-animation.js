/* MoveTrack: ciclo aprovado, em segundos, com saída pela porta em camadas. */
function mtDockState(seconds) {
  const t=((seconds%11)+11)%11;
  const ease=value=>{const v=Math.max(0,Math.min(1,value));return v*v*(3-2*v)};
  const mix=(a,b,f)=>a+(b-a)*f;
  let truckX,truckY;
  if(t<7){const f=ease(t/7);truckX=mix(-1150,415,f);truckY=mix(675,215,f)}
  else if(t<7.6){truckX=415;truckY=215}
  else if(t<10.1){const v=(t-7.6)/2.5,f=.15*v+.85*ease(v);truckX=mix(415,-1150,f);truckY=mix(215,675,f)}
  else{truckX=-1150;truckY=675}
  let center,feet;
  if(t<1){center=1456;feet=374}
  else if(t<6){const f=ease((t-1)/5);center=mix(1456,1286,f);feet=mix(374,425,f)}
  else if(t<7){center=1286;feet=425}
  else if(t<7.6){const f=(t-7)/.6;center=mix(1286,1248,f);feet=mix(425,430,f)}
  else{center=1248;feet=430}
  return {truckX,truckY,palletCenter:center,palletFeet:feet,palletVisible:t>=1&&t<7.6,palletInside:center>1336};
}

async function mtStartDockScene(canvas) {
  if(!canvas)return;
  const context=canvas.getContext('2d');if(!context)return;
  const loadImage=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src});
  try{
    const [background,foreground,pallet,truck]=await Promise.all([
      '/assets/dock-background.webp','/assets/dock-foreground-v2.webp',
      '/assets/dock-pallet-v2.webp','/assets/dock-truck-movetrack-v2.webp'
    ].map(loadImage));
    if(!canvas.isConnected)return;
    canvas.width=1774;canvas.height=887;
    const palletWidth=100,palletHeight=pallet.height*palletWidth/pallet.width;
    const draw=seconds=>{
      const state=mtDockState(seconds);
      context.clearRect(0,0,1774,887);
      context.drawImage(background,0,0,1774,887);
      const drawPallet=()=>context.drawImage(pallet,state.palletCenter-palletWidth/2,state.palletFeet-palletHeight,palletWidth,palletHeight);
      if(state.palletVisible&&state.palletInside){drawPallet();context.drawImage(foreground,0,0,1774,887)}
      else{context.drawImage(foreground,0,0,1774,887);if(state.palletVisible)drawPallet()}
      context.drawImage(truck,state.truckX,state.truckY,1774*.60,887*.60);
    };
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){draw(7);return}
    let started;
    const tick=timestamp=>{if(!canvas.isConnected)return;if(started===undefined)started=timestamp;draw((timestamp-started)/1000);requestAnimationFrame(tick)};
    requestAnimationFrame(tick);
  }catch{canvas.hidden=true}
}
