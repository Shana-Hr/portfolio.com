/* Badge bar: 3 slots (badge_1/2/3.png). Grey until collected.
   On collect the badge flies out of the game box, spins, and lands in its slot, then the slot turns coloured.
   The game keeps running underneath. */
(()=>{
  const BADGE_IMGS=['images/badge_1.png','images/badge_2.png','images/badge_3.png'];
  const slots=[...document.querySelectorAll('#badges .bslot')];
  const count=document.getElementById('count');
  const prog=document.querySelector('#badges .bprog i');
  const box=document.getElementById('w');

  slots.forEach((s,i)=>{
    const img=s.querySelector('img');
    img.src=BADGE_IMGS[i];
    img.onerror=()=>{img.remove();s.insertAdjacentHTML('beforeend','<span class="fb">★</span>');};
  });

  function setCount(n,anim){
    count.textContent=n+'/3';
    prog.style.width=(n/3*100)+'%';
    if(anim){count.classList.remove('bump');void count.offsetWidth;count.classList.add('bump');}
  }
  function sparkle(el){
    for(let k=0;k<12;k++){
      const sp=document.createElement('span');sp.className='spk';
      const a=k/12*Math.PI*2,d=50+(k%3)*12;
      sp.style.setProperty('--dx',(Math.cos(a)*d).toFixed(1)+'px');
      sp.style.setProperty('--dy',(Math.sin(a)*d).toFixed(1)+'px');
      el.appendChild(sp);setTimeout(()=>sp.remove(),900);
    }
  }
  function render(got){
    slots.forEach((s,i)=>s.classList.toggle('got',got.includes(i)));
    setCount(got.length,false);
  }
  function fly(i,done){
    const r=box.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    const sr=slots[i].getBoundingClientRect(),tx=sr.left+sr.width/2,ty=sr.top+sr.height/2,sc=Math.max(.3,sr.width/120);
    const el=document.createElement('div');el.className='flyb';
    el.style.left=cx+'px';el.style.top=cy+'px';
    const img=document.createElement('img');img.src=BADGE_IMGS[i];
    img.onerror=()=>{img.remove();el.insertAdjacentHTML('beforeend','<span class="fb2">★</span>');};
    el.appendChild(img);document.body.appendChild(el);
    if(!el.animate){el.remove();done();return;}
    const grow=el.animate([
      {transform:'scale(0) rotateY(0deg)',opacity:0},
      {transform:'scale(1.3) rotateY(360deg)',opacity:1,offset:.6},
      {transform:'scale(1.1) rotateY(540deg)',opacity:1}
    ],{duration:850,easing:'ease-out',fill:'forwards'});
    grow.onfinish=()=>{
      setTimeout(()=>{
        const fl=el.animate([
          {transform:'translate(0px,0px) scale(1.1) rotateY(540deg)'},
          {transform:`translate(${tx-cx}px,${ty-cy}px) scale(${sc}) rotateY(720deg)`}
        ],{duration:780,easing:'cubic-bezier(.55,0,.25,1)',fill:'forwards'});
        fl.onfinish=()=>{el.remove();done();};
      },350);
    };
  }
  function collect(i,got){
    fly(i,()=>{
      const s=slots[i];
      s.classList.add('got','fresh');sparkle(s);
      setTimeout(()=>s.classList.remove('fresh'),900);
      setCount(got.length,true);
    });
  }
  window.Badges={render,collect,imgs:BADGE_IMGS};
})();
