/* 가이드 메뉴: 대학별 학종 가이드 + 특별 부록 */
(()=>{
'use strict';
const IV=window.IV,h=IV.h,S=IV.S;
const CIRC='①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮';
function conv(blocks){
  const out=[];
  blocks.forEach(b=>{
    if(b.t==='p')out.push({t:'p',text:b.x});
    else if(b.t==='h')out.push({t:'p',text:b.x,h:1});
    else if(b.t==='ol')b.x.forEach((x,i)=>out.push({t:'p',text:CIRC[i]+' '+x}));
    else if(b.t==='ul')b.x.forEach(x=>out.push({t:'p',text:x}));
    else if(b.t==='code'||b.t==='tip')out.push(b);
    else if(b.t==='table')out.push({t:'table',rows:b.rows});
  });
  return out;
}
function notes(key,title){
  const box=h('div',{class:'panel hl-scope',style:'margin-top:20px'});
  function view(){
    IV.clear(box);
    const txt=S.notes[key]||'';
    box.append(h('h2',null,title));
    if(txt.trim())txt.split(/\n+/).filter(x=>x.trim()).forEach((p,i)=>box.append(IV.leaf('p',p.trim(),`g:${key}:n${i}`,'',{})));
    else box.append(h('p',{class:'muted small'},'아직 메모가 없어요. 직접 알게 된 내용을 적어 두세요.'));
    box.append(h('button',{class:'btn sm',type:'button',style:'margin-top:8px',on:{click:edit}},txt.trim()?'메모 수정':'메모 쓰기'));
  }
  function edit(){
    IV.clear(box);
    const ta=h('textarea',{class:'src-edit',id:'note-'+key,style:'min-height:240px','aria-label':title,value:S.notes[key]||''});
    box.append(h('h2',null,title),ta,h('div',{style:'display:flex;gap:8px;margin-top:10px'},
      h('button',{class:'btn primary',type:'button',on:{click:()=>{const v=ta.value.trim();if(v!==(S.notes[key]||'').trim())IV.clearHLPrefix(`g:${key}:n`);if(v)S.notes[key]=v;else delete S.notes[key];IV.touch('notes',key);view()}}},'저장'),
      h('button',{class:'btn',type:'button',on:{click:view}},'취소')));
    ta.focus();
  }
  view();return box;
}
IV.renderGuide=function(main,V){
  const G=V.guide,wrap=h('div',{class:'wrap'});main.append(wrap);
  const back=fn=>h('button',{class:'back',type:'button','aria-label':'뒤로',on:{click:fn}},'‹');
  if(G.view==='list'){
    wrap.append(h('div',{class:'topbar'},h('h1',null,'학종 가이드'),IV.searchBtn()),h('div',{class:'hello'},h('p',{class:'muted',style:'margin:0 0 16px'},'대학별 면접 평가 방식과 기출 질문을 모아 뒀어요.')));
    wrap.append(h('div',{class:'group-h'},'대학별 가이드'));
    const list=h('div',{class:'list'});
    window.GUIDE.forEach(u=>list.append(h('button',{class:'row',type:'button',on:{click:()=>{G.view='univ';G.id=u.id;IV.render()}}},
      h('span',{class:'t'},u.name,h('small',null,u.track)),h('span',{class:'chev'},'›'))));
    wrap.append(list,h('div',{class:'group-h'},'특별 부록'));
    const l2=h('div',{class:'list'});
    window.APPENDIX.forEach(a=>l2.append(h('button',{class:'row',type:'button',on:{click:()=>{G.view='appx';G.id=a.id;IV.render()}}},
      h('span',{class:'t'},a.name,h('small',null,a.desc)),h('span',{class:'chev'},'›'))));
    wrap.append(l2);return;
  }
  const isU=G.view==='univ';
  const u=(isU?window.GUIDE:window.APPENDIX).find(x=>x.id===G.id);
  wrap.append(h('div',{class:'topbar'},back(()=>{G.view='list';IV.render()}),h('h1',null,u.name)));
  const scope=h('div',{class:'hl-scope'});wrap.append(scope);
  if(isU){
    scope.append(h('p',{class:'muted',style:'margin:0 0 10px'},u.track));
    scope.append(h('div',{class:'sec'},h('h3',null,'한눈에 보기'),IV.renderBlocks([{t:'table',rows:[['항목','내용'],...u.facts]}],'g:'+u.id,'f-')));
  }else scope.append(h('p',{class:'muted',style:'margin:0 0 10px'},u.desc));
  u.secs.forEach((s,i)=>scope.append(h('div',{class:'sec'},h('h3',null,s.t),IV.renderBlocks(conv(s.b),'g:'+u.id,`s${i}-`))));
  wrap.append(notes((isU?'u:':'a:')+u.id,isU?'내 메모':'부록 내용 · 메모'));
};
})();
