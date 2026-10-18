/* Portfolio: renders details.json into minecraft-style panels, starfield, typing role, mobile menu. */
const SECS=[['about','ABOUT'],['skills','SKILLS'],['projects','PROJECTS'],['experience','EXPERIENCE'],['education','EDUCATION'],['contact','CONTACT']];
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const isLink=u=>/^(https?:|mailto:|tel:)/i.test(u||'');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- starfield ---------- */
(()=>{
  const cv=document.getElementById('stars'),c=cv.getContext('2d');
  let stars=[];
  function size(){cv.width=innerWidth;cv.height=innerHeight;stars=Array.from({length:Math.round(innerWidth*innerHeight/9000)},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,s:Math.random()<.2?3:2,v:.1+Math.random()*.4,p:Math.random()*6.28}));}
  function frame(t){
    c.clearRect(0,0,cv.width,cv.height);
    for(const s of stars){
      if(!reduce){s.y+=s.v;if(s.y>cv.height){s.y=-4;s.x=Math.random()*cv.width;}}
      const a=.35+.35*Math.sin(t/900+s.p);
      c.fillStyle=`rgba(255,240,200,${a})`;c.fillRect(Math.round(s.x),Math.round(s.y),s.s,s.s);
    }
    requestAnimationFrame(frame);
  }
  size();addEventListener('resize',size);requestAnimationFrame(frame);
})();

/* ---------- builders ---------- */
function panel(id,title){
  const s=el('section','panel');s.id=id;s.append(el('h2','',title));return s;
}
function buildAbout(d){
  const s=panel('about','ABOUT ME');
  const grid=el('div','stats');
  [['LOCATION',d.location],['ROLE',d.title],['NICKNAME',d.nickname],['STATUS','OPEN FOR WORK']].forEach(([k,v])=>{
    const b=el('div','stat');b.append(el('small','',k),el('b','',v));grid.append(b);
  });
  s.append(grid,el('p','',d.bio));
  return s;
}
function buildSkills(d){
  const s=panel('skills','SKILLS');
  d.skills.forEach(k=>{
    const r=el('div','row');r.append(el('span','',k.name),el('span','',`LV ${k.level}`));
    const bar=el('div','bar');const i=el('i');i.dataset.w=k.level;bar.append(i);
    s.append(r,bar);
  });
  return s;
}
function buildProjects(d){
  const s=panel('projects','PROJECTS');
  const g=el('div','grid');
  d.projects.forEach(p=>{
    const card=el('article','card');
    const th=el('div','thumb');
    const img=el('img');img.alt=p.title;img.src=p.image;img.loading='lazy';
    img.onerror=()=>{img.remove();th.append(el('span','',p.title.charAt(0)))};
    th.append(img);
    const body=el('div','cbody');
    body.append(el('h3','',p.title),el('p','',p.desc));
    const tg=el('div','tags');p.tags.forEach(t=>tg.append(el('span','',t)));body.append(tg);
    if(isLink(p.link)&&p.link!=='#'){const a=el('a','open','OPEN ↗');a.href=p.link;if(/^https?:/i.test(p.link)){a.target='_blank';a.rel='noopener noreferrer'}body.append(a)}
    card.append(th,body);g.append(card);
  });
  s.append(g);
  return s;
}
function buildTimeline(id,title,items,fmt){
  const s=panel(id,title);const tl=el('div','tl');
  items.forEach(it=>{const b=el('div','tl-item');fmt(b,it);tl.append(b)});
  s.append(tl);return s;
}
function buildContact(d){
  const s=panel('contact','CONTACT');
  const row=el('div','contact');
  const items=[['EMAIL',d.contact.email?`mailto:${d.contact.email}`:''],['GITHUB',d.contact.github],['WHATSAPP',d.contact.whatsapp]];
  items.forEach(([l,u],i)=>{
    const a=el('a',isLink(u)?'':'dis',l);
    a.style.background=['#5b3f8c','#2a2042','#7cc242'][i];a.style.color=i===2?'#000':'#fff';
    if(isLink(u)){a.href=u;if(/^https?:/i.test(u)){a.target='_blank';a.rel='noopener noreferrer'}}
    row.append(a);
  });
  s.append(row);
  return s;
}

/* ---------- boot ---------- */
(async()=>{
  const main=document.getElementById('sections');
  let d;
  try{const r=await fetch('details.json');if(!r.ok)throw new Error(r.status);d=await r.json()}
  catch(e){main.append(el('p','','details.json load වුණේ නැහැ. Live Server එකකින් හෝ hosting එකෙන් open කරන්න (file:// වලින් වැඩ නැහැ).'));return}

  document.title=d.name+' | Portfolio';
  document.getElementById('nm').textContent=d.name.toUpperCase();
  document.getElementById('loc').textContent=d.location+' · APPS & WEB';

  // typing role
  const roles=[d.title,'ANDROID APPS','WEB PLATFORMS','PIXEL UI'];
  const roleEl=document.getElementById('role');
  if(reduce)roleEl.textContent=d.title;else{
    let ri=0,ci=0,del=false;
    (function type(){
      const w=roles[ri];roleEl.textContent=w.slice(0,ci);
      if(!del&&ci<w.length){ci++;setTimeout(type,90)}
      else if(!del){del=true;setTimeout(type,1500)}
      else if(ci>0){ci--;setTimeout(type,45)}
      else{del=false;ri=(ri+1)%roles.length;setTimeout(type,250)}
    })();
  }

  // sections
  main.append(buildAbout(d),buildSkills(d),buildProjects(d),
    buildTimeline('experience','EXPERIENCE',d.experience,(b,e)=>{b.append(el('h3','',`${e.role} @ ${e.place}`),el('small','',e.years),el('p','',e.note))}),
    buildTimeline('education','EDUCATION',d.education,(b,e)=>{b.append(el('h3','',e.what),el('small','',`${e.where} · ${e.years}`))}),
    buildContact(d));

  // nav chips + mobile menu
  const links=document.getElementById('links'),mlinks=document.getElementById('mlinks');
  SECS.forEach(([id,label])=>{
    const a=el('a','',label);a.href='#'+id;links.append(a);
    const m=el('a','mlink',label);m.href='#'+id;m.setAttribute('role','menuitem');m.innerHTML='';m.append(label,el('span','','→'));mlinks.append(m);
  });

  // reveal + bars
  const io=new IntersectionObserver(es=>es.forEach(en=>{
    if(!en.isIntersecting)return;
    en.target.classList.add('in');
    en.target.querySelectorAll('.bar i').forEach(b=>b.style.width=b.dataset.w+'%');
    io.unobserve(en.target);
  }),{threshold:.12});
  document.querySelectorAll('.panel').forEach(p=>io.observe(p));

  // scroll spy for chips
  const chips=[...links.children],secs=SECS.map(([id])=>document.getElementById(id));
  const spy=()=>{const y=scrollY+120;let k=-1;secs.forEach((s,i)=>{if(s.offsetTop<=y)k=i});chips.forEach((a,i)=>a.classList.toggle('on',i===k))};
  addEventListener('scroll',spy,{passive:true});spy();
})();

/* ---------- mobile menu (one place, closes on link / outside / Esc) ---------- */
(()=>{
  const btn=document.getElementById('menuBtn'),menu=document.getElementById('menu');
  const set=v=>{menu.hidden=!v;btn.setAttribute('aria-expanded',String(v));btn.textContent=v?'✕':'☰';btn.setAttribute('aria-label',v?'Close menu':'Open menu');};
  btn.addEventListener('click',e=>{e.stopPropagation();set(menu.hidden)});
  menu.addEventListener('click',e=>{if(e.target.closest('a'))set(false)});
  document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==btn)set(false)});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){set(false);btn.focus()}});
  matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches)set(false)});
})();
