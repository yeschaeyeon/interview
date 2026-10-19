/* 전체 검색: 글자 단위(부분 일치). 공백 무시, 대소문자 무시 */
(()=>{
'use strict';
const IV=window.IV,h=IV.h,S=IV.S,D=IV.DATA;
let corpus=null;
const norm=s=>s.toLowerCase();
function blocksText(bl){const o=[];(bl||[]).forEach(b=>{if(b.t==='table')b.rows.forEach(r=>o.push(r.join(' · ')));else if(b.text)b.text.split(/\n+/).forEach(x=>o.push(x))});return o}
function build(){
  const C=[];
  const add=(where,sub,text,go)=>{text=(text||'').trim();if(text)C.push({where,sub,text,go})};
  const toE=(e,rtab,pane)=>()=>{const M=IV.V.mat;IV.V.tab='mat';M.view='subject';M.grade=e.grade;M.subject=e.subject;M.eid=e.id;M.rtab=rtab;M.pane=pane;M.mask=false;IV.render()};
  D.forEach(e=>{
    const w=IV.label(e);
    IV.getSrc(e).split(/\n+/).forEach(p=>add(w,'생기부 원문',p,toE(e,'mat','src')));
    add(w,'제목',[e.subtitle,e.activity].filter(Boolean).join(' '),toE(e,'mat','mat'));
    blocksText(e.pre).forEach(t=>add(w,'면접 자료 · 메모',t,toE(e,'mat','mat')));
    e.secs.forEach(s=>{add(w,'면접 자료 · '+s.name,s.name,toE(e,'mat','mat'));blocksText(s.blocks).forEach(t=>add(w,'면접 자료 · '+s.name,t,toE(e,'mat','mat')))});
    blocksText(e.extra6).forEach(t=>add(w,'면접 자료 · 추가 점검',t,toE(e,'mat','mat')));
    add(w,'참고자료',e.refname,toE(e,'ref','mat'));
    blocksText(e.refblocks).forEach(t=>add(w,'참고자료',t,toE(e,'ref','mat')));
    e.refs.forEach(r=>add(w,'참고자료 · '+r.name,[r.name,r.kind,r.mention,r.use,r.note,r.desc].filter(Boolean).join(' / '),toE(e,'ref','mat')));
    e.qs.forEach((q,i)=>{add(w,`예상질문 Q${i+1}`,q.q,toE(e,'q','mat'));add(w,`예상질문 Q${i+1} · 답변`,q.a,toE(e,'q','mat'));add(w,`예상질문 Q${i+1} · 꼬리질문`,q.f,toE(e,'q','mat'))});
  });
  window.GUIDE.forEach(u=>{
    const go=()=>{IV.V.tab='guide';IV.V.guide.view='univ';IV.V.guide.id=u.id;IV.render()};
    add('가이드 · '+u.name,'한눈에 보기',u.name+' '+u.track,go);
    u.facts.forEach(f=>add('가이드 · '+u.name,'한눈에 보기',f.join(': '),go));
    u.secs.forEach(s=>{add('가이드 · '+u.name,s.t,s.t,go);s.b.forEach(b=>{if(b.t==='table')b.rows.forEach(r=>add('가이드 · '+u.name,s.t,r.join(' · '),go));else if(b.t==='ol')b.x.forEach(x=>add('가이드 · '+u.name,s.t,x,go));else add('가이드 · '+u.name,s.t,b.x,go)})});
    const n=S.notes['u:'+u.id];if(n)n.split(/\n+/).forEach(t=>add('가이드 · '+u.name,'내 메모',t,go));
  });
  window.APPENDIX.forEach(a=>{
    const go=()=>{IV.V.tab='guide';IV.V.guide.view='appx';IV.V.guide.id=a.id;IV.render()};
    add('부록 · '+a.name,'소개',a.desc,go);
    a.secs.forEach(s=>{add('부록 · '+a.name,s.t,s.t,go);s.b.forEach(b=>{if(b.t==='table')b.rows.forEach(r=>add('부록 · '+a.name,s.t,r.join(' · '),go));else if(b.t==='ol'||b.t==='ul')b.x.forEach(x=>add('부록 · '+a.name,s.t,x,go));else add('부록 · '+a.name,s.t,b.x,go)})});
    const n=S.notes['a:'+a.id];if(n)n.split(/\n+/).forEach(t=>add('부록 · '+a.name,'메모',t,go));
  });
  window.GUIDE.forEach(u=>{const t=S.intro[u.id];if(t)t.split(/\n+/).forEach(x=>add('자기소개',u.name,x,()=>{IV.V.tab='mat';IV.V.mat.view='intro';IV.V.mat.introU=u.id;IV.render()}))});
  return C;
}
/* 공백을 지운 문자열에서 찾고 원래 위치로 되돌리기 */
function find(text,q){
  const idx=[];let t='';for(let i=0;i<text.length;i++){if(!/\s/.test(text[i])){t+=text[i].toLowerCase();idx.push(i)}}
  const n=q.toLowerCase().replace(/\s+/g,'');if(!n)return null;
  const p=t.indexOf(n);if(p<0)return null;
  let cnt=0,from=0;while((from=t.indexOf(n,from))>=0){cnt++;from+=n.length}
  return{s:idx[p],e:idx[p+n.length-1]+1,count:cnt};
}
IV.invalidateSearch=()=>{corpus=null};
IV.searchBtn=()=>{const b=h('button',{class:'back',type:'button','aria-label':'검색',title:'검색',on:{click:()=>{const V=IV.V;if(V.tab!=='search')V.search.from=V.tab;V.tab='search';IV.render()}}});
  b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';return b};
IV.renderSearch=function(main,V){
  corpus=null;
  const Q=V.search,wrap=h('div',{class:'wrap'});main.append(wrap);
  wrap.append(h('div',{class:'topbar'},h('button',{class:'back',type:'button','aria-label':'뒤로',on:{click:()=>{V.tab=Q.from||'mat';IV.render()}}},'‹'),h('h1',null,'검색')));
  const inp=h('input',{class:'search',type:'search',id:'gsearch',placeholder:'글자 일부만 쳐도 찾아요 (예: 분산투',value:Q.q,'aria-label':'전체 검색',autocomplete:'off'});
  inp.setAttribute('placeholder','글자 일부만 쳐도 찾아요 (예: 분산투)');
  const info=h('p',{class:'muted small',style:'margin:8px 0'});
  const list=h('div');
  wrap.append(inp,info,list);
  let tm=null;
  function draw(){
    IV.clear(list);const q=inp.value;Q.q=q;
    if(!q.trim()){info.textContent='원문, 면접 자료, 참고자료, 예상질문, 가이드, 부록, 자기소개, 메모를 한 번에 찾아요.';return}
    if(!corpus)corpus=build();
    const res=[];for(const c of corpus){const f=find(c.text,q);if(f)res.push({c,f})}
    info.textContent=res.length?`${res.length}건`+(res.length>200?' (앞 200건만 표시)':''):'결과가 없어요.';
    res.slice(0,200).forEach(({c,f})=>{
      const t=c.text,a=Math.max(0,f.s-28),b=Math.min(t.length,f.e+60);
      const row=h('button',{class:'row srow',type:'button',on:{click:()=>{Q.hit=q;c.go();setTimeout(()=>IV.flash&&IV.flash(q),30)}}},
        h('span',{class:'t'},h('small',{style:'margin:0 0 3px'},c.where+' · '+c.sub),
          h('span',{style:'font-weight:400;display:block;line-height:1.6'},(a?'…':'')+t.slice(a,f.s),h('mark',{class:'mk mk-y',style:'padding:0 1px'},t.slice(f.s,f.e)),t.slice(f.e,b)+(b<t.length?'…':''))),h('span',{class:'chev'},'›'));
      list.append(row);
    });
  }
  inp.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(draw,120)});
  draw();setTimeout(()=>{if(!Q.q)inp.focus()},0);
};
/* 이동한 화면에서 검색어를 노란색으로 표시하고 첫 위치로 스크롤 */
IV.flash=function(q){
  const n=q.toLowerCase().replace(/\s+/g,'');if(!n)return;
  const root=document.getElementById('main');let first=null;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:t=>t.parentElement&&!t.parentElement.closest('textarea,script,style,.mk-find')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT});
  const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  nodes.forEach(node=>{
    const text=node.nodeValue,f=find(text,q);if(!f)return;
    const r=document.createRange();r.setStart(node,f.s);r.setEnd(node,f.e);
    const m=document.createElement('mark');m.className='mk mk-y mk-find';m.style.padding='0 1px';
    try{r.surroundContents(m);if(!first)first=m}catch(e){}
  });
  if(first)first.scrollIntoView({block:'center'});
};
})();
