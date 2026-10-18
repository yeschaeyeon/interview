/* 자료 메뉴 + 라우팅 */
(()=>{
'use strict';
const IV=window.IV,h=IV.h,D=IV.DATA,S=IV.S;
const main=document.getElementById('main');
const V=IV.V={tab:'mat',mat:{view:'home',grade:1,subject:'',eid:null,rtab:'mat',pane:'mat',mask:false},refs:{g:0,k:'전체',q:''},mock:{view:'setup',rid:null}};
const GROUPS=[['창체','창의적 체험활동'],['교과','교과 · 학교자율과정']];
const IMPTXT={1:'낮음',2:'보통',3:'높음'};
const impDots=n=>h('span',{class:'imp','data-v':n,title:'중요도 '+n},h('i'),h('i'),h('i'));
const mark=(txt,sub)=>h('span',{class:'mk mk-'+IV.subjColor(sub)},txt);
const chevron=()=>h('span',{class:'chev','aria-hidden':'true'},'›');

IV.render=function render(){
  const nm=document.getElementById('nav-mat'),nk=document.getElementById('nav-mock');
  nm.setAttribute('aria-current',V.tab==='mat'?'page':'false');nk.setAttribute('aria-current',V.tab==='mock'?'page':'false');
  main.classList.remove('fill');IV.clear(main);main.scrollTop=0;
  if(IV.releaseAudio)IV.releaseAudio();
  if(V.tab==='mat')renderMat();else IV.renderMock(main,V);
};
document.getElementById('nav-mat').addEventListener('click',()=>{if(V.tab==='mat'&&V.mat.view==='home')return;V.tab='mat';V.mat.view='home';IV.render()});
document.getElementById('nav-mock').addEventListener('click',()=>{if(V.tab==='mock'&&V.mock.view==='setup')return;V.tab='mock';V.mock.view='setup';IV.render()});

function topbar(title,onBack,right){
  return h('div',{class:'topbar'},onBack?h('button',{class:'back',type:'button','aria-label':'뒤로',on:{click:onBack}},'‹'):null,h('h1',null,title),right||null);
}

function renderMat(){
  const M=V.mat;
  if(M.view==='home')return matHome();
  if(M.view==='grade')return matGrade();
  if(M.view==='subject')return matSubject();
  if(M.view==='refs')return refLibrary();
}

/* ---------- 홈 ---------- */
function matHome(){
  const wrap=h('div',{class:'wrap'});
  wrap.append(h('div',{class:'hello'},h('h2',null,'면접 자료'),h('p',{class:'muted',style:'margin:0 0 16px'},'학년을 고르면 과목이 나오고, 과목을 고르면 생기부 원문과 면접 준비 자료를 나란히 볼 수 있어요.')));
  const tiles=h('div',{class:'tiles'});
  for(const g of[1,2,3]){
    const es=D.filter(e=>e.grade===g);const subj=new Set(es.map(e=>e.subject));
    const nq=es.reduce((a,e)=>a+e.qs.length,0);
    tiles.append(h('button',{class:'tile',type:'button',on:{click:()=>{V.mat.view='grade';V.mat.grade=g;IV.render()}}},
      h('span',{class:'big'},g+'학년'),h('span',{class:'sub'},`과목 ${subj.size}개 · 활동 ${es.length}개`),h('span',{class:'sub'},`예상질문 ${nq}개`)));
  }
  const nref=refIndex().length;
  tiles.append(h('button',{class:'tile ref',type:'button',on:{click:()=>{V.mat.view='refs';IV.render()}}},
    h('span',{class:'big'},'참고자료'),h('span',{class:'sub'},'책 · 논문 · 기사 등 생기부에 들어간 자료'),h('span',{class:'sub'},`${nref}건`)));
  wrap.append(tiles);
  main.append(wrap);
}

/* ---------- 학년 → 과목 ---------- */
function matGrade(){
  const M=V.mat,wrap=h('div',{class:'wrap'});
  wrap.append(topbar(M.grade+'학년',()=>{M.view='home';IV.render()}));
  for(const [gk,gn] of GROUPS){
    const subs=[];const seen=new Set();
    D.filter(e=>e.grade===M.grade&&e.group===gk).forEach(e=>{if(!seen.has(e.subject)){seen.add(e.subject);subs.push(e.subject)}});
    if(!subs.length)continue;
    wrap.append(h('div',{class:'group-h'},gn));
    const list=h('div',{class:'list'});
    for(const s of subs){
      const es=D.filter(e=>e.grade===M.grade&&e.subject===s);
      const sub=es.map(e=>e.activity).filter(Boolean).join(' · ');
      list.append(h('button',{class:'row',type:'button',on:{click:()=>{M.view='subject';M.subject=s;M.eid=es[0].id;M.rtab='mat';M.pane='mat';M.mask=false;IV.render()}}},
        h('span',{class:'t'},es.every(IV.isDone)?mark(s,s):s,sub?h('small',null,sub):null),
        h('span',{class:'imps',style:'display:flex;gap:8px'},es.map(e=>impDots(IV.imp(e)))),
        h('span',{class:'muted small'},`완료 ${es.filter(IV.isDone).length}/${es.length}`),chevron()));
    }
    wrap.append(list);
  }
  main.append(wrap);
}

/* ---------- 블록 렌더 ---------- */
function renderBlocks(blocks,scope,pfx){
  const f=document.createDocumentFragment();
  blocks.forEach((b,i)=>{
    if(b.t==='p'){
      f.append(b.h?IV.leaf('h4',b.text,`${scope}:${pfx}p${i}`,'sub'):IV.leaf('p',b.text,`${scope}:${pfx}p${i}`,'',{label:true}));
    }else{
      const t=h('table');const rows=b.rows;
      const th=h('thead');const hr=h('tr');rows[0].forEach((c,ci)=>hr.append(IV.leaf('th',c,`${scope}:${pfx}t${i}r0c${ci}`)));th.append(hr);t.append(th);
      const tbd=h('tbody');
      rows.slice(1).forEach((r,ri)=>{const tr=h('tr');r.forEach((c,ci)=>tr.append(IV.leaf('td',c,`${scope}:${pfx}t${i}r${ri+1}c${ci}`)));tbd.append(tr)});
      t.append(tbd);f.append(h('div',{class:'tbl-wrap'},t));
    }
  });
  return f;
}
function lightbox(src){
  const bg=h('div',{class:'lightbox',on:{click:()=>bg.remove()}},h('img',{src,alt:'카드뉴스'}));document.body.append(bg);
}

/* ---------- 과목 분할 화면 ---------- */
function matSubject(){
  const M=V.mat;main.classList.add('fill');
  const es=D.filter(e=>e.grade===M.grade&&e.subject===M.subject);
  const e=IV.byId[M.eid]||es[0];M.eid=e.id;
  const head=h('div',{class:'wrap',style:'width:100%;max-width:none;flex:none'});
  head.append(topbar(`${M.grade}학년 · ${M.subject}`,()=>{M.view='grade';IV.render()},
    h('div',{class:'seg mobpane',role:'group','aria-label':'보기 전환'},
      h('button',{type:'button','aria-pressed':M.pane==='src',on:{click:()=>{M.pane='src';sync()}}},'원문'),
      h('button',{type:'button','aria-pressed':M.pane==='mat',on:{click:()=>{M.pane='mat';sync()}}},'자료'))));
  const bar=h('div',{class:'subj-head'});
  if(es.length>1){
    const chips=h('div',{class:'chips'});
    es.forEach(x=>chips.append(h('button',{class:'chip',type:'button','aria-pressed':x.id===e.id,on:{click:()=>{M.eid=x.id;M.rtab='mat';M.mask=false;IV.render()}}},IV.isDone(x)?mark(x.activity||x.subject,x.subject):(x.activity||x.subject))));
    bar.append(chips);
  }
  const imps=h('div',{class:'seg imps',role:'group','aria-label':'중요도'});
  [1,2,3].forEach(v=>imps.append(h('button',{type:'button',dataset:{v},'aria-pressed':IV.imp(e)===v,title:'중요도 '+v+' ('+IMPTXT[v]+')',on:{click:()=>{S.imp[e.id]=v;IV.save();[...imps.children].forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===v)))}}},'중요도 '+v)));
  const doneBtn=h('button',{class:'btn sm',type:'button','aria-pressed':IV.isDone(e),on:{click:()=>{if(IV.isDone(e))delete S.done[e.id];else S.done[e.id]=true;IV.save();IV.render()}}},IV.isDone(e)?'완료 취소':'완료 표시');
  bar.append(h('span',{class:'muted small'},'면접에서 나올 가능성이 높을수록 3'),imps,doneBtn);
  head.append(bar);
  const ttl=(e.activity||e.subject)+(e.subtitle.length?' — '+e.subtitle.join(' / '):'');
  head.append(h('p',{class:'entry-title'},IV.isDone(e)?mark(ttl,e.subject):ttl));
  const split=h('div',{class:'split','data-pane':M.pane});
  split.append(srcPane(e),matPane(e));
  function sync(){split.dataset.pane=M.pane;[...head.querySelectorAll('.mobpane button')].forEach((b,i)=>b.setAttribute('aria-pressed',String((i===0)===(M.pane==='src'))))}
  main.append(head,split);
}

/* 왼쪽: 생기부 원문 */
function srcPane(e){
  const pane=h('section',{class:'pane pane-src hl-scope','aria-label':'생기부 원문'});
  const body=h('div');
  const text=IV.getSrc(e);
  function view(){
    IV.clear(body);
    const txt=IV.getSrc(e);
    body.append(h('h3',{class:'ph'},'생기부 원문'));
    if(txt.trim()){
      const src=h('div',{class:'src'});
      txt.split(/\n+/).filter(s=>s.trim()).forEach((p,i)=>src.append(IV.leaf('p',p.trim(),`${e.id}:src${i}`)));
      body.append(src,h('button',{class:'btn sm',type:'button',on:{click:edit}},'원문 수정'));
    }else{
      body.append(h('div',{class:'callout'},h('b',null,'원문이 아직 없어요'),h('span',{class:'muted'},'이 활동은 자료 파일에 생기부 원문 상자가 없었어요. 생기부 문장을 붙여넣으면 이 기기에 저장돼요.')),
        h('button',{class:'btn primary sm',type:'button',on:{click:edit}},'원문 붙여넣기'));
      if(e.quotes.length){
        body.append(h('h3',{class:'ph',style:'margin-top:22px'},'자료에서 뽑은 생기부 문구'),
          h('ul',{class:'quote-list'},e.quotes.map((q,i)=>h('li',null,IV.leaf('span',q,`${e.id}:quote${i}`)))));
      }
    }
  }
  function edit(){
    IV.clear(body);
    const ta=h('textarea',{class:'src-edit',id:'src-edit','aria-label':'생기부 원문',placeholder:'생기부 원문을 붙여넣으세요. 문단은 줄바꿈으로 나뉩니다.',value:text&&IV.getSrc(e)});
    body.append(h('h3',{class:'ph'},'생기부 원문 입력'),ta,h('div',{style:'display:flex;gap:8px;margin-top:10px'},
      h('button',{class:'btn primary',type:'button',on:{click:()=>{
        const v=ta.value.trim();if(v!==IV.getSrc(e).trim())IV.clearHLPrefix(e.id+':src');
        S.src[e.id]=v;IV.save();view();IV.toast('원문을 저장했어요')}}},'저장'),
      h('button',{class:'btn',type:'button',on:{click:view}},'취소')));
    ta.focus();
  }
  view();pane.append(body);return pane;
}

/* 오른쪽: 면접 준비 자료 */
function matPane(e){
  const M=V.mat;
  const pane=h('section',{class:'pane pane-mat hl-scope','aria-label':'면접 준비 자료'});
  const tabs=h('div',{class:'tabs',role:'tablist'});
  const content=h('div');
  const defs=[['mat','면접 자료'],['ref','참고자료'+(e.refs.length?` ${e.refs.length}`:'')],['q',`예상질문 ${e.qs.length}`]];
  function show(){
    [...tabs.children].forEach((b,i)=>b.setAttribute('aria-selected',String(defs[i][0]===M.rtab)));
    IV.clear(content);
    if(M.rtab==='mat')content.append(matTab(e));
    else if(M.rtab==='ref')content.append(refTab(e));
    else content.append(qTab(e));
  }
  defs.forEach(([k,n])=>tabs.append(h('button',{type:'button',role:'tab',on:{click:()=>{M.rtab=k;show();pane.scrollTop=0}}},n)));
  pane.append(tabs,content);show();return pane;
}
function matTab(e){
  const f=h('div');
  if(e.images.length){
    e.images.forEach((g,gi)=>{
      if(g.cap)f.append(h('h4',{class:'sub'},g.cap));
      f.append(h('div',{class:'gallery'},g.src.map(s=>h('img',{src:s,alt:g.cap||'카드뉴스',loading:'lazy',on:{click:()=>lightbox(s)}}))));
    });
  }
  if(e.pre.length)f.append(h('div',{class:'memo'},renderBlocks(e.pre,e.id,'pre-')));
  if(!e.secs.length&&!e.images.length)f.append(h('p',{class:'muted'},'정리된 면접 자료가 없어요.'));
  e.secs.forEach(s=>f.append(h('div',{class:'sec'},h('h3',null,`${s.k}. ${s.name}`),renderBlocks(s.blocks,e.id,`s${s.k}-`))));
  return f;
}
function refTab(e){
  const f=h('div');
  if(e.refname)f.append(h('h3',{style:'margin:0 0 8px;font-size:16px'},e.refname));
  if(e.refblocks.length)f.append(renderBlocks(e.refblocks,e.id,'r-'));
  const curated=e.refs.filter(r=>!e.refblocks.some(b=>b.t==='table'&&JSON.stringify(b.rows).includes(r.name.slice(0,12))));
  if(curated.length){
    f.append(h('h4',{class:'sub',style:'margin-top:18px'},'정리된 자료 목록'));
    curated.forEach((r,i)=>f.append(h('div',{class:'rcard'},h('h3',null,IV.leaf('span',r.name,`${e.id}:cur${i}n`)),
      h('div',null,h('span',{class:'badge'},r.kind),r.mention?h('span',{class:'badge m'},r.mention):null),
      r.use?IV.leaf('p',r.use,`${e.id}:cur${i}u`,'desc'):null)));
  }
  if(!e.refblocks.length&&!curated.length)f.append(h('p',{class:'muted'},'이 활동에 정리된 참고자료가 없어요.'));
  return f;
}
function qTab(e){
  const M=V.mat,f=h('div',{class:'qwrap'+(M.mask?' masked':'')});
  if(!e.qs.length){f.append(h('p',{class:'muted'},'이 활동에는 예상질문이 없어요.'));return f}
  const btn=h('button',{class:'btn sm',type:'button',on:{click:()=>{M.mask=!M.mask;f.classList.toggle('masked',M.mask);f.querySelectorAll('.ans').forEach(a=>a.classList.remove('reveal'));btn.textContent=M.mask?'답변 보이기':'답변 가리기'}}},M.mask?'답변 보이기':'답변 가리기');
  f.append(h('div',{class:'qbar'},h('span',{class:'muted small'},'가린 답변은 눌러서 하나씩 확인해요'),btn));
  e.qs.forEach((q,i)=>{
    const ans=h('div',{class:'ans',on:{click:()=>{if(f.classList.contains('masked'))ans.classList.add('reveal')}}},
      h('p',{class:'k'},'답변 방향'),IV.leaf('p',q.a,`${e.id}:q${i}a`));
    if(q.f)ans.append(h('p',{class:'k',style:'margin-top:8px'},'꼬리질문 대비 포인트'),IV.leaf('p',q.f,`${e.id}:q${i}f`));
    f.append(h('div',{class:'qcard'},h('div',{class:'qn'},'Q'+(i+1)),IV.leaf('div',q.q,`${e.id}:q${i}q`,'qq'),ans));
  });
  return f;
}

/* ---------- 참고자료 모아보기 ---------- */
let _idx=null;
function refIndex(){
  if(_idx)return _idx;
  const m=new Map();
  D.forEach(e=>e.refs.forEach(r=>{
    const key=r.name.replace(/\s+/g,'');
    if(!m.has(key))m.set(key,{name:r.name,kind:r.kind,desc:r.desc||'',uses:[]});
    const it=m.get(key);if(r.desc&&!it.desc)it.desc=r.desc;
    it.uses.push({e,use:r.use,mention:r.mention,note:r.note});
  }));
  _idx=[...m.values()].sort((a,b)=>a.uses[0].e.grade-b.uses[0].e.grade||D.indexOf(a.uses[0].e)-D.indexOf(b.uses[0].e));
  return _idx;
}
function refLibrary(){
  const R=V.refs,M=V.mat,wrap=h('div',{class:'wrap'});
  wrap.append(topbar('참고자료',()=>{M.view='home';IV.render()}));
  const all=refIndex();
  const kinds=['전체',...new Set(all.map(r=>r.kind))];
  const filt=h('div',{class:'filters'});
  const gc=h('div',{class:'chips'},[[0,'전체 학년'],[1,'1학년'],[2,'2학년'],[3,'3학년']].map(([g,n])=>h('button',{class:'chip',type:'button','aria-pressed':R.g===g,on:{click:()=>{R.g=g;redraw()}}},n)));
  const kc=h('div',{class:'chips'},kinds.map(k=>h('button',{class:'chip',type:'button','aria-pressed':R.k===k,on:{click:()=>{R.k=k;redraw()}}},k)));
  const q=h('input',{class:'search',type:'search',id:'ref-q',placeholder:'제목, 과목, 내용으로 검색','aria-label':'참고자료 검색',value:R.q,on:{input:()=>{R.q=q.value;drawList()}}});
  filt.append(gc,kc,q);wrap.append(filt);
  const list=h('div');wrap.append(list);
  function redraw(){[...gc.children].forEach((b,i)=>b.setAttribute('aria-pressed',String([0,1,2,3][i]===R.g)));[...kc.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(kinds[i]===R.k)));drawList()}
  function drawList(){
    IV.clear(list);
    const needle=R.q.trim().toLowerCase();
    const res=all.map(r=>({r,uses:r.uses.filter(u=>!R.g||u.e.grade===R.g)})).filter(({r,uses})=>uses.length&&(R.k==='전체'||r.kind===R.k)&&
      (!needle||(r.name+' '+uses.map(u=>u.use+' '+u.note+' '+u.mention+' '+IV.label(u.e)).join(' ')+' '+r.desc).toLowerCase().includes(needle)));
    list.append(h('p',{class:'muted small'},`${res.length}건`));
    if(!res.length)list.append(h('div',{class:'empty'},'조건에 맞는 참고자료가 없어요.'));
    const scope=h('div',{class:'hl-scope'});
    res.forEach(({r,uses},i)=>{
      const key='ref:'+r.name.replace(/\s+/g,'').slice(0,40);
      const c=h('div',{class:'rcard'},h('div',null,h('span',{class:'badge'},r.kind),h('span',{class:'badge m'},uses.length>1?`${uses.length}곳에서 사용`:'1곳에서 사용')),
        IV.leaf('h3',r.name,key+':n'));
      if(r.desc)c.append(IV.leaf('p',r.desc,key+':d','desc'));
      uses.forEach((u,j)=>{
        const w=h('div',{class:'use'},h('div',{class:'where'},
          h('button',{type:'button',on:{click:()=>{M.view='subject';M.grade=u.e.grade;M.subject=u.e.subject;M.eid=u.e.id;M.rtab='ref';M.pane='mat';M.mask=false;V.tab='mat';IV.render()}}},IV.label(u.e)),
          u.mention?h('span',{class:'badge m'},u.mention):null));
        if(u.use)w.append(h('p',null,h('span',{class:'lbl'},'활용 내용  '),IV.leaf('span',u.use,`${key}:u${j}`)));
        if(u.note)w.append(h('p',{class:'muted small'},h('span',{class:'lbl'},'확인할 것  '),IV.leaf('span',u.note,`${key}:o${j}`)));
        c.append(w);
      });
      scope.append(c);
    });
    list.append(scope);
  }
  drawList();main.append(wrap);
}

IV.render();
})();
