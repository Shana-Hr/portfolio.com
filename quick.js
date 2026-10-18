/* Quick view: renders details.json into the book-style sections. */
const SECS=[['about','About'],['skills','Skills'],['projects','Projects'],['experience','Experience'],['education','Education'],['badges','Badges'],['contact','Contact']];
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const safe=u=>u&&/^(https?:|mailto:|tel:)/i.test(u);
const link=(a,url,txt)=>{const x=el('a','',txt);x.href=url;if(/^https?:/i.test(url)){x.target='_blank';x.rel='noopener noreferrer'}return x};
const unlocked=JSON.parse(localStorage.getItem('ach2')||'[]');

function build(d){
  const f={
    about:()=>{const w=el('div');const dl=el('dl');
      [['Name',d.name],['Nickname',d.nickname],['Role',d.title],['Location',d.location]].forEach(([k,v])=>{dl.append(el('dt','',k),el('dd','',v))});
      w.append(dl,el('p','',d.bio));return w},
    skills:()=>{const w=el('div','sec');
      d.skills.forEach(s=>{const row=el('div');row.style.cssText='display:flex;justify-content:space-between;margin-top:8px';row.append(el('span','',s.name),el('span','mono',`LV ${s.level}`));
        const bar=el('div','bar'),i=el('i');i.dataset.w=s.level;bar.append(i);w.append(row,bar)});return w},
    projects:()=>{const w=el('div');
      d.projects.forEach(p=>{const dt=el('details'),sm=el('summary','',p.title);sm.append(el('em','',p.tags[0]||'PROJECT'));dt.append(sm);
        const box=el('div','in');box.append(el('p','',p.desc));
        const tg=el('div','tags');p.tags.forEach(t=>tg.append(el('span','',t)));box.append(tg);
        if(safe(p.link))box.append(link(0,p.link,'Open project ↗'));
        dt.append(box);w.append(dt)});return w},
    experience:()=>{const w=el('div');
      d.experience.forEach(e=>{const s=el('div','sec');s.append(el('h3','mono',e.years));s.append(el('p','',`${e.role} · ${e.place}`),el('p','sm',e.note));w.append(s)});return w},
    education:()=>{const w=el('div');
      d.education.forEach(e=>{const s=el('div','sec');s.append(el('h3','mono',e.years));s.append(el('p','',`${e.what}`),el('p','sm',e.where));w.append(s)});return w},
    badges:()=>{const w=el('div','bgrid');
      d.achievements.forEach((a,i)=>{const on=unlocked.includes(i);
        const card=el('div','bcard'+(on?' got':''));
        const img=el('img');img.src=`images/badge_${i+1}.png`;img.alt=a;img.onerror=()=>{img.replaceWith(el('span','bfb','★'))};
        card.append(img,el('b','',on?a:'LOCKED'));w.append(card)});
      const n=unlocked.length;
      const wrap=el('div');wrap.append(w,el('p','sm',n>=3?'All 3 badges collected!':`Collected ${n} / 3. Collect them in the game.`));return wrap},
    contact:()=>{const w=el('div','lnks');
      const items=[['Email',d.contact.email?`mailto:${d.contact.email}`:'','Send me a message'],['GitHub',d.contact.github,'Code and projects'],['WhatsApp',d.contact.whatsapp,'Quick chat']];
      items.forEach(([l,u,desc])=>{const a=el(safe(u)?'a':'div','lnk');if(safe(u)){a.href=u;if(/^https?:/i.test(u)){a.target='_blank';a.rel='noopener noreferrer'}}
        a.append(el('b','',l),el('span','',desc));w.append(a)});return w}
  };
  return f;
}

(async()=>{
  const main=document.getElementById('main'),nav=document.getElementById('nav');
  let d;
  try{const r=await fetch('details.json');if(!r.ok)throw new Error(r.status);d=await r.json()}
  catch(e){main.append(el('p','sm','Could not load details.json. Open this page with a local server (Live Server) or on hosting, not as a file.'));return}

  document.getElementById('nm').textContent=d.name;
  document.getElementById('sb').textContent=d.title;
  document.title=d.name+' | Quick View';
  document.getElementById('qs-t').textContent=d.name;
  document.querySelector('.st-intro').textContent=d.title+' · '+d.location;

  const f=build(d);
  SECS.forEach(([id,label])=>{
    const a=el('a','',label);a.href='#'+id;nav.append(a);
    const sec=el('section','bk');sec.id=id;sec.append(el('h2','mono',label));
    const body=el('div','in');body.append(f[id]());sec.append(body);main.append(sec);
  });
  // bars animate when shown
  document.querySelectorAll('.bar i').forEach(i=>setTimeout(()=>i.style.width=i.dataset.w+'%',300));

  let cur=-1;const links=[...nav.children],secs=SECS.map(([id])=>document.getElementById(id));
  const spy=()=>{const y=scrollY+90;let k=0;secs.forEach((s,i)=>{if(s.offsetTop<=y)k=i});
    if(k!==cur){cur=k;links.forEach((a,i)=>a.classList.toggle('on',i===k));const a=links[k];nav.scrollTo({left:a.offsetLeft-(nav.clientWidth-a.offsetWidth)/2})}};
  links.forEach((a,i)=>a.addEventListener('click',e=>{e.preventDefault();secs[i].scrollIntoView({behavior:'smooth'})}));
  addEventListener('scroll',spy,{passive:true});spy();
})();

/* menu popup (same as the game) */
(()=>{const ST=document.getElementById('start'),close=()=>{ST.hidden=true};
  document.getElementById('menu-btn').addEventListener('click',()=>{ST.hidden=false});
  document.getElementById('st-stay').addEventListener('click',e=>{e.preventDefault();close()});
  ST.addEventListener('click',e=>{if(e.target===ST)close()});
  addEventListener('keydown',e=>{if(e.key==='Escape')close()});
})();
