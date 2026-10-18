/* 모의면접: 설정 / 진행 / 리포트 */
(()=>{
'use strict';
const IV=window.IV,h=IV.h,D=IV.DATA,S=IV.S;
const WEIGHT={3:5,2:3,1:1};
const sess=document.getElementById('session');
const cfg={imps:new Set([1,2,3]),off:new Set(),nq:5,detail:false};
let urls=[];
IV.releaseAudio=()=>{urls.forEach(u=>URL.revokeObjectURL(u));urls=[]};
const interviewable=D.filter(e=>e.qs.length);

IV.renderMock=function(main,V){
  const M=V.mock;
  if(M.view==='setup')return setup(main,V);
  if(M.view==='reports')return reportList(main,V);
  if(M.view==='report')return reportDetail(main,V);
};
function mockTabs(V,cur){
  return h('div',{class:'seg',role:'tablist',style:'margin-bottom:14px'},
    h('button',{type:'button','aria-pressed':cur==='setup',on:{click:()=>{V.mock.view='setup';IV.render()}}},'면접 시작'),
    h('button',{type:'button','aria-pressed':cur!=='setup',on:{click:()=>{V.mock.view='reports';IV.render()}}},'리포트'));
}

/* ---------- 설정 ---------- */
function pool(){return interviewable.filter(e=>cfg.imps.has(IV.imp(e))&&!cfg.off.has(e.id))}
function setup(main,V){
  const wrap=h('div',{class:'wrap'});
  wrap.append(mockTabs(V,'setup'));
  const info=h('p',{class:'muted',style:'margin:0'});
  const startBtn=h('button',{class:'btn primary',type:'button',on:{click:()=>start()}},'모의면접 시작');
  function upd(){
    const p=pool();const nq=p.reduce((a,e)=>a+e.qs.length,0);
    info.textContent=`대상 생기부 ${p.length}개 · 예상질문 ${nq}개`;startBtn.disabled=!p.length;
  }
  const impSeg=h('div',{class:'seg imps',role:'group','aria-label':'중요도 필터'});
  [1,2,3].forEach(v=>impSeg.append(h('button',{type:'button',dataset:{v},'aria-pressed':cfg.imps.has(v),on:{click:ev=>{
    if(cfg.imps.has(v))cfg.imps.delete(v);else cfg.imps.add(v);
    ev.currentTarget.setAttribute('aria-pressed',String(cfg.imps.has(v)));upd();refreshTree()}}},'중요도 '+v)));
  const f=h('div',{class:'panel'},h('h2',null,'필터'),
    h('p',{class:'muted small',style:'margin:0 0 10px'},'여러 개를 함께 고를 수 있어요. 고른 중요도의 생기부만 출제돼요. 출제 빈도는 중요도 3 : 2 : 1 = 5 : 3 : 1 입니다.'),impSeg);
  const detailBtn=h('button',{class:'btn sm',type:'button',style:'margin-top:14px;display:block','aria-expanded':cfg.detail,on:{click:()=>{cfg.detail=!cfg.detail;tree.hidden=!cfg.detail;detailBtn.setAttribute('aria-expanded',String(cfg.detail));detailBtn.textContent=cfg.detail?'세부 선택 접기':'세부 선택'}}},cfg.detail?'세부 선택 접기':'세부 선택');
  const tree=h('div',{class:'tree',hidden:!cfg.detail});
  const boxes=[];
  function refreshTree(){boxes.forEach(({cb,e,row})=>{const ok=cfg.imps.has(IV.imp(e));row.style.opacity=ok?1:.4;cb.checked=!cfg.off.has(e.id)})}
  for(const g of[1,2,3]){
    const es=interviewable.filter(e=>e.grade===g);
    const det=h('details',{open:g===1});
    const gcb=h('input',{type:'checkbox','aria-label':g+'학년 전체',on:{click:ev=>ev.stopPropagation(),change:()=>{es.forEach(e=>gcb.checked?cfg.off.delete(e.id):cfg.off.add(e.id));refreshTree();upd()}}});
    det.append(h('summary',null,gcb,g+'학년',h('span',{class:'muted small'},`${es.length}개`)));
    let lastSubj=null;
    es.forEach(e=>{
      if(e.subject!==lastSubj){lastSubj=e.subject;det.append(h('div',{class:'sj'},e.subject))}
      const cb=h('input',{type:'checkbox',checked:!cfg.off.has(e.id),on:{change:()=>{if(cb.checked)cfg.off.delete(e.id);else cfg.off.add(e.id);gcb.checked=es.every(x=>!cfg.off.has(x.id));upd()}}});
      const row=h('label',null,cb,h('span',{style:'flex:1;min-width:0'},e.activity||e.subject),h('span',{class:'imp','data-v':IV.imp(e)},h('i'),h('i'),h('i')),h('span',{class:'muted small'},e.qs.length+'문항'));
      boxes.push({cb,e,row});det.append(row);
    });
    gcb.checked=es.every(x=>!cfg.off.has(x.id));
    tree.append(det);
  }
  f.append(detailBtn,tree);
  const nqSel=h('select',{id:'nq','aria-label':'한 화면의 질문 수',class:'btn',on:{change:()=>{cfg.nq=+nqSel.value}}},
    [3,5,7,99].map(n=>h('option',{value:n,selected:cfg.nq===n},n===99?'전체':n+'개')));
  const o=h('div',{class:'panel'},h('h2',null,'진행 방식'),
    h('label',{for:'nq',style:'display:flex;gap:10px;align-items:center;flex-wrap:wrap'},'한 생기부당 질문 수',nqSel),
    h('p',{class:'muted small',style:'margin:10px 0 0'},'녹음은 이 기기의 브라우저에만 저장돼요. 마이크 권한을 허용해 주세요.'));
  wrap.append(f,o,info,h('div',{class:'startbar'},startBtn));
  main.append(wrap);upd();refreshTree();
}

/* ---------- 녹음 ---------- */
const Rec={active:null};
async function startRec(slot){
  if(Rec.active)await stopRec();
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}
  catch(e){IV.toast('마이크를 쓸 수 없어요. 권한을 허용하고(https 또는 localhost 필요) 다시 눌러 주세요.');return false}
  let mr;try{mr=new MediaRecorder(stream)}catch(e){stream.getTracks().forEach(t=>t.stop());IV.toast('이 브라우저는 녹음을 지원하지 않아요.');return false}
  const chunks=[],t0=performance.now();
  const done=new Promise(res=>{
    mr.ondataavailable=ev=>{if(ev.data&&ev.data.size)chunks.push(ev.data)};
    mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());slot.blob=new Blob(chunks,{type:mr.mimeType||'audio/webm'});slot.recMs=performance.now()-t0;res()};
  });
  mr.start();Rec.active={mr,slot,done,t0};return true;
}
async function stopRec(){const a=Rec.active;if(!a)return;Rec.active=null;if(a.mr.state!=='inactive')a.mr.stop();await a.done}

/* ---------- 진행 ---------- */
let SS=null,tickT=null;
function buildDeck(poolArr,last){
  let items=[];poolArr.forEach(e=>{for(let i=0;i<WEIGHT[IV.imp(e)];i++)items.push(e)});
  items=IV.shuffle(items);
  if(poolArr.length>1){
    for(let i=0;i<items.length;i++){
      const prev=i?items[i-1]:last;
      if(items[i]===prev){let j=i+1;while(j<items.length&&items[j]===prev)j++;if(j<items.length)[items[i],items[j]]=[items[j],items[i]]}
    }
  }
  return items;
}
function start(){
  const p=pool();if(!p.length)return;
  SS={t0:performance.now(),pool:p,nq:cfg.nq,deck:[],last:null,records:[],imps:[...cfg.imps].sort(),phase:'intro',intro:{slot:{},spent:0,t:performance.now()},round:null};
  sess.hidden=false;document.body.style.overflow='hidden';
  clearInterval(tickT);tickT=setInterval(tick,250);draw();
}
function tick(){
  if(!SS)return;
  const c=sess.querySelector('.clock');if(c)c.textContent=IV.fmt(performance.now()-SS.t0);
  const a=Rec.active;
  sess.querySelectorAll('[data-rec-live]').forEach(el=>{if(a&&a.slot===el._slot)el.textContent='■ 정지 '+IV.fmt(performance.now()-a.t0)});
}
function nextEntry(){
  if(!SS.deck.length)SS.deck=buildDeck(SS.pool,SS.last);
  const e=SS.deck.shift();SS.last=e;
  const qs=IV.shuffle(e.qs).slice(0,SS.nq).map(q=>({q,slot:{},spent:0,status:null,visited:false,t:null}));
  SS.round={e,items:qs,idx:0};enter(0);
}
function enter(i){const r=SS.round;if(i<r.items.length){const it=r.items[i];it.visited=true;it.t=performance.now()}}
function leave(i,status){
  const it=SS.round.items[i];if(!it||it.t==null)return;
  it.spent+=performance.now()-it.t;it.t=null;it.status=status||(it.slot.blob?'answered':'skipped');
}
function finalizeRound(){
  const r=SS.round;if(!r)return;
  if(r.idx<r.items.length)leave(r.idx);
  r.items.forEach(it=>{
    if(!(it.visited||it.slot.blob))return;
    SS.records.push({kind:'q',entryId:r.e.id,tag:IV.label(r.e),q:it.q.q,a:it.q.a,f:it.q.f,status:it.status||'answered',spentMs:it.spent,recMs:it.slot.recMs||0,blob:it.slot.blob||null});
  });
  SS.round=null;
}
function recButton(slot,big){
  const rec=Rec.active&&Rec.active.slot===slot;
  const b=h('button',{class:'btn'+(rec?' rec-on':''),type:'button',on:{click:async()=>{
    if(Rec.active&&Rec.active.slot===slot){await stopRec();draw();return}
    const ok=await startRec(slot);draw();if(!ok)return;
  }}});
  if(rec){b.append(h('span',{class:'dot'}));const s=h('span',{dataset:{recLive:''}},'■ 정지 0:00');s._slot=slot;b.append(s)}
  else b.append(h('span',{class:'dot'}),slot.blob?'다시 녹음':'녹음');
  return b;
}
function draw(){
  if(!SS)return;
  IV.clear(sess);
  const top=h('div',{class:'s-top'},
    h('button',{class:'btn',type:'button',on:{click:askEnd}},'종료'),
    h('div',{class:'clock','aria-label':'경과 시간'},IV.fmt(performance.now()-SS.t0)));
  const body=h('div',{class:'s-body'});
  let foot=null;
  if(SS.phase==='intro'){
    const it=SS.intro;
    body.append(h('div',{class:'s-intro'},h('h1',null,'자기소개'),
      h('div',{class:'s-actions'},recButton(it.slot,true),
        h('button',{class:'btn primary',type:'button',on:{click:async()=>{await stopRec();leaveIntro();SS.phase='round';nextEntry();draw()}}},'다음 →')),
      it.slot.blob?h('div',{class:'recd'},'녹음됨 '+IV.fmt(it.slot.recMs)):null));
  }else{
    const r=SS.round,n=r.items.length;
    const list=h('div',{class:'s-list'});
    if(r.idx>=n){
      list.append(h('div',{class:'done-msg'},'이 생기부의 질문을 모두 마쳤어요'));
    }else{
      list.append(h('div',{class:'muted small'},`질문 ${r.idx+1} / ${n}`));
      for(let i=r.idx;i<n;i++){
        const it=r.items[i],cur=i===r.idx;
        const acts=h('div',{class:'acts'},recButton(it.slot));
        if(cur){
          acts.append(h('button',{class:'btn',type:'button',on:{click:async()=>{await stopRec();if(it.slot.blob)it.slot={};leave(r.idx,'gaveup');r.idx++;enter(r.idx);draw()}}},'답변 포기'),
            h('button',{class:'btn',type:'button','aria-label':'다음 질문',disabled:i>=n-1,on:{click:async()=>{await stopRec();leave(r.idx);r.idx++;enter(r.idx);draw()}}},'↓'));
        }
        if(it.slot.blob)acts.append(h('span',{class:'recd'},'녹음됨 '+IV.fmt(it.slot.recMs)));
        list.append(h('div',{class:'sq'+(cur?' cur':'')},h('p',{class:'qtxt'},it.q.q),acts));
      }
    }
    body.append(list);
    foot=h('div',{class:'s-foot'},h('span',{class:'muted small'},`지금까지 ${SS.records.length+r.items.filter(x=>x.visited).length}문항`),
      h('button',{class:'btn primary',type:'button',on:{click:async()=>{await stopRec();finalizeRound();nextEntry();draw();body.scrollTop=0}}},'다음'));
  }
  sess.append(top,body);if(foot)sess.append(foot);
}
function leaveIntro(){
  const it=SS.intro;const spent=performance.now()-it.t;
  SS.records.push({kind:'intro',entryId:null,tag:'자기소개',q:'자기소개',a:(S.intro.main||''),f:'',status:it.slot.blob?'answered':'skipped',spentMs:spent,recMs:it.slot.recMs||0,blob:it.slot.blob||null});
}
function askEnd(){
  IV.modal({title:'면접을 종료할까요?',body:'지금까지의 답변으로 리포트를 만들어요.',ok:'종료',cancel:'계속하기',danger:true,onOk:endSession});
}
async function endSession(){
  await stopRec();
  if(SS.phase==='intro')leaveIntro();else finalizeRound();
  const total=performance.now()-SS.t0;
  const answered=SS.records.filter(r=>r.blob||r.status!=='skipped'||r.kind==='q');
  const rep={id:'r'+Date.now(),createdAt:Date.now(),totalMs:total,rating:0,updatedAt:Date.now(),imps:SS.imps,records:SS.records};
  clearInterval(tickT);SS=null;sess.hidden=true;IV.clear(sess);document.body.style.overflow='';
  if(!rep.records.length){IV.toast('답변한 질문이 없어서 리포트를 만들지 않았어요.');IV.V.mock.view='setup';IV.render();return}
  try{await IV.reports.put(rep)}catch(e){IV.toast('리포트를 저장하지 못했어요.')}
  IV.V.tab='mock';IV.V.mock.view='report';IV.V.mock.rid=rep.id;IV.V.mock.cache=rep;IV.render();
}

/* ---------- 리포트 ---------- */
function stars(rep,onChange){
  const w=h('div',{class:'stars',role:'group','aria-label':'만족도'});
  function paint(){IV.clear(w);for(let i=1;i<=5;i++)w.append(h('button',{type:'button',class:i<=rep.rating?'on':'','aria-label':`만족도 ${i}점`,'aria-pressed':i<=rep.rating,on:{click:async ev=>{ev.stopPropagation();rep.rating=rep.rating===i?0:i;rep.updatedAt=Date.now();paint();await IV.reports.put(rep);IV.sync.schedule();onChange&&onChange()}}},'★'))}
  paint();return w;
}
const STX={answered:'답변함',gaveup:'답변 포기',skipped:'넘김'};
function counts(rep){const c={answered:0,gaveup:0,skipped:0};rep.records.forEach(r=>c[r.status]++);return c}
async function reportList(main,V){
  const wrap=h('div',{class:'wrap'});wrap.append(mockTabs(V,'reports'));
  const box=h('div');wrap.append(box);main.append(wrap);
  const reps=await IV.reports.all();
  if(!reps.length){box.append(h('div',{class:'empty'},'아직 리포트가 없어요. 모의면접을 마치면 여기에 쌓여요.'));return}
  reps.forEach(rep=>{
    const c=counts(rep);
    const card=h('div',{class:'panel'},
      h('div',{class:'rep'},
        h('button',{class:'meta',type:'button',style:'border:0;background:none;text-align:left;padding:0',on:{click:()=>{V.mock.view='report';V.mock.rid=rep.id;V.mock.cache=rep;IV.render()}}},
          h('b',null,IV.fmtDate(rep.createdAt)),
          h('div',{class:'muted small'},`총 ${IV.fmt(rep.totalMs)} · ${rep.records.length}문항`),
          h('div',{class:'stat'},(rep.videos&&rep.videos.length)?h('span',{class:'st'},'영상 '+rep.videos.length):null,c.answered?h('span',{class:'st answered'},'답변 '+c.answered):null,c.gaveup?h('span',{class:'st gaveup'},'포기 '+c.gaveup):null,c.skipped?h('span',{class:'st skipped'},'넘김 '+c.skipped):null)),
        stars(rep),
        h('button',{class:'btn sm danger',type:'button',on:{click:()=>IV.modal({title:'리포트를 삭제할까요?',body:IV.fmtDate(rep.createdAt),ok:'삭제',danger:true,onOk:async()=>{await IV.reports.del(rep.id);await IV.sync.deleteReport(rep.id);IV.render()}})}},'삭제')));
    box.append(card);
  });
}
async function reportDetail(main,V){
  const wrap=h('div',{class:'wrap'});
  wrap.append(h('div',{class:'topbar'},h('button',{class:'back',type:'button','aria-label':'리포트 목록',on:{click:()=>{V.mock.view='reports';IV.render()}}},'‹'),h('h1',null,'모의면접 리포트')));
  main.append(wrap);
  let rep=V.mock.cache;
  if(!rep||rep.id!==V.mock.rid){rep=(await IV.reports.all()).find(r=>r.id===V.mock.rid)}
  if(!rep){wrap.append(h('div',{class:'empty'},'리포트를 찾을 수 없어요.'));return}
  const c=counts(rep);
  wrap.append(h('div',{class:'panel'},h('b',null,IV.fmtDate(rep.createdAt)),
    h('div',{class:'sumgrid'},
      h('div',null,h('b',null,IV.fmt(rep.totalMs)),h('span',null,'총 소요 시간')),
      h('div',null,h('b',null,rep.records.length),h('span',null,'만난 질문')),
      h('div',null,h('b',null,c.answered),h('span',null,'답변함')),
      h('div',null,h('b',null,c.gaveup),h('span',null,'답변 포기')),
      h('div',null,h('b',null,c.skipped),h('span',null,'넘김'))),
    h('div',{style:'display:flex;gap:10px;align-items:center'},h('span',{class:'muted small'},'오늘의 만족도'),stars(rep))));
  const scope=h('div',{class:'hl-scope'});
  rep.records.forEach((r,i)=>{
    const key=`rep:${rep.id}:${i}`;
    const card=h('div',{class:'rec-card'},
      h('div',{style:'display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap'},h('span',{class:'tag'},`${i+1}. ${r.tag}`),h('span',{class:'st '+r.status},STX[r.status])),
      IV.leaf('div',r.q,key+'q','qq'),
      h('div',{class:'times'},h('span',null,'질문에 머문 시간 '+IV.fmt(r.spentMs)),r.blob?h('span',null,'녹음 길이 '+IV.fmt(r.recMs)):null));
    if(r.blob){const u=URL.createObjectURL(r.blob);urls.push(u);card.append(h('audio',{controls:true,src:u,preload:'metadata','aria-label':`${i+1}번 답변 녹음`}))}
    else card.append(h('p',{class:'muted small',style:'margin:6px 0'},r.status==='gaveup'?'답변을 포기했어요.':(r.hadAudio?'다른 기기에서 녹음한 파일이라 이 기기에서는 재생할 수 없어요.':'녹음이 없어요.')));
    if(r.a||r.f){
      const ans=h('div',{class:'ans'},h('p',{class:'k'},r.kind==='intro'?'내가 쓴 자기소개':'모범답변 (답변 방향)'),r.a?IV.leaf('p',r.a,key+'a'):null);
      if(r.f)ans.append(h('p',{class:'k',style:'margin-top:8px'},'꼬리질문 대비 포인트'),IV.leaf('p',r.f,key+'f'));
      card.append(ans);
    }else if(r.kind==='intro')card.append(h('p',{class:'muted small'},'자기소개 메뉴에 글을 쓰면 여기에 함께 보여요.'));
    scope.append(card);
  });
  wrap.append(scope);
  wrap.append(videoSection(rep));
}
function videoSection(rep){
  rep.videos=rep.videos||[];
  const box=h('div',{class:'panel',style:'margin-top:18px'});
  const inp=h('input',{type:'file',accept:'video/*',multiple:true,id:'vid-in',hidden:true,on:{change:async()=>{
    const fs=[...inp.files];if(!fs.length)return;
    fs.forEach((f,i)=>rep.videos.push({id:'v'+Date.now()+i,name:f.name,type:f.type,size:f.size,blob:f}));
    inp.value='';
    try{await IV.reports.put(rep);IV.toast(fs.length+'개 영상을 첨부했어요')}catch(e){rep.videos.splice(-fs.length);IV.toast('영상을 저장하지 못했어요. 저장 공간을 확인해 주세요.')}
    draw();}}});
  function draw(){
    IV.clear(box);
    box.append(h('h2',null,'영상 첨부'),h('p',{class:'muted small',style:'margin:0 0 10px'},'면접 연습을 찍은 영상 파일을 이 리포트에 붙여 두세요. 이 기기의 브라우저에만 저장돼요.'));
    rep.videos.forEach(v=>{
      const u=URL.createObjectURL(v.blob);urls.push(u);
      box.append(h('div',{class:'vid'},
        h('div',{class:'nm'},h('span',null,v.name,' ',h('span',{class:'muted small'},(v.size/1048576).toFixed(1)+'MB')),
          h('button',{class:'btn sm danger',type:'button',on:{click:()=>IV.modal({title:'영상을 삭제할까요?',body:v.name,ok:'삭제',danger:true,onOk:async()=>{rep.videos=rep.videos.filter(x=>x!==v);await IV.reports.put(rep);draw()}})}},'삭제')),
        h('video',{controls:true,preload:'metadata',src:u,playsinline:true,'aria-label':v.name})));
    });
    box.append(inp,h('button',{class:'btn primary',type:'button',on:{click:()=>inp.click()}},'영상 파일 추가'));
  }
  draw();return box;
}
})();
