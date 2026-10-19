/* 전체 자료 보기: A4 문서 + 인쇄(PDF 저장) + HTML 다운로드 */
(()=>{
'use strict';
const IV=window.IV,h=IV.h,S=IV.S,D=IV.DATA;
const CSS=`
.doc{font-family:'Noto Sans KR',system-ui,-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#111;font-size:10.5pt;line-height:1.7;word-break:keep-all;overflow-wrap:anywhere}
.doc *{box-sizing:border-box;border-radius:0;box-shadow:none}
.doc h1,.doc h2,.doc h3,.doc h4,.doc p,.doc ul,.doc ol{margin:0}
.doc .cover{min-height:150mm;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:10mm;border-bottom:1.5px solid #111;margin-bottom:8mm}
.doc .cover h1{font-size:30pt;line-height:1.25;font-weight:700;letter-spacing:-.01em}
.doc .cover p{color:#7d828b;margin-top:4mm}
.doc .toc h2{font-size:15pt;margin:0 0 3mm}
.doc .toc a{color:#111;text-decoration:none}
.doc .toc .ch{font-weight:700;margin-top:3mm;font-size:11.5pt;display:block}
.doc .toc .it{display:block;padding-left:6mm;font-size:9.5pt;line-height:1.55;color:#111}
.doc .toc .it span{color:#7d828b}
.doc .chap{break-before:page;page-break-before:always;border-bottom:1.5px solid #111;padding-bottom:3mm;margin-bottom:6mm}
.doc .chap h1{font-size:22pt;font-weight:700}
.doc .chap p{color:#7d828b;font-size:9.5pt}
.doc .entry{margin-top:9mm}
.doc .entry>h2{font-size:14pt;line-height:1.5;font-weight:700;break-after:avoid;page-break-after:avoid}
.doc .meta{color:#7d828b;font-size:9pt;margin:1mm 0 3mm}
.doc h3{font-size:11.5pt;font-weight:700;margin:5mm 0 2mm;padding-bottom:1mm;border-bottom:1px solid #d9dbe0;break-after:avoid;page-break-after:avoid}
.doc h4{font-size:10.5pt;font-weight:700;margin:3mm 0 1mm;break-after:avoid;page-break-after:avoid}
.doc p{margin:0 0 2mm;white-space:pre-line}
.doc .mk{padding:0 6px;line-height:1.5;color:#111;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.doc .mk-g,.doc .hl-g{background:#7fe98d}.doc .mk-y,.doc .hl-y{background:#fbe24d}.doc .mk-p,.doc .hl-p{background:#f4a6ef}
.doc .mk-b,.doc .hl-b{background:#5fb6f2}.doc .mk-c,.doc .hl-c{background:#6ee7c8}.doc .mk-r,.doc .hl-r{background:#ff7b7b}
.doc .hl{color:#111;padding:0 1px}
.doc .lbl{font-weight:700}.doc .todo{background:#f3f4f6;padding:0 2px}
.doc .srcbox{border:1.5px solid #111;padding:4mm 5mm}
.doc .srcbox p:last-child{margin-bottom:0}
.doc .memo{background:#f3f4f6;padding:3mm 4mm;margin:2mm 0}
.doc .sec{margin-top:1mm}
.doc table{border-collapse:collapse;width:100%;font-size:9.5pt;margin:2mm 0 4mm;border:1px solid #111}
.doc th,.doc td{padding:1.6mm 2.4mm;border-bottom:1px solid #d9dbe0;border-right:1px solid #d9dbe0;text-align:left;vertical-align:top;line-height:1.55;white-space:pre-line}
.doc th{background:#f3f4f6;font-weight:700}
.doc tr{break-inside:avoid;page-break-inside:avoid}
.doc .tbl-wrap{overflow:visible}
.doc .qa{border:1px solid #111;padding:3mm 4mm;margin:0 0 3mm;break-inside:avoid;page-break-inside:avoid}
.doc .qa .qn{font-size:8.5pt;font-weight:700;color:#7d828b}
.doc .qa .qq{font-size:11pt;font-weight:700;line-height:1.6;margin:0 0 2mm}
.doc .qa .ans{background:#f3f4f6;padding:2mm 3mm}
.doc .qa .k{font-size:8.5pt;font-weight:700;color:#7d828b;margin:0}
.doc .rc{border:1px solid #111;padding:3mm 4mm;margin:0 0 3mm;break-inside:avoid;page-break-inside:avoid}
.doc .rc h4{margin:0 0 1mm;font-size:11pt}
.doc .badge{display:inline-block;border:1px solid #111;font-size:8pt;padding:0 5px;margin-right:2mm;line-height:1.6}
.doc .use{border-top:1px solid #d9dbe0;margin-top:2mm;padding-top:2mm}
.doc .use .w{font-weight:700;font-size:9.5pt}
.doc .gal{display:grid;grid-template-columns:repeat(2,1fr);gap:3mm;margin:2mm 0}
.doc .gal img{width:100%;border:1px solid #d9dbe0;display:block}
.doc .muted{color:#7d828b}
.doc ul.q{padding-left:5mm}
`;
const mk=(t,subj)=>h('span',{class:'mk mk-'+IV.subjColor(subj)},t);
const pgs=t=>(t||'').split(/\n+/).filter(x=>x.trim());
const star=n=>'★'.repeat(n)+'☆'.repeat(3-n);
const refKey=r=>'ref:'+r.name.replace(/\s+/g,'').slice(0,40);

function buildRefIndex(){return IV.refIndex?IV.refIndex():[]}
function entryDoc(e,no){
  const x=h('section',{class:'entry',id:'e-'+e.id});
  x.append(h('h2',null,`${no}  `,mk(IV.label(e).replace(/^\d학년 /,''),e.subject)));
  x.append(h('p',{class:'meta'},`${e.grade}학년 · ${e.group||''} · 중요도 ${star(IV.imp(e))}${e.subtitle?' · '+e.subtitle:''}`));
  if(e.images.length){x.append(h('h3',null,'카드뉴스'));e.images.forEach(g=>{if(g.cap)x.append(h('h4',null,g.cap));x.append(h('div',{class:'gal'},g.src.map(s=>h('img',{src:s,alt:g.cap||'카드뉴스'}))))})}
  if(e.pre.length)x.append(h('div',{class:'memo'},IV.renderBlocks(e.pre,e.id,'pre-')));
  x.append(h('h3',null,'생기부 원문'));
  const src=IV.getSrc(e);
  if(src.trim()){const b=h('div',{class:'srcbox'});pgs(src).forEach((p,i)=>b.append(IV.leaf('p',p.trim(),`${e.id}:src${i}`)));x.append(b)}
  else{
    x.append(h('p',{class:'muted'},'원문이 아직 없어요. (자료 파일에 원문 상자가 없었던 활동)'));
    if(e.quotes.length){x.append(h('h4',null,'자료에서 뽑은 생기부 문구'),h('ul',{class:'q'},e.quotes.map((q,i)=>h('li',null,IV.leaf('span',q,`${e.id}:quote${i}`)))))}
  }
  x.append(h('h3',null,'면접 준비 자료'));
  if(!e.secs.length)x.append(h('p',{class:'muted'},'정리된 면접 자료가 없어요.'));
  e.secs.forEach(s=>x.append(h('div',{class:'sec'},h('h4',null,`${s.k}. ${s.name}`),IV.renderBlocks(s.blocks,e.id,`s${s.k}-`))));
  if(e.extra6.length)x.append(h('div',{class:'sec'},h('h4',null,'추가 점검 사항'),h('div',{class:'memo'},IV.renderBlocks(e.extra6,e.id,'x-'))));
  if(e.refname||e.refblocks.length||e.refs.length){
    x.append(h('h3',null,'참고자료'));
    if(e.refname)x.append(h('h4',null,e.refname));
    if(e.refblocks.length)x.append(IV.renderBlocks(e.refblocks,e.id,'r-'));
    const curated=e.refs.filter(r=>!e.refblocks.some(b=>b.t==='table'&&JSON.stringify(b.rows).includes(r.name.slice(0,12))));
    if(curated.length){x.append(h('h4',null,'정리된 자료 목록'));curated.forEach((r,i)=>x.append(h('div',{class:'rc'},h('h4',null,IV.leaf('span',r.name,`${e.id}:cur${i}n`)),h('div',null,h('span',{class:'badge'},r.kind),r.mention?h('span',{class:'badge'},r.mention):null),r.use?IV.leaf('p',r.use,`${e.id}:cur${i}u`):null)))}
  }
  if(e.qs.length){
    x.append(h('h3',null,`예상질문 ${e.qs.length}개`));
    e.qs.forEach((q,i)=>{
      const a=h('div',{class:'ans'},h('p',{class:'k'},'답변 방향'),IV.leaf('p',q.a,`${e.id}:q${i}a`));
      if(q.f)a.append(h('p',{class:'k',style:'margin-top:2mm'},'꼬리질문 대비 포인트'),IV.leaf('p',q.f,`${e.id}:q${i}f`));
      x.append(h('div',{class:'qa'},h('div',{class:'qn'},'Q'+(i+1)),IV.leaf('div',q.q,`${e.id}:q${i}q`,'qq'),a));
    });
  }
  return x;
}
IV.buildDoc=function(){
  const root=h('div',{class:'doc'});
  const grades=[1,2,3].map(g=>({g,es:D.filter(e=>e.grade===g)}));
  const refs=buildRefIndex();
  const nQ=D.reduce((a,e)=>a+e.qs.length,0);
  const d=new Date();
  root.append(h('section',{class:'cover'},h('h1',null,'면접 준비 자료'),h('p',null,`전체 자료집 · 활동 ${D.length}개 · 예상질문 ${nQ}개 · 참고자료 ${refs.length}개`),h('p',{style:'margin-top:1mm'},`${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()} 기준`)));
  // 목차
  const toc=h('section',{class:'toc'},h('h2',null,'목차'));
  toc.append(h('a',{class:'ch',href:'#c-intro'},'자기소개'));
  grades.forEach(({g,es})=>{toc.append(h('a',{class:'ch',href:'#c-g'+g},`${g}학년 `,h('span',{class:'muted',style:'font-weight:400'},`(${es.length}개 활동)`)));es.forEach((e,i)=>toc.append(h('a',{class:'it',href:'#e-'+e.id},`${g}-${i+1}  ${IV.label(e).replace(/^\d학년 /,'')}`)))});
  toc.append(h('a',{class:'ch',href:'#c-ref'},'참고자료 ',h('span',{class:'muted',style:'font-weight:400'},`(${refs.length}개)`)));
  root.append(toc);
  // 자기소개
  const ci=h('section',{id:'c-intro'},h('div',{class:'chap'},h('h1',null,'자기소개'),h('p',null,'대학별로 직접 작성한 자기소개')));
  window.GUIDE.forEach(u=>{
    const t=(S.intro[u.id]||'').trim();
    ci.append(h('h3',null,u.name+(t?`  ·  ${t.replace(/\s/g,'').length}자`:'')));
    if(t){const b=h('div',{class:'srcbox'});pgs(t).forEach((p,i)=>b.append(IV.leaf('p',p.trim(),`intro:${u.id}:${i}`)));ci.append(b)}
    else ci.append(h('p',{class:'muted'},'아직 작성하지 않았어요.'));
  });
  root.append(ci);
  grades.forEach(({g,es})=>{
    const c=h('section',{id:'c-g'+g},h('div',{class:'chap'},h('h1',null,`${g}학년`),h('p',null,`활동 ${es.length}개 · 예상질문 ${es.reduce((a,e)=>a+e.qs.length,0)}개`)));
    es.forEach((e,i)=>c.append(entryDoc(e,`${g}-${i+1}`)));root.append(c);
  });
  const cr=h('section',{id:'c-ref'},h('div',{class:'chap'},h('h1',null,'참고자료'),h('p',null,`논문·책·기사·도구 등 ${refs.length}개 · 사용된 활동별 정리`)));
  refs.forEach((r,i)=>{
    const key=refKey(r);
    const c=h('div',{class:'rc'},h('div',null,h('span',{class:'badge'},r.kind),h('span',{class:'badge'},r.uses.length>1?`${r.uses.length}곳에서 사용`:'1곳에서 사용')),h('h4',null,IV.leaf('span',r.name,key+':n')));
    if(r.desc)c.append(IV.leaf('p',r.desc,key+':d'));
    r.uses.forEach((u,j)=>{
      const w=h('div',{class:'use'},h('div',{class:'w'},IV.label(u.e),u.mention?'  ·  '+u.mention:''));
      if(u.use)w.append(h('p',null,h('span',{class:'lbl'},'활용 내용  '),IV.leaf('span',u.use,`${key}:u${j}`)));
      if(u.note)w.append(h('p',{class:'muted'},h('span',{class:'lbl'},'확인할 것  '),IV.leaf('span',u.note,`${key}:o${j}`)));
      c.append(w);
    });
    cr.append(c);
  });
  root.append(cr);
  return root;
};
async function inline(root){
  const imgs=[...root.querySelectorAll('img')];
  await Promise.all(imgs.map(async im=>{
    try{const r=await fetch(im.getAttribute('src'));const b=await r.blob();const u=await new Promise(res=>{const f=new FileReader();f.onload=()=>res(f.result);f.readAsDataURL(b)});im.setAttribute('src',u)}catch(e){}
  }));
}
const PAGECSS=`@page{size:A4;margin:16mm 15mm}html,body{margin:0;background:#fff}body{padding:0}.doc{max-width:180mm;margin:0 auto}
@media screen{body{padding:12mm 8mm}}`;
IV.docHTML=async function(){
  const root=IV.buildDoc();await inline(root);
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>면접 준비 자료</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap"><style>${CSS}${PAGECSS}</style></head><body>${root.outerHTML}</body></html>`;
};
IV.renderDoc=function(main,V){
  const wrap=h('div',{class:'wrap',style:'max-width:none'});main.append(wrap);
  const bar=h('div',{class:'topbar'},h('h1',null,'전체 자료'),IV.searchBtn());
  const info=h('p',{class:'muted small',style:'margin:0 0 10px'},'A4 규격 문서로 전체 자료를 한 번에 봐요. 내가 칠한 하이라이트와 수정한 원문, 자기소개도 반영돼요.');
  const stat=h('span',{class:'muted small'});
  const b1=h('button',{class:'btn primary',type:'button'},'PDF로 저장 (인쇄)'),b2=h('button',{class:'btn',type:'button'},'HTML 파일 다운로드');
  const acts=h('div',{style:'display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px'},b1,b2,stat);
  wrap.append(bar,info,acts);
  const stage=h('div',{style:'background:#f3f4f6;padding:12px 0;overflow:hidden'});
  const paper=h('div',{class:'paper',style:'width:210mm;margin:0 auto;background:#fff;border:1.5px solid #111;padding:16mm 15mm;transform-origin:top left'});
  const root=IV.buildDoc();
  const style=h('style',null,CSS);
  paper.append(style,root);stage.append(paper);wrap.append(stage);
  root.addEventListener('click',ev=>{const a=ev.target.closest('a[href^="#"]');if(!a)return;ev.preventDefault();const t=root.querySelector(a.getAttribute('href'));if(t)t.scrollIntoView({block:'start'})});
  function fit(){
    const pw=210*96/25.4;const avail=stage.clientWidth-8;const z=Math.min(1,avail/pw);
    paper.style.transform=`scale(${z})`;paper.style.marginLeft=Math.max(0,(stage.clientWidth-pw*z)/2)+'px';
    stage.style.height=(paper.offsetHeight*z+24)+'px';
    const pageH=(297-32)*96/25.4;
    stat.textContent=`약 ${Math.ceil(paper.offsetHeight/pageH)}쪽`;
  }
  requestAnimationFrame(()=>{fit();setTimeout(fit,400)});
  const onR=()=>{if(document.body.contains(paper))fit();else removeEventListener('resize',onR)};addEventListener('resize',onR);
  b2.addEventListener('click',async()=>{
    b2.disabled=true;b2.textContent='만드는 중…';
    try{const html=await IV.docHTML();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));a.download='면접준비자료.html';document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);IV.toast('다운로드했어요. 열어서 인쇄하면 PDF로도 저장돼요.')}
    catch(e){IV.toast('다운로드하지 못했어요.')}
    b2.disabled=false;b2.textContent='HTML 파일 다운로드';
  });
  b1.addEventListener('click',async()=>{
    b1.disabled=true;b1.textContent='준비 중…';
    try{
      const html=await IV.docHTML();
      const fr=document.createElement('iframe');fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';
      fr.onload=()=>{setTimeout(()=>{try{fr.contentWindow.focus();fr.contentWindow.print()}catch(e){IV.toast('인쇄 창을 열지 못했어요. HTML 파일을 다운로드해서 열어 주세요.')}setTimeout(()=>fr.remove(),60000)},600)};
      document.body.append(fr);fr.srcdoc=html;
    }catch(e){IV.toast('인쇄를 준비하지 못했어요.')}
    b1.disabled=false;b1.textContent='PDF로 저장 (인쇄)';
  });
};
})();
