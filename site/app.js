import {BASELINE, MODEL_ASSUMPTIONS, DEPARTMENT_FOR_KIND, emptyScenario, scenarioKey, calculateScenario} from './model.js';
import {PRODUCTS, MATERIALS, CUSTOMERS, DEPARTMENTS, TABS, CURRENT_TABS, SUPPLIERS, CUSTOMER_CONTRACTS, SCM_MATERIAL_VALUES, SCM_PRODUCT_VALUES, SALES_PRODUCT_REPORT, SCM_RAW_REPORT, SCM_FG_REPORT} from './screens.js';

const KEY='tfc-screen-ui-v3';
const defaults={area:'company',round:1,tab:'대시보드',scenario:emptyScenario(),scenarios:[],lastImpact:null};
let state=load();
let editing=null;
function load(){
 try{
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved)return {...defaults,...saved,scenario:{...emptyScenario(),...saved.scenario},scenarios:Array.isArray(saved.scenarios)?saved.scenarios:[]};
  const old=JSON.parse(localStorage.getItem('tfc-screen-ui-v2')||'{}');
  const scenario=emptyScenario();
  const allowed={supplier:['index','lead','payment','reliability'],customer:['index','service','shelf','payment'],warehouse:['pallet','staff'],bottling:['shifts'],material:['safety','lot'],product:['interval','safety'],production:['frozen']};
  for(const [key,value] of Object.entries(old.edits||{})){
   const kind=key.split(':')[0],department=DEPARTMENT_FOR_KIND[kind];
   if(department)scenario[department][key]=Object.fromEntries(Object.entries(value).filter(([field])=>allowed[kind].includes(field)));
  }
  return {...defaults,area:old.area||'company',round:old.round===0?0:1,tab:old.tab==='모형 입력값'?'시나리오':old.tab||'대시보드',scenario};
 }catch{return structuredClone(defaults)}
}
function persist(){localStorage.setItem(KEY,JSON.stringify(state));document.querySelector('#saved-state').textContent='결정값 저장됨'}
const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=0)=>new Intl.NumberFormat('ko-KR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
const euro=v=>`${v<0?'−':''}€ ${fmt(Math.abs(v))}`;
const pct=v=>v==null||!Number.isFinite(v)?'계산 불가':`${fmt(v,2)}%`;
const signed=(v,d=2)=>`${v>=0?'+':'−'}${fmt(Math.abs(v),d)}`;
const record=(kind,name,original)=>({...original,...(state.round===1?state.scenario[DEPARTMENT_FOR_KIND[kind]]?.[scenarioKey(kind,name)]||{}:{})});
const source=n=>`<p class="source-line">출처: 첨부 화면 #${n} · 화면에 보이는 수치를 옮겼습니다.</p>`;
const info=label=>`<span class="info-dot" aria-label="${h(label)} 정보">i</span>`;
const heading=title=>`<div class="group-title">${h(title)}</div>`;
const entity=name=>`<div class="entity-title"><span class="bulb" aria-hidden="true">♟</span>${h(name)}</div>`;
const editButton=(kind,name)=>state.round===1&&kind?`<button class="change-button" type="button" data-edit="${h(kind)}" data-name="${h(name)}">변경</button>`:'';
const row=(label,value)=>`<div class="detail-row"><div>${info(label)}${h(label)}</div><strong class="${value==='✓'?'yes':value==='✕'?'no':''}">${h(value)}</strong></div>`;
const fields=(labels,values)=>labels.map((x,i)=>row(x,values[i])).join('');
function table(title,headers,rows,opts={}) {
  return `${heading(title)}<div class="table-scroll"><table class="report-table"><thead><tr>${headers.map(x=>`<th>${h(x)}</th>`).join('')}${opts.editKind?'<th class="action-column"></th>':''}</tr></thead><tbody>${rows.map((r,i)=>`<tr>${r.map((x,j)=>`<td class="${j===0?'row-label':''}">${opts.htmlLast&&j===r.length-1?x:h(x)}</td>`).join('')}${opts.editKind?`<td>${editButton(opts.editKind,opts.names?.[i]||r[0])}</td>`:''}</tr>`).join('')}</tbody></table></div>${opts.source?source(opts.source):''}`;
}
function cardBlock(title,name,labels,values,kind,sourceNumber){
  return `${heading(title)}${entity(name)}<div class="detail-list">${fields(labels,values)}<div class="detail-action">${editButton(kind,name)}</div></div>${source(sourceNumber)}`;
}
function roundLabel(){return state.round===1?'라운드(회차) 1 <small>(현재)</small>':'라운드(회차) 0 <small>(완료)</small>'}
function tabsFor(){if(state.area==='company')return ['대시보드','자료 안내'];if(state.area==='finance')return ['재무보고서'];if(state.area==='simulator')return ['시나리오','시나리오 비교','민감도','설명 경로'];return state.round===1?CURRENT_TABS[state.area]:TABS[state.area]}
function select(area,tab){state.area=area;if(area==='simulator')state.round=1;state.tab=tab||tabsForArea(area)[0];persist();render();window.scrollTo({top:0,behavior:'smooth'})}
function tabsForArea(area){if(area==='company')return ['대시보드','자료 안내'];if(area==='finance')return ['재무보고서'];if(area==='simulator')return ['시나리오','시나리오 비교','민감도','설명 경로'];return state.round===1?CURRENT_TABS[area]:TABS[area]}
function renderChrome(){
 const result=calculateScenario(state.scenario), original=calculateScenario(emptyScenario());
 document.querySelector('#global-roi').innerHTML=state.round===0
  ?`<small>ROUND 0 · 실제 ROI</small><strong>${pct(BASELINE.reportedRoi)}</strong>`
  :`<small>ROUND 1 · 예상 ROI <span>대체 모형</span></small><strong>${result.ready?pct(result.roi):'계산 불가'}</strong><em>${result.ready?signed(result.roi-original.roi)+'%p · 원안 대비':'투자자본 확인 필요'}</em>`;
 document.querySelectorAll('.rail-link').forEach(b=>b.classList.toggle('active',b.dataset.area===state.area));
 document.querySelector('#round-list').innerHTML=Array.from({length:7},(_,n)=>`<button type="button" data-round="${n}" class="round-item ${n===state.round?'active':''} ${n>1?'future':''}" ${n>1?'disabled aria-label="회차 '+n+'은 아직 시작하지 않았습니다"':''}><span class="round-dot"></span><span>${n}</span></button>`).join('');
 document.querySelector('#department-bar').innerHTML=`<div class="round-label">${roundLabel()}</div>${DEPARTMENTS.map(d=>`<button type="button" data-dept="${d.id}" class="dept-button ${state.area===d.id?'active':''}"><span>${d.icon}</span>${d.label}</button>`).join('')}`;
 const tabs=tabsFor();if(!tabs.includes(state.tab)){state.tab=tabs[0];persist()}
 document.querySelector('#subtabs').innerHTML=tabs.map(t=>`<button type="button" class="subtab ${state.tab===t?'active':''}" data-tab="${h(t)}">${h(t)}</button>`).join('');
 document.querySelector('#page-message').innerHTML=state.round===0?'<span class="message-dot"></span> Round 0 · 완료된 기록입니다. 이 화면은 읽기 전용입니다.':state.area==='simulator'?'<span class="message-dot"></span> Round 1 · 조건부 시나리오입니다. 실제 성과는 아직 관측되지 않았습니다.':'';
 const department=state.area==='scm'?'supplyChain':state.area;
 document.querySelector('#scenario-actions').innerHTML=state.round===1
  ?`${DEPARTMENTS.some(d=>d.id===state.area)?`<button type="button" class="plain-button" data-reset-department="${department}">${h(DEPARTMENTS.find(d=>d.id===state.area).label)} 설정 초기화</button>`:''}<button type="button" class="plain-button" data-reset-scenario>전체 시나리오 초기화</button>`
  :'';
 const impact=state.lastImpact;
 document.querySelector('#impact-panel').innerHTML=state.round===1&&impact
  ?`<div class="impact-heading"><strong>${h(impact.decision)} · 저장 완료</strong><button type="button" class="plain-button" data-dismiss-impact>닫기</button></div><p>${impact.changes.map(c=>`${h(c.label)} ${h(c.before)} → ${h(c.after)}`).join(' · ')||'설정이 저장되었습니다.'}</p><h4 class="impact-subheading">ROI 변화 이유</h4><div class="impact-metrics"><span>예상 ROI <strong>${pct(impact.before.roi)} → ${pct(impact.after.roi)}</strong> (${signed(impact.after.roi-impact.before.roi)}%p)</span><span>재고 투자 <strong>${euro(impact.before.inventoryDelta)} → ${euro(impact.after.inventoryDelta)}</strong></span><span>매출 변화 <strong>${euro(impact.after.revenueDelta-impact.before.revenueDelta)}</strong></span><span>구매비용 변화 <strong>${euro(impact.after.purchaseCostDelta-impact.before.purchaseCostDelta)}</strong></span><span>창고 위치 비용 변화 <strong>${euro(impact.after.warehouseCostDelta-impact.before.warehouseCostDelta)}</strong></span><span>재고 보유비 변화 <strong>${euro(impact.after.holdingCostDelta-impact.before.holdingCostDelta)}</strong></span><span>진부화 비용 변화 <strong>${euro(impact.after.obsolescenceCostDelta-impact.before.obsolescenceCostDelta)}</strong></span><span>영업이익 <strong>${euro(impact.before.operatingProfit)} → ${euro(impact.after.operatingProfit)}</strong></span><span>총 투자자본 <strong>${euro(impact.before.investment)} → ${euro(impact.after.investment)}</strong></span></div><small>Round 0 재무 기준과 공개된 대체 모형 가정으로 계산한 추정입니다. TFC 실제 결과가 아닙니다.</small>`
  :'';
}
function companyView(){
 if(state.tab==='자료 안내')return `${heading('자료와 표시 기준')}<div class="guidance"><h2>화면 사용 안내</h2><p>Round 1 부서 화면에서 결정값을 변경하고 저장하면 상단 예상 ROI가 즉시 갱신됩니다. 저장 전의 수정값은 계산에 반영되지 않습니다.</p><p>Round 0은 완료된 실적입니다. Round 1의 실제 성과는 아직 없으므로 예상 ROI는 Round 0 재무 기준, 첨부 보고서 수치, 공개된 대체 모형 가정으로 계산합니다. 게임의 공식 결과가 아닙니다.</p><p>결정값은 이 브라우저에 저장됩니다. 일부 화면 항목은 현재 정량 모형의 대상이 아니어서 읽기 전용으로 표시합니다.</p></div>`;
 const rows=[['투자수익률 (ROI)',pct(BASELINE.reportedRoi),'Round 0 관측'],['영업이익',euro(BASELINE.operatingProfit),'Round 0 관측'],['총 투자자본',euro(BASELINE.investment),'Round 0 관측']];
 const result=calculateScenario(state.scenario);
 return `${heading('회사 대시보드')}<div class="overview-intro"><div><span class="overline">THE FRESH CONNECTION</span><h1>${state.round===0?'Round 0 결과':'Round 1 의사결정'}</h1><p>${state.round===0?'완료된 라운드의 재무 기준점입니다.':'각 부서에서 결정값을 저장하면 예상 ROI가 바로 갱신됩니다.'}</p></div><span class="round-badge">${state.round===0?'완료된 결과':'진행 중'}</span></div>${state.round===1?`<div class="simulation-summary"><div><small>ROUND 0 · 실제</small><strong>${pct(BASELINE.reportedRoi)}</strong><span>재무보고서 기준</span></div><div><small>ROUND 1 · 현재 예상</small><strong>${pct(result.roi)}</strong><span>공식 결과가 아닌 대체 모형 추정</span></div></div>`:''}${table('재무 기준', ['지표','값','상태'],rows)}<div class="jump-grid">${DEPARTMENTS.map(d=>`<button class="jump-card" data-dept="${d.id}"><span class="jump-icon">${d.icon}</span><strong>${d.label}</strong><small>보고서와 의사결정 보기 →</small></button>`).join('')}</div><p class="footnote">Round 0 재무 기준: FinanceReport_0라운드.xlsx 추출 수치 · DATA_COVERAGE_AUDIT.md. Round 1 실적은 미관측입니다.</p>`;
}
function purchasingCurrent(){
 return SUPPLIERS.map(s=>{const v=record('supplier',s.name,s);return cardBlock(s.material,v.name,['계약지수','품질','리드타임 (days)','인증','국가','여유캐파','지불조건 (weeks)','거래단위','합의된 납품신뢰성 (%)','납품구간'],[v.index,v.quality,v.lead,v.cert,v.country,v.capacity,v.payment,v.unit,String(v.reliability).includes('%')?v.reliability:v.reliability+'%',v.window],'supplier',s.source)}).join('');
}
function salesCurrent(){
 if(state.tab==='주문관리')return `${heading('주문관리')}${fields(['재고부족 시 분배규칙'],['비율별'])}<p class="footnote">이 설정의 정량 영향은 현재 모형에 연결되지 않아 읽기 전용입니다.</p>${source(25)}`;
 if(state.tab==='카테고리 관리'){const categories=originalFor('categories','고객별 제품 구성');return `${heading('카테고리 관리')}${table('고객', ['제품',...CUSTOMERS],PRODUCTS.map((p,j)=>[p,...CUSTOMERS.map((c,i)=>categories[`${i}:${j}`]?'✓':'✕')]),{source:25})}<p class="footnote">제품별 신규 수요 자료가 없어 현재 모형에서는 읽기 전용입니다.</p>`;}
 return CUSTOMER_CONTRACTS.map(c=>{const v=record('customer',c.name,c);return cardBlock('고객',v.name,['계약지수','서비스수준 유형','서비스수준 (%)','유통기한 (%)','주문 마감시간','거래단위','지불조건 (weeks)','판촉압력','판촉행사 사전예고'],[v.index,v.type,v.service,v.shelf,v.cutoff,v.unit,v.payment,v.pressure,v.forecast],'customer',c.source)}).join('');
}
function operationBlock(tab){
 if(tab==='원자재 입고'){const v=record('warehouse','원자재 창고',{pallet:'900',staff:'5',source:35});return cardBlock('원자재 창고','원자재 창고',['파레트 위치 개수','정직원 수'],[v.pallet,v.staff],'warehouse',35)}
 if(tab==='완제품 출고'){const v=record('warehouse','네덜란드 유통센터',{pallet:'1500',staff:'4',source:18});return cardBlock('완제품 창고','네덜란드 유통센터',['파레트 위치 개수','정직원 수'],[v.pallet,v.staff],'warehouse',18)}
 if(tab==='혼합공정')return cardBlock('혼합기 사용가능','푸르트믹스 MQ',['혼합기'],['푸르트믹스 MQ'],null,35);
 const v=record('bottling','스위스 필2',{line:'스위스 필2',shifts:'2',source:35});return cardBlock('라인 설정',v.line,['용기주입 라인','교대근무 횟수'],[v.line,v.shifts],'bottling',35);
}
function operationsCurrent(){return operationBlock(state.tab)}
function scmCurrent(){
 if(state.tab==='원자재')return table('재고관리 요소',['원자재','안전재고 (weeks)','주문크기 (weeks)'],SCM_MATERIAL_VALUES.map(m=>{const v=record('material',m.name,m);return [m.name,v.safety,v.lot]}),{editKind:'material',names:MATERIALS,source:26});
 if(state.tab==='생산'){const v=record('production','생산관리',{frozen:'3'});return `${heading('생산관리')}${fields(['생산확정 구간 (weeks)'],[v.frozen])}<div class="detail-action">${editButton('production','생산관리')}</div>${source(26)}`}
 return table('완제품 재고관리',['완제품','생산간격 (days)','안전재고 (weeks)','창고'],SCM_PRODUCT_VALUES.map(p=>{const v=record('product',p.name,p);return [p.name,v.interval,v.safety,v.warehouse]}),{editKind:'product',names:PRODUCTS,source:26});
}
function historyDashboard(){
 const byArea={purchasing:[['투자수익률 (ROI)','−7.7%'],['원자재 거절(불량)','2.9%'],['원자재비','39.5%'],['공급업체 납품신뢰성','92.1%']],operations:[['투자수익률 (ROI)','−7.7%'],['원자재 창고의 공간 활용률','93.4%'],['완제품 창고의 공간 활용률','70.7%'],['생산계획 준수','78.7%']],sales:[['투자수익률 (ROI)','−7.7%'],['총이익 (고객)','€ 903,148'],['제품 진부화','8.1%'],['출하 주문 라인품목 서비스수준','92.0%']],scm:[['투자수익률 (ROI)','−7.7%'],['원자재 가용성','99.4%'],['원자재 재고','4.4 weeks'],['완제품 재고','3.2 weeks']]};
 const src={purchasing:43,operations:45,sales:38,scm:28}[state.area];
 return `${heading('대시보드')}<div class="kpi-grid">${byArea[state.area].map(([label,value])=>`<div class="kpi"><small>${info(label)}${h(label)}</small><strong>${h(value)}</strong><span>Round 0 관측</span></div>`).join('')}</div><div class="guidance"><h3>라운드 기록</h3><p>차트는 원본 시계열 자료가 확보되지 않아 재작성하지 않았습니다. 첨부 화면에서 확인 가능한 Round 0 지표를 표시합니다.</p></div>${source(src)}`;
}
function historySales(){
 if(state.tab==='대시보드')return historyDashboard();
 if(state.tab==='고객')return table('고객 보고서',['고객','달성된 계약지수','서비스수준(개수)','서비스수준(라인품목)','서비스수준(주문)','즉시 가용성','매출액','총이익','고객 확보 유통기한'],[
  ['Food & Groceries','0.812','94.8%','91.2%','85.5%','91.2%','€ 1,045,136','€ 13,963','85.9%'],
  ['LAND Market','0.891','94.4%','92.1%','86.9%','90.6%','€ 586,461','€ 9,188','85.3%'],
  ["Dominick's",'0.982','96.7%','93.2%','91.2%','97.0%','€ 674,658','€ 11,585','86.6%']
 ],{source:34});
 if(state.tab==='완제품')return table('제품 보고서',['완제품','주당 수요(개)','주당수요(금액)','판매 단가','제품당 마진','서비스수준(개수)','서비스수준(라인품목)','즉시 가용성','주당 주문 라인품목','할당된 공헌도','치우침','진부화','진부화 금액'],SALES_PRODUCT_REPORT,{source:33});
 if(state.tab==='고객 제품'||state.tab==='제품 고객')return salesCrossReport(state.tab==='고객 제품');
 if(state.tab==='의사결정 로그')return `${heading('주문관리')}${row('재고부족 시 분배규칙','비율별')}${heading('카테고리 관리')}${table('고객',['완제품',...CUSTOMERS],PRODUCTS.map((p,i)=>[p,'✓','✓',i<3?'✕':'✓']),{source:25})}`;
 return `${heading('분석')}<div class="guidance"><h3>서비스와 진부화</h3><p>첨부 화면의 Round 0 대시보드에는 주문 라인품목 서비스수준 92.0%와 제품 진부화 8.1%가 표시됩니다.</p><p>제품·고객 보고서에서 세부 수치를 확인할 수 있습니다.</p></div>${source(38)}`;
}
function salesCrossReport(customerFirst){
 const pairs=[
  ['Food & Groceries',SALES_PRODUCT_REPORT.map((r,i)=>[r[0],['42,637','7,182','26,777','35,873','5,412','15,539'][i],['€ 15,582','€ 3,208','€ 10,438','€ 6,409','€ 1,406','€ 3,155'][i]])],
  ['LAND Market',SALES_PRODUCT_REPORT.map((r,i)=>[r[0],['24,756','4,179','15,385','11,935','1,818','5,132'][i],['€ 9,927','€ 2,048','€ 6,580','€ 2,340','€ 518','€ 1,143'][i]])],
  ["Dominick's",SALES_PRODUCT_REPORT.slice(3).map((r,i)=>[r[0],['70,276','10,512','30,370'][i],['€ 15,187','€ 3,304','€ 7,458'][i]])]
 ];
 const rows=pairs.flatMap(([c,rs])=>rs.map(r=>customerFirst?[c,...r]:[r[0],c,...r.slice(1)]));
 return table(customerFirst?'고객/제품 보고서':'제품 고객 보고서',customerFirst?['고객','완제품','주당 수요(개)','주당수요(금액)']:['완제품','고객','주당 수요(개)','주당수요(금액)'],rows,{source:customerFirst?30:22});
}
function historyPurchasing(){
 if(state.tab==='대시보드')return historyDashboard();
 if(state.tab==='공급업체')return table('공급업체',['공급업체/원자재','납품신뢰성 (%)','거부율 (%)','납품 횟수','주문 라인품목','구매금액','운송비'],[
  ['Mono Packaging Materials / 1 리터 팩','92.3%','3.6%','5.7','5.7','€ 110,692','€ 4,552'],
  ['Trio PET PLC / PET','84.1%','5.9%','5.9','5.9','€ 307,931','€ 145,393'],
  ['Miami Oranges / 오렌지','97.8%','1.0%','5.4','5.4','€ 409,042','€ 35,046'],
  ['NO8DO Mango / 망고','93.7%','0.5%','5.3','5.3','€ 81,658','€ 3,314'],
  ['Seitan Vitamins / 비타민 C','81.5%','1.2%','4.7','4.7','€ 2,295','€ 1,592']
 ],{source:44});
 if(state.tab==='원자재/구성품')return table('원자재',['원자재','납품신뢰성 (%)','거부율 (%)','구매','구매금액','운송비','주당수요','구매단가','주문크기'],[
  ['1 리터 팩','92.3%','3.6%','5.7','€ 110,692','€ 4,552','132,257','€ 0.0311','619,636'],
  ['PET','84.1%','5.9%','5.9','€ 307,931','€ 145,393','204,297','€ 0.0547','951,612'],
  ['오렌지','97.8%','1.0%','5.4','€ 409,042','€ 35,046','35,360','€ 0.4392','172,581'],
  ['망고','93.7%','0.5%','5.3','€ 81,658','€ 3,314','3,165','€ 0.9925','15,497'],
  ['비타민 C','81.5%','1.2%','4.7','€ 2,295','€ 1,592','184','€ 0.4729','1,032']
 ],{source:46});
 if(state.tab==='의사결정 로그')return purchasingCurrent();
 return `${heading('분석')}<div class="guidance"><h3>Round 0 구매 지표</h3><p>공급업체 납품신뢰성 92.1%, 원자재 거절(불량) 2.9%, 원자재비 39.5%가 첨부 화면에 표시됩니다.</p></div>${source(43)}`;
}
function historyScm(){
 if(state.tab==='대시보드')return historyDashboard();
 if(state.tab==='원자재')return table('원자재',['원자재','납품신뢰성','재고(개수 또는 리터)','재고 (weeks)','재고 금액','경제적 원자재 재고','주당수요','진부화','원자재 가용성','치우침','구매량','주문 크기'],SCM_RAW_REPORT,{source:48});
 if(state.tab==='완제품')return table('완제품',['완제품','주당 수요','서비스수준(개수)','서비스수준(라인품목)','재고 (weeks)','재고 금액','경제적 재고','유통적 재고액','진부화','진부화 금액','예측 오차','치우침','생산 배치','최초 가동 생산성 손실','불량 금액','생산계획 준수'],SCM_FG_REPORT,{source:23});
 if(state.tab==='의사결정 로그')return `${heading('재고관리 요소')}${table('원자재',['원자재','안전재고 (weeks)','주문크기 (weeks)'],SCM_MATERIAL_VALUES.map(m=>[m.name,m.safety,m.lot]),{source:26})}${heading('생산관리')}${row('생산확정 구간 (weeks)','3')}${table('완제품',['완제품','생산간격 (days)','안전재고 (weeks)'],SCM_PRODUCT_VALUES.map(p=>[p.name,p.interval,p.safety]),{source:26})}`;
 return `${heading('분석')}<div class="guidance"><h3>재고 확보</h3><p>원자재 가용성 99.4%, 원자재 재고 4.4주, 완제품 재고 3.2주가 Round 0 대시보드에 표시됩니다.</p></div>${source(28)}`;
}
function historyOperations(){
 if(state.tab==='대시보드')return historyDashboard();
 if(state.tab==='창고보고')return table('창고',['원자재 입고/완제품 출고','캐파','실제 사용량','공간 활용률','초과율','주당 주문 라인품목','주당 파레트/탱크의 수','주당 작업 시간','임시직'],[
  ['원자재 창고','900','840','93.4%','10.8%','1.0','212.4','74','0.2'],
  ['네덜란드 유통센터 / 완제품 창고','1,500','1,061','70.7%','0.1%','17.8','334.5','100','0.1']
 ],{source:31});
 if(state.tab==='혼합공정과 용기주입공정')return table('혼합과 용기주입',['라인','가동시간 (hours)','작업변경 시간','고장시간','미사용 캐파','초과근무','가동시간 (%)','작업변경시간 (%)','고장시간 (%)','미사용 캐파 (%)','초과근무 (%)','최초 가동 생산성 손실','생산계획 준수율'],[
  ['스위스 필2','62.6','12.1','10.8','3.9','9.4','78.2%','15.1%','13.6%','4.9%','11.7%','€ 8,435','78.7%']
 ],{source:36});
 if(state.tab==='의사결정 로그')return CURRENT_TABS.operations.map(operationBlock).join('');
 return `${heading('분석')}<div class="guidance"><h3>Round 0 운영 지표</h3><p>원자재 창고의 공간 활용률은 93.4%, 완제품 창고의 공간 활용률은 70.7%, 생산계획 준수는 78.7%입니다.</p></div>${source(45)}`;
}
function financeView(){
 const rows=[['매출액','€ 2,306,255','관측'],['총이익','€ 903,148','관측'],['판매 및 관리비','€ 1,209,651','관측'],['영업이익',euro(BASELINE.operatingProfit),'관측'],['총 투자자본',euro(BASELINE.investment),'관측'],['투자수익률 (ROI)',pct(BASELINE.reportedRoi),'관측']];
 const result=calculateScenario(state.scenario);
 return `${heading('재무보고서 · Round 0')}${table('재무 성과',['항목','Round 0','상태'],rows)}<div class="formula-note">ROI = 영업이익 ÷ 총 투자자본 = ${pct(BASELINE.operatingProfit/BASELINE.investment*100)} · 보고서 표기 ${pct(BASELINE.reportedRoi)}</div>${state.round===1?table('Round 1 · 현재 시나리오 추정',['지표','예상값','Round 0 대비'],[['매출액',euro(result.revenue),euro(result.revenueDelta)],['영업이익',euro(result.operatingProfit),euro(result.operatingProfitDelta)],['총 투자자본',euro(result.investment),euro(result.investmentDelta)],['예상 ROI',pct(result.roi),signed(result.roi-BASELINE.reportedRoi)+'%p']]):''}<p class="footnote">Round 0 재무 기준은 실제 보고서 값입니다. Round 1 값은 저장된 부서 결정과 대체 모형 가정으로 계산한 추정이며 실제 성과가 아닙니다.</p>`;
}
function simulatorView(){
 const result=calculateScenario(state.scenario), original=calculateScenario(emptyScenario());
 const note='<p class="footnote">Round 1의 실제 실적은 아직 없습니다. 원안 예상 ROI는 Round 0 재무 수치에 현재 알려진 Round 1 원안 결정을 적용한 대체 모형 기준점입니다. 게임의 공식 예측이 아닙니다.</p>';
 if(state.tab==='시나리오 비교'){
  const rows=[
   ['Round 0 · 실제',pct(BASELINE.reportedRoi),euro(BASELINE.operatingProfit),euro(BASELINE.investment),'관측','—'],
   ['Round 1 · 원안',pct(original.roi),euro(original.operatingProfit),euro(original.investment),'대체 모형','—'],
   ['현재 시나리오',pct(result.roi),euro(result.operatingProfit),euro(result.investment),'대체 모형','—'],
   ...state.scenarios.map(s=>{
    const r=calculateScenario(s.scenario);
    return [s.name,pct(r.roi),euro(r.operatingProfit),euro(r.investment),'저장됨',
     '<button class="mini-action" data-load-scenario="'+h(s.id)+'">불러오기</button><button class="mini-action danger" data-delete-scenario="'+h(s.id)+'">삭제</button>'];
   })
  ];
  return heading('시나리오 비교')+'<div class="guidance"><h3>누적 결정안</h3><p>부서별 결정값을 저장할 때마다 현재 시나리오를 다시 계산합니다.</p><button class="save-button" type="button" data-save-scenario>현재 시나리오 보관</button></div>'+
   table('결과 비교',['시나리오','ROI','영업이익','총 투자자본','상태','작업'],rows,{htmlLast:true})+note;
 }
 if(state.tab==='민감도'){
  const points=[-1,-0.5,0,0.5,1].map(delta=>{
   const next=structuredClone(state.scenario);
   for(const product of SCM_PRODUCT_VALUES){
    const key=scenarioKey('product',product.name);
    const current=record('product',product.name,product);
    next.supplyChain[key]={...next.supplyChain[key],safety:String(Math.max(0,Number(current.safety)+delta))};
   }
   return [delta,calculateScenario(next).roi];
  });
  const ys=points.map(p=>p[1]),min=Math.min(...ys),max=Math.max(...ys),range=Math.max(0.01,max-min);
  return heading('완제품 안전재고 민감도')+
   '<div class="sensitivity-bars">'+points.map(([x,y])=>'<div><strong>'+pct(y)+'</strong><span class="bar-track"><span style="height:'+Math.round(20+70*(y-min)/range)+'%"></span></span><small>'+(x>=0?'+':'')+fmt(x,1)+' weeks</small></div>').join('')+
   '</div><p class="footnote">현재 저장된 모든 부서 결정은 유지하고, 완제품 6종의 안전재고만 동시에 0.5주씩 바꾼 대체 모형 결과입니다.</p>';
 }
 if(state.tab==='설명 경로'){
  const assumptionRows=[
   ['계산 기간',MODEL_ASSUMPTIONS.roundWeeks+'주','판매 이력 그래프의 26주를 근사한 가정'],
   ['회차 재고 이자율',fmt(MODEL_ASSUMPTIONS.holdingRatePerRound*100,2)+'%','Round 0 재고 이자비용 ÷ 재고 투자자본; 선형 외삽'],
   ['완제품 안전재고 1주당 서비스수준 변화',fmt(MODEL_ASSUMPTIONS.fgServicePpPerSafetyWeek,1)+'%p','게임 내부 계수 미확인'],
   ['창고 직원 1명당 회차 인건비',euro(MODEL_ASSUMPTIONS.laborCostPerEmployeeRound),'Round 0 원자재·완제품 창고 인건비 ÷ 직원 수; 선형 외삽'],
   ['교대근무 1회당 회차 비용',euro(MODEL_ASSUMPTIONS.laborCostPerShiftRound),'게임 내부 계수 미확인'],
   ['파레트 위치 1개당 회차 비용',euro(MODEL_ASSUMPTIONS.warehouseCostPerPalletPositionRound),'Round 0 창고 위치 비용 ÷ 위치 수; 선형 외삽']
  ];
  return heading('의사결정 → KPI → 재무 → ROI')+
   '<div class="guidance"><h3>현재 시나리오 계산 경로</h3><p>부서에서 저장한 값을 원자재·완제품 재고, 서비스수준, 매출, 비용, 투자자본에 연결합니다. Round 0 보고서의 품목별 재고 금액과 판매 수요를 기준으로 합니다.</p></div>'+
   table('현재 시나리오의 변화',['단계','Round 0 대비'],[
    ['원자재 재고 금액',euro(result.rawInventoryDelta)],['완제품 재고 금액',euro(result.fgInventoryDelta)],
    ['서비스수준 변화',signed(result.serviceDeltaPp)+'%p'],['매출액',euro(result.revenueDelta)],
    ['구매비용',euro(result.purchaseCostDelta)],['인건비',euro(result.laborCostDelta)],
    ['창고 위치 비용',euro(result.warehouseCostDelta)],
    ['재고 보유비',euro(result.holdingCostDelta)],['진부화 비용',euro(result.obsolescenceCostDelta)],
    ['영업이익',euro(result.operatingProfitDelta)],['총 투자자본',euro(result.investmentDelta)],
    ['예상 ROI',pct(result.roi)]
   ])+
   (result.trace.length?table('저장된 결정의 영향 경로',['부서','결정','연결 KPI','계산 근거'],result.trace.map(t=>[t.department,t.decision,t.kpi,t.note])):'<p class="footnote">아직 원안에서 변경된 결정이 없습니다.</p>')+
   table('공개된 주요 모형 가정',['항목','적용값','상태'],assumptionRows)+
   '<p class="footnote">그 외 공급업체 리드타임·납품신뢰성, 계약 서비스 목표, 생산확정 구간의 연결 계수도 site/model.js의 MODEL_ASSUMPTIONS에 공개되어 있습니다. 자료가 확보되면 이 계수를 보정해야 합니다.</p>'+note;
 }
 return heading('Round 1 · 예상 ROI')+
  '<div class="simulation-summary three"><div><small>ROUND 0 · 실제</small><strong>'+pct(BASELINE.reportedRoi)+'</strong><span>완료된 재무보고서</span></div>'+
  '<div><small>ROUND 1 · 원안 추정</small><strong>'+pct(original.roi)+'</strong><span>Round 0 재무 기준 대체 모형</span></div>'+
  '<div><small>현재 저장된 시나리오</small><strong>'+pct(result.roi)+'</strong><span>'+signed(result.roi-original.roi)+'%p · 원안 대비</span></div></div>'+
  table('현재 예상 재무 성과',['항목','예상값','Round 0 대비'],[
   ['매출액',euro(result.revenue),euro(result.revenueDelta)],
   ['영업이익',euro(result.operatingProfit),euro(result.operatingProfitDelta)],
   ['총 투자자본',euro(result.investment),euro(result.investmentDelta)],
   ['ROI',pct(result.roi),signed(result.roi-BASELINE.reportedRoi)+'%p']
  ])+
  '<div class="guidance"><p>각 부서 페이지에서 결정값을 저장하면 이 결과와 상단 예상 ROI가 즉시 갱신됩니다. 별도 모형 입력은 필요하지 않습니다.</p></div>'+note;
}
function render(){
 renderChrome();
 const view=state.area==='company'?companyView():state.area==='finance'?financeView():state.area==='simulator'?simulatorView():state.round===1?({purchasing:purchasingCurrent,operations:operationsCurrent,sales:salesCurrent,scm:scmCurrent})[state.area]():({purchasing:historyPurchasing,operations:historyOperations,sales:historySales,scm:historyScm})[state.area]();
 document.querySelector('#view').innerHTML=view;
}
const EDITS={
 supplier:[['index','계약지수','number'],['lead','리드타임 (days)','number'],['payment','지불조건 (weeks)','number'],['reliability','합의된 납품신뢰성 (%)','number']],
 customer:[['index','계약지수','number'],['service','서비스수준 (%)','number'],['shelf','유통기한 (%)','number'],['payment','지불조건 (weeks)','number']],
 material:[['safety','안전재고 (weeks)','number'],['lot','주문크기 (weeks)','number']],
 product:[['interval','생산간격 (days)','number'],['safety','안전재고 (weeks)','number']],
 production:[['frozen','생산확정 구간 (weeks)','number']],
 warehouse:[['pallet','파레트 위치 개수','number'],['staff','정직원 수','number']],
 bottling:[['shifts','교대근무 횟수','number']]
};
function originalFor(kind,name){return ({supplier:()=>SUPPLIERS.find(x=>x.name===name),customer:()=>CUSTOMER_CONTRACTS.find(x=>x.name===name),material:()=>SCM_MATERIAL_VALUES.find(x=>x.name===name),product:()=>SCM_PRODUCT_VALUES.find(x=>x.name===name),production:()=>({frozen:'3'}),warehouse:()=>name==='원자재 창고'?{pallet:'900',staff:'5'}:{pallet:'1500',staff:'4'},bottling:()=>({line:'스위스 필2',shifts:'2'}),categories:()=>Object.fromEntries(CUSTOMERS.flatMap((c,i)=>PRODUCTS.map((p,j)=>[`${i}:${j}`,i<2||j>=3])))})[kind]?.()||{}}
function openEdit(kind,name){
 if(state.round!==1||!EDITS[kind])return;
 editing={kind,name};const v=record(kind,name,originalFor(kind,name));
 document.querySelector('#edit-kicker').textContent='ROUND 1 · '+({supplier:'구매',customer:'판매',material:'공급사슬',product:'공급사슬',production:'공급사슬',warehouse:'생산운영',bottling:'생산운영'}[kind]||'');
 document.querySelector('#edit-title').textContent=name;
 document.querySelector('#edit-fields').innerHTML=EDITS[kind].map(([id,label])=>`<label class="edit-field"><span>${h(label)}</span><input name="${h(id)}" type="number" min="0" ${['service','shelf','reliability'].includes(id)?'max="100"':''} step="${['staff','pallet','shifts','lead','interval'].includes(id)?'1':'any'}" value="${h(String(v[id]??'').replace('%',''))}" required></label>`).join('');
 document.querySelector('#draft-status').textContent='저장 전 · 예상 ROI에는 아직 반영되지 않았습니다.';
 document.querySelector('#edit-dialog').showModal();
}
function updateScenario(decision,changes,mutation){
 const before=calculateScenario(state.scenario);
 mutation();
 const after=calculateScenario(state.scenario);
 state.lastImpact={decision,changes,before,after};
 persist();render();
}
document.addEventListener('click',e=>{
 const area=e.target.closest('[data-area]');if(area){select(area.dataset.area);return}
 const dept=e.target.closest('[data-dept]');if(dept){select(dept.dataset.dept);return}
 const round=e.target.closest('[data-round]');if(round&&!round.disabled){state.round=Number(round.dataset.round);state.tab=tabsForArea(state.area)[0];persist();render();return}
 const tab=e.target.closest('[data-tab]');if(tab){state.tab=tab.dataset.tab;persist();render();return}
 const edit=e.target.closest('[data-edit]');if(edit){openEdit(edit.dataset.edit,edit.dataset.name);return}
 const resetDept=e.target.closest('[data-reset-department]');if(resetDept){const department=resetDept.dataset.resetDepartment;updateScenario('부서 설정 초기화',[],()=>{state.scenario[department]={}});return}
 if(e.target.closest('[data-reset-scenario]')){updateScenario('전체 시나리오 초기화',[],()=>{state.scenario=emptyScenario()});return}
 if(e.target.closest('[data-dismiss-impact]')){state.lastImpact=null;persist();render();return}
 if(e.target.closest('[data-save-scenario]')){const name=prompt('시나리오 이름을 입력하세요',`시나리오 ${state.scenarios.length+1}`);if(!name?.trim())return;state.scenarios.push({id:crypto.randomUUID(),name:name.trim(),scenario:structuredClone(state.scenario)});persist();render();return}
 const load=e.target.closest('[data-load-scenario]');if(load){const saved=state.scenarios.find(s=>s.id===load.dataset.loadScenario);if(saved){updateScenario('저장된 시나리오 불러오기',[],()=>{state.scenario=structuredClone(saved.scenario)});state.tab='시나리오';persist();render()}return}
 const remove=e.target.closest('[data-delete-scenario]');if(remove){state.scenarios=state.scenarios.filter(s=>s.id!==remove.dataset.deleteScenario);persist();render()}
});
document.querySelector('#source-help').addEventListener('click',()=>select('company','자료 안내'));
document.querySelector('#close-edit').addEventListener('click',()=>document.querySelector('#edit-dialog').close());
document.querySelector('#cancel-edit').addEventListener('click',()=>document.querySelector('#edit-dialog').close());
document.querySelector('#edit-fields').addEventListener('input',()=>{document.querySelector('#draft-status').textContent='저장되지 않은 변경사항 · 저장하면 예상 ROI를 다시 계산합니다.'});
document.querySelector('#edit-form').addEventListener('submit',e=>{
 e.preventDefault();if(!editing)return;
 const patch={},changes=[],form=e.currentTarget,original=record(editing.kind,editing.name,originalFor(editing.kind,editing.name));
 for(const [id,label] of EDITS[editing.kind]){
  const value=form.elements.namedItem(id).value;
  patch[id]=value;
  if(Number(String(original[id]).replace('%',''))!==Number(value))changes.push({label,before:String(original[id]),after:value});
 }
 const {kind,name}=editing,department=DEPARTMENT_FOR_KIND[kind];
 document.querySelector('#edit-dialog').close();editing=null;
 updateScenario(name,changes,()=>{state.scenario[department][scenarioKey(kind,name)]=patch});
});
render();
