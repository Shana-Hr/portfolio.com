/* Endless run game v6: badges at 1000/3000/6000 pts, shield, combo, double jump, sound, auto-fit. */
const cv=document.getElementById('g'),c=cv.getContext('2d');
const msg=document.getElementById('msg'),overEl=document.getElementById('over');
const W=480,H=270,GY=220,T=24;
const DPR=Math.min(window.devicePixelRatio||1,3);
cv.width=W*DPR;cv.height=H*DPR;
c.setTransform(DPR,0,0,DPR,0,0);
c.imageSmoothingEnabled=true;

const ACH=[{s:1000,n:'FIRST STEP',img:'images/badge_1.png'},{s:3000,n:'APP BUILDER',img:'images/badge_2.png'},{s:6000,n:'WEB MASTER',img:'images/badge_3.png'}];
const PAL={O:'#3a2d1e',H:'#6b4423',S:'#f1c27d',E:'#3a2d1e',W:'#3ec8c8',P:'#3b4bb5'};
const SPR=["OOOOOOOO","OHHHHHHO","OHHHHHHO","OSSSSSSO","OSESSESO","OSSSSSSO","OSSOOSSO","OOOOOOOO","OWWWWWWO","OWWWWWWO","OSWWWWSO","OSWWWWSO","OWWWWWWO","OPPOOPPO","OPPOOPPO","OOOOOOOO"];
const IMG=p=>{const i=new Image();i.src=p;return i;};
const ok=i=>i.complete&&i.naturalWidth>0;
const BIMG=ACH.map(a=>IMG(a.img));
const A={sky:IMG('images/game/sky.png'),hills:IMG('images/game/hills.png'),trees:IMG('images/game/trees.png'),grass:IMG('images/game/grass.png'),dirt:IMG('images/game/dirt.png'),coin:IMG('images/game/coin.png'),cactus:IMG('images/game/cactus.png'),block:IMG('images/game/block.png'),bird:IMG('images/game/bird.png'),run:IMG('images/game/player-run.png')};

function makeSprite(f){
  const cc=document.createElement('canvas');cc.width=8;cc.height=16;const x=cc.getContext('2d');
  for(let r=0;r<16;r++)for(let k=0;k<8;k++){
    const lifted=r>12&&((k<4)?f===1:f===0);
    x.fillStyle=PAL[SPR[r][k]];x.fillRect(k,r+(lifted?-1:0),1,1);
  }
  return cc;
}
const SPRS=[makeSprite(0),makeSprite(1)];
const hash=(i,j)=>(Math.imul(i,374761393)+Math.imul(j,668265263))>>>0;
const rect=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
let got=JSON.parse(localStorage.getItem('ach2')||'[]');
const clouds=[{x:40,y:42,s:1},{x:220,y:28,s:.8},{x:380,y:66,s:1.1}];

let ready,floaters,redFlash,airJumps,jumpQ,t,scrollX,dist,score,coinCount,lives,h,vy,obs,coins,spawned,nextObs,coinT,shieldT,shieldSpawn,flash,speed,isOver,duck,won,parts,shake,comboN,comboT,muted=false;

function reset(){
  ready=ACH.map(a=>a.s);floaters=[];redFlash=0;airJumps=1;jumpQ=0;t=t||0;scrollX=0;dist=0;score=0;coinCount=0;lives=5;h=0;vy=0;
  obs=[];coins=[];spawned=[];nextObs=80;coinT=60;shieldT=0;shieldSpawn=900;flash=0;speed=3;shake=0;
  comboN=0;comboT=0;parts=[];isOver=false;overEl.hidden=true;
}
reset();
won=false;duck=false;

/* ---------- sound (WebAudio, created after first touch/key) ---------- */
let AC=null;
function ensureAudio(){
  if(AC===null){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){AC=false;}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function beep(f,d,type,vol){
  if(!AC||muted)return;
  try{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=type||'square';o.frequency.value=f;g.gain.value=vol||0.05;
    o.connect(g);g.connect(AC.destination);
    o.start();g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+(d||0.12));o.stop(AC.currentTime+(d||0.12));
  }catch(e){}
}

function burst(x,y,col,n){for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*4,vy:-Math.random()*4,l:26,c:col});}
let sayT=0;
function say(title,text){
  const d=document.getElementById('dlg');
  document.getElementById('dlg-t').textContent=title;
  document.getElementById('tx').textContent=text;
  d.hidden=false;clearTimeout(sayT);sayT=setTimeout(()=>{d.hidden=true},2800);
}

/* ---------- controls ---------- */
function jump(){ensureAudio();jumpQ=10;tryJump();}
function tryJump(){
  if(jumpQ<=0||isOver||won)return;
  if(h===0&&vy===0){vy=7.6;jumpQ=0;burst(46,GY,'#8b5a2b',6);beep(520,0.1,'square',0.04);}
  else if(airJumps>0){vy=6.8;airJumps--;jumpQ=0;burst(46,GY-h,'#fff3b0',10);beep(760,0.12,'triangle',0.05);}
}
cv.addEventListener('pointerdown',jump);
document.getElementById('bJump').addEventListener('pointerdown',e=>{e.preventDefault();jump();});
const duckBtn=document.getElementById('bDuck');
duckBtn.addEventListener('pointerdown',e=>{e.preventDefault();ensureAudio();duck=true;duckBtn.classList.add('held');});
['pointerup','pointerleave','pointercancel'].forEach(ev=>duckBtn.addEventListener(ev,()=>{duck=false;duckBtn.classList.remove('held');}));
addEventListener('keydown',e=>{
  if(e.code==='KeyM'){muted=!muted;say('SOUND',muted?'MUTED':'ON');return;}
  if(isOver&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();reset();return;}
  if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();jump();}
  if(e.code==='ArrowDown')duck=true;
});
addEventListener('keyup',e=>{if(e.code==='ArrowDown')duck=false;});
document.getElementById('retry').addEventListener('click',()=>{ensureAudio();reset();});
document.getElementById('restart').addEventListener('click',()=>{ensureAudio();reset();});
document.getElementById('skip').addEventListener('click',()=>localStorage.setItem('skip','1'));

/* ---------- badges ---------- */
function collectAch(i){
  if(!got.includes(i))got.push(i);
  localStorage.setItem('ach2',JSON.stringify(got));
  burst(60,GY-60,'#fcd34d',24);
  beep(880,0.25,'triangle',0.06);
  Badges.collect(i,got);
  say('BADGE UNLOCKED',ACH[i].n);
  if(got.length===3){
    won=true;
    setTimeout(()=>say('ALL 3 BADGES','Opening my portfolio...'),1000);
    setTimeout(()=>{location.href='quick.html';},3400);
  }
}

function spawnObs(){
  const r=Math.random();
  const k=dist<60||r<.5?'cactus':r<.8?'block':'bird';
  obs.push({x:W+10,k});
}

/* ---------- update ---------- */
function step(){
  t++;
  if(flash>0)flash--;
  if(shake>0)shake--;
  if(redFlash>0)redFlash--;
  if(jumpQ>0)jumpQ--;
  if(!isOver&&!won){
    dist+=speed*0.2;speed=Math.min(6,2.6+dist/220);
    scrollX+=speed;
    if(shieldT>0)shieldT--;
    if(comboT>0){comboT--;if(comboT===0)comboN=0;}
    if(h===0&&t%4===0)parts.push({x:40+Math.random()*6,y:GY-2,vx:-1-Math.random(),vy:-Math.random()*0.8,l:18,c:'#b58a5a'});
    if(h>0||vy!==0){
      h+=vy;vy-=0.42;
      if(h<=0){h=0;vy=0;airJumps=1;burst(46,GY,'#c9b48a',6);}
    }
    tryJump();
    if(--nextObs<=0){spawnObs();nextObs=80+Math.random()*70;}
    if(--coinT<=0){coins.push({x:W+10,y:Math.random()<.5?GY-30:GY-62,k:'coin'});coinT=50+Math.random()*60;}
    if(--shieldSpawn<=0){coins.push({x:W+10,y:GY-46,k:'shield'});shieldSpawn=900+Math.random()*600;}
    const pts=Math.floor(dist)+score;
    ACH.forEach((a,i)=>{
      if(!got.includes(i)&&!coins.some(k=>k.k==='ach'&&k.i===i)&&pts>=ready[i]){
        coins.push({x:W+10,y:GY-42,k:'ach',i});
        say('BADGE AHEAD',a.n+' · '+a.s+' PTS');
      }
    });
    obs.forEach(o=>o.x-=speed);coins.forEach(k=>k.x-=speed);
    const p=duck?{x:48,y:GY-20,w:14,h:20}:{x:48,y:GY-40-h,w:14,h:40};
    for(const o of obs){
      const r=o.k==='cactus'?{x:o.x+4,y:GY-36,w:14,h:36}:o.k==='block'?{x:o.x+3,y:GY-21,w:18,h:21}:{x:o.x+4,y:GY-54,w:22,h:16};
      if(rect(p,r)){
        if(shieldT>0){burst(p.x+10,p.y+20,'#7dd3fc',10);o.x=-999;}
        else if(flash<=0){
          lives--;flash=100;shake=12;redFlash=14;burst(p.x+10,p.y+20,'#ef4444',14);o.x=-999;
          beep(120,0.25,'sawtooth',0.07);
        }
      }
    }
    for(const k of coins){
      if(k.got||k.x<-30)continue;
      if(rect(p,{x:k.x,y:k.y,w:16,h:16})){
        k.got=true;
        if(k.k==='coin'){
          if(comboT>0)comboN++;else comboN=1;
          comboT=90;
          const mult=1+Math.min(4,Math.floor((comboN-1)/3));
          score+=10*mult;coinCount++;
          burst(k.x+8,k.y+8,'#fcd34d',8);
          floaters.push({x:k.x,y:k.y,txt:'+'+(10*mult),l:40});
          beep(980+Math.min(comboN,8)*40,0.08,'square',0.035);
          if(coinCount%5===0&&lives<5){lives++;say('BONUS','+1 HEART');}
        }else if(k.k==='shield'){
          shieldT=300;burst(k.x+8,k.y+8,'#7dd3fc',16);beep(660,0.2,'sine',0.06);
          say('SHIELD ON','5 SECONDS OF SAFETY');
        }else collectAch(k.i);
      }
    }
    coins.forEach(k=>{
      if(k.k==='ach'&&!k.got&&k.x<=-30&&!got.includes(k.i)){
        ready[k.i]=Math.floor(dist)+score+100;
        say('MISSED','BADGE BACK AT +100 PTS');
      }
    });
    obs=obs.filter(o=>o.x>-60);coins=coins.filter(k=>!k.got&&k.x>-30);
    if(lives<=0){
      isOver=true;
      const fin=Math.floor(dist)+score,best=Math.max(+localStorage.getItem('best')||0,fin);
      localStorage.setItem('best',best);
      document.getElementById('final').textContent='SCORE '+fin+'   BEST '+best;
      overEl.hidden=false;
      beep(90,0.5,'sawtooth',0.07);
    }
  }
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.2;p.l--;});
  parts=parts.filter(p=>p.l>0);
  floaters.forEach(f=>f.l--);
  floaters=floaters.filter(f=>f.l>0);
}

/* ---------- background ---------- */
function drawCloud(x,y,s){
  c.fillStyle='rgba(255,255,255,.93)';
  c.beginPath();c.arc(x,y,12*s,0,7);c.arc(x+16*s,y-7*s,16*s,0,7);c.arc(x+34*s,y,12*s,0,7);c.fill();
  c.fillRect(x-12*s,y,46*s,12*s);
}
function ridge(color,amp,base,sp,freq,phase){
  const off=scrollX*sp;
  c.fillStyle=color;c.beginPath();c.moveTo(0,GY);
  for(let x=0;x<=W;x+=6){
    const v=0.6*Math.sin((x+off)*freq+phase)+0.4*Math.sin((x+off)*freq*2.3+phase*1.7);
    c.lineTo(x,base-amp*(0.5+0.5*v));
  }
  c.lineTo(W,GY);c.closePath();c.fill();
}
function parallax(img,sp,y,hh){
  const w=img.naturalWidth*hh/img.naturalHeight,off=(scrollX*sp)%w;
  for(let x=-off;x<W;x+=w)c.drawImage(img,x,y,w+1,hh);
}
function drawBG(){
  if(ok(A.sky)){c.drawImage(A.sky,0,0,W,GY);}
  else{
    const g=c.createLinearGradient(0,0,0,GY);
    g.addColorStop(0,'#2f80d8');g.addColorStop(.55,'#8fd3ff');g.addColorStop(1,'#fff1c1');
    c.fillStyle=g;c.fillRect(0,0,W,GY);
    const sg=c.createRadialGradient(395,52,4,395,52,80);
    sg.addColorStop(0,'rgba(255,245,170,.95)');sg.addColorStop(1,'rgba(255,245,170,0)');
    c.fillStyle=sg;c.fillRect(300,0,180,150);
    c.fillStyle='#fff7c2';c.beginPath();c.arc(395,52,16,0,7);c.fill();
    clouds.forEach(cl=>{const span=W+140;let x=(cl.x-scrollX*0.15*cl.s)%span;if(x<0)x+=span;drawCloud(x-70,cl.y,cl.s);});
  }
  if(ok(A.hills))parallax(A.hills,.2,GY-120,120);
  else{ridge('#a8d8f0',60,GY-10,.12,.012,1);ridge('#7cc08a',46,GY-4,.25,.02,2.2);}
  if(ok(A.trees))parallax(A.trees,.5,GY-70,70);
  else{ridge('#3f8f5a',26,GY+2,.5,.035,3.1);}
}

function drawGround(){
  const off=scrollX%T;
  if(ok(A.grass)&&ok(A.dirt)){
    for(let x=-off;x<W+T;x+=T){
      c.drawImage(A.grass,x,GY,T,T);
      for(let y=GY+T;y<H+T;y+=T)c.drawImage(A.dirt,x,y,T,T);
    }
    return;
  }
  const gt=c.createLinearGradient(0,GY,0,H);gt.addColorStop(0,'#8a5a30');gt.addColorStop(1,'#4d301a');
  c.fillStyle=gt;c.fillRect(0,GY,W,H-GY);
  c.fillStyle='#6cc24f';c.fillRect(0,GY,W,12);
  c.fillStyle='#3f8f32';c.fillRect(0,GY+12,W,3);
  for(let x=-off;x<W+T;x+=T){
    const i=Math.floor((x+scrollX)/T+1000),n=hash(i,7);
    c.fillStyle=n%2?'#8fe06a':'#7bd05a';c.fillRect(x+2,GY+1,6,3);c.fillRect(x+13,GY+3,5,2);
    for(let y=GY+18;y<H;y+=T){
      const m=hash(i,y);
      c.fillStyle=m%3?'#6b4424':'#5a381d';c.fillRect(x,y,T,T);
      c.fillStyle=m%2?'#9c6a3a':'#8a5d33';c.fillRect(x+(m%10)+2,y+5,4,3);
      c.fillStyle='#4a2c16';c.fillRect(x,y+T-1,T,1);
    }
  }
}

/* ---------- entities ---------- */
function drawObs(){
  for(const o of obs){
    if(o.k==='cactus'){
      if(ok(A.cactus))c.drawImage(A.cactus,o.x,GY-40,20,40);
      else{
        c.fillStyle='#2f6b22';c.fillRect(o.x+4,GY-40,12,40);
        c.fillStyle='#4f9a36';c.fillRect(o.x+6,GY-40,3,40);
        c.fillStyle='#2f6b22';c.fillRect(o.x,GY-26,6,8);c.fillRect(o.x+14,GY-30,6,8);
        c.fillRect(o.x,GY-18,4,4);c.fillRect(o.x+16,GY-22,4,4);
      }
    }else if(o.k==='block'){
      if(ok(A.block))c.drawImage(A.block,o.x,GY-24,24,24);
      else{
        c.fillStyle='#b8432e';c.fillRect(o.x,GY-24,24,24);
        c.fillStyle='#e8674a';c.fillRect(o.x+2,GY-22,20,4);
        c.fillStyle='#3a1d10';c.fillRect(o.x,GY-24,24,2);c.fillRect(o.x,GY-2,24,2);
        c.fillStyle='#fff3e0';c.font='bold 9px "Courier New",monospace';c.textAlign='center';c.fillText('TNT',o.x+12,GY-9);
      }
    }else{
      const fl=Math.floor(t/7)%2;
      if(ok(A.bird))c.drawImage(A.bird,o.x,GY-58,30,20);
      else{
        c.fillStyle='#2b2d42';c.beginPath();c.ellipse(o.x+15,GY-48,11,6,0,0,7);c.fill();
        c.fillStyle='#ef8d32';c.fillRect(o.x+24,GY-50,6,3);
        c.fillStyle='#2b2d42';c.beginPath();
        if(fl){c.moveTo(o.x+10,GY-50);c.lineTo(o.x+18,GY-50);c.lineTo(o.x+14,GY-60);}
        else{c.moveTo(o.x+10,GY-46);c.lineTo(o.x+18,GY-46);c.lineTo(o.x+14,GY-38);}
        c.fill();
        c.fillStyle='#fff';c.fillRect(o.x+17,GY-51,2,2);
      }
    }
  }
}

function drawCoins(){
  const bob=Math.sin(t/10)*2;
  for(const k of coins){
    if(k.x<-30)continue;
    const y=k.y+bob,cx=k.x+8,cy=y+8;
    if(k.k==='coin'){
      if(ok(A.coin))c.drawImage(A.coin,k.x,y,16,16);
      else{
        const g=c.createRadialGradient(cx-2,cy-3,1,cx,cy,9);
        g.addColorStop(0,'#fff6b0');g.addColorStop(.5,'#fcd34d');g.addColorStop(1,'#b7791f');
        c.fillStyle='#3a2d1e';c.beginPath();c.arc(cx,cy,9,0,7);c.fill();
        c.fillStyle=g;c.beginPath();c.arc(cx,cy,7.2,0,7);c.fill();
      }
    }else if(k.k==='shield'){
      c.fillStyle='rgba(125,211,252,.35)';c.beginPath();c.arc(cx,cy,14+Math.sin(t/6)*2,0,7);c.fill();
      const g=c.createRadialGradient(cx-3,cy-3,1,cx,cy,10);
      g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#7dd3fc');g.addColorStop(1,'#1d4ed8');
      c.fillStyle=g;c.beginPath();c.arc(cx,cy,10,0,7);c.fill();
      c.fillStyle='#fff';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('S',cx,cy+4);
    }else{
      const pulse=16+Math.sin(t/8)*2;
      c.fillStyle='rgba(252,211,77,.28)';c.beginPath();c.arc(cx,cy,pulse,0,7);c.fill();
      const sx=Math.max(.12,Math.abs(Math.cos(t/12+k.i*1.7)));
      c.save();c.translate(cx,cy);c.scale(sx,1);c.translate(-cx,-cy);
      if(ok(BIMG[k.i]))c.drawImage(BIMG[k.i],cx-20,cy-20,40,40);
      else{
        c.fillStyle='#3a2d1e';c.beginPath();c.arc(cx,cy,14,0,7);c.fill();
        const g=c.createLinearGradient(k.x,y,k.x+16,y+16);g.addColorStop(0,'#fff3b0');g.addColorStop(1,'#f59e0b');
        c.fillStyle=g;c.beginPath();c.arc(cx,cy,11,0,7);c.fill();
        c.fillStyle='#3a2d1e';c.font='bold 16px sans-serif';c.textAlign='center';c.fillText('★',cx,cy+6);
      }
      c.restore();
      for(let j=0;j<4;j++){const a=t/18+j*Math.PI/2;c.fillStyle='#fff3b0';c.beginPath();c.arc(cx+Math.cos(a)*24*sx,cy+Math.sin(a)*24,2.2,0,7);c.fill();}
      c.font='bold 9px "Courier New",monospace';c.textAlign='center';
      const label=ACH[k.i].n,lw=c.measureText(label).width+10;
      c.fillStyle='rgba(58,45,30,.85)';c.fillRect(cx-lw/2,y-22,lw,13);
      c.fillStyle='#fcd34d';c.fillText(label,cx,y-12);
    }
  }
}

function drawPlayer(){
  const dh=duck?30:48,dx=44,dy=GY-dh-(duck?0:h);
  if(shieldT>0){
    const a=0.45+0.25*Math.sin(t/4);
    c.strokeStyle='rgba(125,211,252,'+a+')';c.lineWidth=3;
    c.beginPath();c.arc(dx+24,dy+dh/2,34+Math.sin(t/5)*2,0,7);c.stroke();
  }
  if(flash>0&&Math.floor(flash/5)%2)return;
  const sw=duck?18:14;
  c.fillStyle='rgba(0,0,0,'+Math.max(.1,.3-h/200)+')';
  c.beginPath();c.ellipse(dx+12,GY+1,sw-h/30,3,0,0,7);c.fill();
  if(ok(A.run)){
    const f=h>0?0:Math.floor(t/6)%4;
    c.drawImage(A.run,f*32,0,32,32,dx,dy,48,dh);
  }else{
    c.imageSmoothingEnabled=false;
    c.drawImage(SPRS[h>0?0:Math.floor(t/6)%2],dx,dy,24,dh);
    c.imageSmoothingEnabled=true;
  }
}

function drawName(){
  if(isOver)return;
  const dh=duck?30:48,top=GY-dh-(duck?0:h);
  c.font='bold 9px "Courier New",monospace';c.textAlign='center';
  const w=c.measureText('SHANA').width+12,x=44+12,y=top-10;
  c.fillStyle='rgba(58,45,30,.85)';c.fillRect(x-w/2,y-10,w,14);
  c.fillStyle='#fcd34d';c.fillText('SHANA',x,y);
}
function drawFloaters(){
  c.textAlign='center';c.font='bold 11px "Courier New",monospace';
  for(const f of floaters){
    c.globalAlpha=Math.max(0,f.l/40);c.fillStyle='#fcd34d';
    c.fillText(f.txt,f.x+8,f.y-6-(40-f.l)*0.5);
  }
  c.globalAlpha=1;
}
function drawParts(){for(const p of parts){c.fillStyle=p.c;c.fillRect(Math.round(p.x),Math.round(p.y),4,4);}}

/* ---------- HUD ---------- */
function drawHeart(x,y,full){
  c.fillStyle='#3a2d1e';c.fillRect(x,y+2,14,4);c.fillRect(x+2,y,4,2);c.fillRect(x+8,y,4,2);c.fillRect(x+4,y+6,6,2);c.fillRect(x+6,y+8,2,2);
  c.fillRect(x-1,y+2,1,4);c.fillRect(x+14,y+2,1,4);
  c.fillStyle=full?'#ef4444':'#4b3d55';c.fillRect(x+1,y+2,12,4);c.fillRect(x+3,y+1,3,1);c.fillRect(x+8,y+1,3,1);c.fillRect(x+5,y+6,4,2);c.fillRect(x+7,y+8,2,1);
  if(full){c.fillStyle='#ffb4b4';c.fillRect(x+3,y+2,2,2);}
}
function drawHUD(){
  c.fillStyle='rgba(58,45,30,.88)';c.fillRect(8,8,176,30);
  c.fillStyle='#fcd34d';c.font='12px "Press Start 2P",monospace';c.textAlign='left';
  c.fillText('SCORE '+(Math.floor(dist)+score),16,28);
  for(let i=0;i<5;i++)drawHeart(196+i*22,15,i<lives);
  if(comboN>=2&&comboT>0){
    const m=1+Math.min(4,Math.floor((comboN-1)/3));
    c.fillStyle='rgba(58,45,30,.88)';c.fillRect(8,44,120,22);
    c.fillStyle='#fff3b0';c.font='11px "Press Start 2P",monospace';c.fillText('COMBO x'+m,16,60);
  }
  if(shieldT>0){
    c.fillStyle='rgba(58,45,30,.88)';c.fillRect(8,72,120,16);
    c.fillStyle='#7dd3fc';c.fillRect(12,76,Math.max(0,112*shieldT/300),8);
  }
  if(muted){c.fillStyle='rgba(58,45,30,.88)';c.fillRect(W-62,8,54,20);c.fillStyle='#ef4444';c.font='9px "Press Start 2P",monospace';c.fillText('MUTE',W-56,22);}
}

function loop(){
  if(!document.hidden)step();
  c.save();
  if(shake>0)c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  c.clearRect(-10,-10,W+20,H+20);
  drawBG();drawGround();drawObs();drawCoins();drawPlayer();drawName();drawParts();drawFloaters();
  c.restore();
  if(redFlash>0){c.fillStyle='rgba(239,68,68,'+(redFlash/28)+')';c.fillRect(0,0,W,H);}
  drawHUD();
  requestAnimationFrame(loop);
}

/* ---------- layout: fit the game box into the free space, 16:9 ---------- */
const stageEl=document.getElementById('stage'),boxEl=document.getElementById('w');
function fit(){
  const aw=stageEl.clientWidth-10,ah=stageEl.clientHeight-10;
  const hh=Math.max(120,Math.min(ah,aw*9/16)),ww=hh*16/9;
  boxEl.style.width=ww+'px';boxEl.style.height=hh+'px';
}
addEventListener('resize',fit);
if('ResizeObserver' in window)new ResizeObserver(fit).observe(stageEl);
fit();

Badges.render(got);
msg.textContent='';
loop();
