import { BASELINE, DECISIONS, CALIBRATION, emptyDecisions, emptyCalibration, observedRoi, simulate } from './model.js';

const KEY = 'tfc-digital-twin-v1';
const NAV = [
  { section: 'OVERVIEW', items: [['dashboard', '대시보드', '▦']] },
  { section: 'DECISIONS', items: [['supply', 'Supply Chain', '◈'], ['purchasing', 'Purchasing', '◇'], ['operations', 'Operations', '▤'], ['sales', 'Sales', '▥']] },
  { section: 'ANALYSIS', items: [['finance', 'Finance', '◫'], ['scenarios', 'Scenario Compare', '◉'], ['sensitivity', 'Sensitivity', '⌁'], ['data', 'Data / Assumptions', '☷']] }
];
const TITLES = Object.fromEntries(NAV.flatMap(g => g.items.map(([id, title]) => [id, title])));
const initial = { page: 'dashboard', decisions: emptyDecisions(), calibration: emptyCalibration(), scenarios: [], activeScenario: 'current', metric: 'roi' };
let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...initial, ...saved, decisions: { ...emptyDecisions(), ...saved.decisions }, calibration: { ...emptyCalibration(), ...saved.calibration }, page: 'dashboard' };
  } catch { return structuredClone(initial); }
}
function persist() { localStorage.setItem(KEY, JSON.stringify(state)); }
const number = (v, digits = 0) => v == null || !Number.isFinite(v) ? '—' : new Intl.NumberFormat('ko-KR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
const euro = (v, digits = 0) => v == null || !Number.isFinite(v) ? '—' : `${v < 0 ? '−' : ''}€${number(Math.abs(v), digits)}`;
const percent = (v, digits = 2) => v == null || !Number.isFinite(v) ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${number(Math.abs(v), digits)}%`;
const delta = (v, suffix = '') => v == null || !Number.isFinite(v) ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${number(Math.abs(v), 2)}${suffix}`;
const escapeHtml = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const model = () => simulate(state.decisions, state.calibration);
const pill = (text, cls = '') => `<span class="pill ${cls}">${text}</span>`;
const valueOrUnknown = (v, formatter = euro) => v == null ? '<span class="unknown-value">데이터 대기</span>' : formatter(v);

function pageHead(kicker, title, description, action = '') {
  return `<div class="page-header"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}
function renderNav() {
  document.querySelector('#nav').innerHTML = NAV.map(group => `<div class="nav-group"><span class="nav-heading">${group.section}</span>${group.items.map(([id, title, icon]) => `<button class="nav-item ${state.page === id ? 'active' : ''}" data-page="${id}"><span class="nav-icon">${icon}</span><span>${title}</span>${id === 'supply' ? '<span class="nav-featured">CORE</span>' : ''}</button>`).join('')}</div>`).join('');
  document.querySelector('#breadcrumb-current').textContent = TITLES[state.page];
}
function metricCard(label, value, foot, status = '') {
  return `<div class="metric-card"><div class="metric-top"><span>${label}</span>${status ? pill(status, status === '관측' ? 'observed' : 'estimated') : ''}</div><strong>${value}</strong><small>${foot}</small></div>`;
}
function dashboard(m) {
  const roi = m.ready ? m.roi : null;
  return `${pageHead('CONTROL ROOM / ROUND 1', '의사결정 전, 결과를 먼저.', 'Round 0 재무를 기준점으로 삼은 조건부 추정입니다. Round 1 실적 예측으로 확정할 수 없습니다.', '<button class="primary-button" data-page="supply">의사결정 시작 <span>→</span></button>')}
    <div class="hero-panel"><div><span class="hero-label"><span class="live-dot"></span> ROUND 1 SCENARIO</span><h2>예상 ROI <span>${valueOrUnknown(roi, percent)}</span></h2><p>${m.ready ? `Round 0 대비 ${delta(m.roi - observedRoi, '%p')} · 사용자 입력 가정 기반` : '필요한 의사결정 값과 모형 입력값을 입력하면 결과를 계산합니다.'}</p></div><div class="hero-baseline"><span>ROUND 0 · OBSERVED</span><strong>${percent(observedRoi)}</strong><small>보고서 표기 ${number(BASELINE.reportedRoi, 2)}%</small></div></div>
    <div class="metric-grid">${metricCard('영업이익', valueOrUnknown(m.ready ? m.operatingProfit : null), m.ready ? `기준 대비 ${euro(m.profitDelta)}` : `Round 0 ${euro(BASELINE.operatingProfit)}`, m.ready ? '추정' : '관측 기준')}${metricCard('총 투자자본', valueOrUnknown(m.ready ? m.investment : null), m.ready ? `기준 대비 ${euro(m.inventoryDelta)}` : `Round 0 ${euro(BASELINE.investment)}`, m.ready ? '추정' : '관측 기준')}${metricCard('재고자산 변화', valueOrUnknown(m.ready ? m.inventoryDelta : null), '원자재 + 완제품의 모형상 증감', '추정')}${metricCard('서비스 변화', m.ready ? delta(m.serviceDeltaPp, '%p') : '<span class="unknown-value">데이터 대기</span>', '완제품 안전재고 기준 대체 모형', '추정')}</div>
    <div class="content-grid"><section class="surface"><div class="section-heading"><div><span class="eyebrow">CAUSE → EFFECT</span><h2>ROI Driver Map</h2></div>${pill('설명 가능 모형')}</div><div class="driver-map"><div class="driver-root"><span>EXPECTED ROI</span><strong>${valueOrUnknown(roi, percent)}</strong></div><div class="driver-split"><div class="driver-box"><span>영업이익</span><strong>${valueOrUnknown(m.ready ? m.operatingProfit : null)}</strong><small>매출 영향 · 재고보유비 · 진부화</small></div><div class="driver-box"><span>총 투자자본</span><strong>${valueOrUnknown(m.ready ? m.investment : null)}</strong><small>원자재 재고 · 완제품 재고</small></div></div></div><div class="formula-strip">ROI = Operating Profit ÷ Total Investment <span>·</span> 확정된 회계 항등식</div></section>
    <section class="surface side-surface"><div class="section-heading"><div><span class="eyebrow">MODEL READINESS</span><h2>시뮬레이션 준비</h2></div></div>${readiness(m)}<button class="wide-link" data-page="data">데이터와 가정 확인 <span>→</span></button></section></div>
    <section class="surface lower-panel"><div class="section-heading"><div><span class="eyebrow">NEXT ACTION</span><h2>시나리오 워크플로</h2></div></div><div class="flow-steps"><div><b>01</b><strong>의사결정 입력</strong><span>Round 1 현재값과 변경값을 입력</span></div><div><b>02</b><strong>모형 보정</strong><span>관측값과 가정 계수를 분리</span></div><div><b>03</b><strong>ROI 확인</strong><span>재무 변화와 인과 경로 비교</span></div></div></section>`;
}
function readiness(m) {
  return `<div class="readiness-list"><div><span class="check ok">✓</span><div><strong>Round 0 재무 기준</strong><small>영업이익 · 투자자본 · ROI 확인</small></div></div><div><span class="check ${m.missingDecisions?.length ? '' : 'ok'}">${m.missingDecisions?.length ? '2' : '✓'}</span><div><strong>Round 1 의사결정</strong><small>${m.missingDecisions?.length ? `${m.missingDecisions.length}개 항목의 현재값 / 변경값 필요` : '입력 완료'}</small></div></div><div><span class="check ${m.missingCalibration?.length ? '' : 'ok'}">${m.missingCalibration?.length ? '3' : '✓'}</span><div><strong>재무 환산 입력값</strong><small>${m.missingCalibration?.length ? `${m.missingCalibration.length}개 관측·가정 입력 필요` : '입력 완료'}</small></div></div></div>`;
}
function decisionRow(d) {
  const v = state.decisions[d.id]; const changed = v.base != null && v.scenario != null && v.base !== v.scenario;
  return `<div class="decision-row"><div class="decision-name"><strong>${d.label}</strong><span>${d.effect}</span><small>${d.source}</small></div><div class="decision-input"><label>현재 Round 1 값<input inputmode="decimal" type="number" min="0" step="any" placeholder="미확인" data-decision="${d.id}" data-side="base" value="${v.base ?? ''}"></label><span class="input-arrow">→</span><label>시나리오<input inputmode="decimal" type="number" min="0" step="any" placeholder="입력" data-decision="${d.id}" data-side="scenario" value="${v.scenario ?? ''}"></label><span class="unit">${d.unit}</span></div>${changed ? pill('변경됨', 'modified') : '<span class="row-empty"></span>'}</div>`;
}
function supply(m) {
  return `${pageHead('DECISION WORKSPACE / SCM', 'Supply Chain', '실제 Round 1 값이 제공되지 않은 항목은 빈 칸으로 두었습니다. 현재값과 변경값을 입력해 비교하세요.', '<button class="primary-button" data-action="run">시뮬레이션 실행 <span>↗</span></button>')}
    <div class="supply-layout"><div><div class="section-tabs"><button class="section-tab active">재고 · 생산 계획</button><span>모든 값의 단위와 출처를 함께 표시합니다.</span></div><section class="surface decision-surface"><div class="section-heading"><div><span class="eyebrow">ROUND 1 DECISIONS</span><h2>의사결정 변수</h2></div>${pill('현재값 미제공', 'neutral')}</div><div class="decision-list">${DECISIONS.map(decisionRow).join('')}</div><div class="decision-footer"><span>값을 입력해도 시뮬레이션은 필수 보정값이 모두 있을 때만 계산됩니다.</span><button class="text-link" data-action="open-calibration">모형 입력값 설정 →</button></div></section></div>
    <aside class="impact-column"><section class="surface impact-surface"><span class="eyebrow">LIVE IMPACT</span><h2>예상 영향</h2>${m.ready ? `<div class="impact-stat"><span>예상 ROI</span><strong>${percent(m.roi)}</strong><small>Round 0 대비 ${delta(m.roi - observedRoi, '%p')}</small></div><div class="impact-rows"><div><span>원자재 재고</span><strong>${euro(m.rawInventoryDelta)}</strong></div><div><span>완제품 재고</span><strong>${euro(m.fgInventoryDelta)}</strong></div><div><span>재고보유비</span><strong>${euro(m.holdingCostDelta)}</strong></div><div><span>매출 변화</span><strong>${euro(m.revenueDelta)}</strong></div><div><span>진부화 비용</span><strong>${euro(m.obsolescenceCostDelta)}</strong></div></div>` : `<div class="empty-impact"><div class="empty-symbol">◈</div><strong>추정 대기</strong><p>정량 변수 4개와 보정 입력 8개를 채우면 재고, 영업이익, 투자자본, ROI를 계산합니다. 생산 확정구간은 정성 변수입니다.</p></div>`}<button class="wide-link" data-page="finance">재무 브리지 보기 <span>→</span></button></section><div class="source-note"><strong>Source-backed relationship</strong><p>완제품 안전재고 증가는 서비스 수준을 높일 수 있지만 재고, 운전자본, 진부화 위험도 키웁니다.</p><small>역할별 의사결정 보충 설명 · p.33</small></div></aside></div>`;
}
function finance(m) {
  const rows = [
    ['매출 증감', null, m.ready ? m.revenueDelta : null, '추정 · 서비스 대체 모형'],
    ['재고보유비 증감', null, m.ready ? m.holdingCostDelta : null, '추정 · 사용자 보유비율'],
    ['진부화 비용 증감', null, m.ready ? m.obsolescenceCostDelta : null, '추정 · 사용자 비율'],
    ['영업이익', BASELINE.operatingProfit, m.ready ? m.operatingProfit : null, 'Round 0 관측 → 시나리오 추정'],
    ['총 투자자본', BASELINE.investment, m.ready ? m.investment : null, 'Round 0 관측 → 시나리오 추정'],
    ['ROI', observedRoi, m.ready ? m.roi : null, '회계 항등식']
  ];
  return `${pageHead('FINANCIAL BRIDGE', 'Finance', '관측된 Round 0 기준점과 사용자 입력에 따른 변화분을 나란히 봅니다. Round 1 현재 상태의 재무 추정값은 아닙니다.')}
    <section class="surface finance-surface"><div class="section-heading"><div><span class="eyebrow">PROFIT & INVESTMENT</span><h2>기준점에서 시나리오까지</h2></div>${pill('Round 1 실적 아님', 'neutral')}</div><div class="table-wrap"><table><thead><tr><th>항목</th><th>Round 0 기준</th><th>시나리오</th><th>값의 성격</th></tr></thead><tbody>${rows.map(([name, base, scenario, status]) => `<tr class="${['영업이익','총 투자자본','ROI'].includes(name) ? 'strong-row' : ''}"><td>${name}</td><td>${base == null ? '—' : name === 'ROI' ? percent(base) : euro(base)}</td><td>${scenario == null ? '<span class="unknown-value">미계산</span>' : name === 'ROI' ? percent(scenario) : euro(scenario)}</td><td><span class="status-text">${status}</span></td></tr>`).join('')}</tbody></table></div><div class="finance-note">매출과 비용의 절대액은 원본 재무 세부 행이 확인되기 전까지 표시하지 않습니다. 계산된 변화분만 표시합니다.</div></section>
    ${m.ready ? explanation(m) : '<div class="inline-empty">모형 입력값이 모두 준비되면 의사결정 → KPI → 재무 → ROI의 계산 경로가 이곳에 나타납니다.</div>'}`;
}
function explanation(m) {
  return `<section class="surface explanation"><div class="section-heading"><div><span class="eyebrow">EXPLANATION TRACE</span><h2>왜 ROI가 변했나</h2></div></div><div class="trace-grid"><div><span class="trace-index">01 / DECISION</span><strong>${m.changed.length ? m.changed.map(d => d.label).join(' · ') : '변경 없음'}</strong><small>현재 Round 1 값과 시나리오 값 비교</small></div><div><span class="trace-index">02 / OPERATIONS</span><strong>재고 ${euro(m.inventoryDelta)}</strong><small>서비스 ${delta(m.serviceDeltaPp, '%p')} · 생산 확정구간은 정성 평가</small></div><div><span class="trace-index">03 / FINANCE</span><strong>이익 ${euro(m.profitDelta)}</strong><small>투자자본 ${euro(m.inventoryDelta)} 변화</small></div><div><span class="trace-index">04 / ROI</span><strong>${percent(observedRoi)} → ${percent(m.roi)}</strong><small>추정값 · 실제 Round 1 결과 아님</small></div></div></section>`;
}
function genericDepartment(id) {
  const content = {
    purchasing: ['구매', '공급업체 계약과 원자재 가용성', '납품구간이 길면 같은 가용성을 위해 더 많은 안전재고가 필요할 수 있습니다.', '납품구간 → 원자재 안전재고 → 재고자본 · 공급 안정성', 'p.2–4'],
    operations: ['운영', '생산 계획과 능력의 연결', '생산 확정구간이 길면 계획은 안정되지만 수요 변화에 대한 대응성은 줄어들 수 있습니다.', '생산 확정구간 → 생산 유연성 → 완제품 가용성', 'p.32–33'],
    sales: ['영업', '서비스 계약과 실현 매출', '합의 서비스 수준 달성 여부는 보너스와 페널티에 영향을 줄 수 있습니다.', '서비스 수준 → 보너스 / 페널티 → 영업이익', 'p.20–23']
  }[id];
  return `${pageHead(`DECISION WORKSPACE / ${id.toUpperCase()}`, content[0], content[1])}<div class="department-grid"><section class="surface department-card"><span class="eyebrow">SOURCE RELATIONSHIP</span><h2>${content[1]}</h2><p>${content[2]}</p><div class="relationship">${content[3].split(' → ').map((x, i) => `<span>${x}</span>${i < content[3].split(' → ').length - 1 ? '<b>→</b>' : ''}`).join('')}</div><small>출처: TFC 역할별 의사결정 보충 설명 ${content[4]}</small></section><section class="surface department-card"><span class="eyebrow">DATA STATUS</span><h2>계약·실적 데이터 대기</h2><p>저장소의 상세 데이터 묶음이 복원되면 업체, 설비, 고객 단위의 관측값과 선택 가능한 의사결정을 연결합니다.</p><div class="data-placeholder"><span>현재 표시 가능한 실제 수치</span><strong>Round 0 재무 기준</strong></div><button class="wide-link" data-page="data">데이터 상태 보기 <span>→</span></button></section></div>`;
}
function scenarios(m) {
  const records = [{ name: 'Round 0 · 관측', roi: observedRoi, profit: BASELINE.operatingProfit, investment: BASELINE.investment, type: 'observed' }, { name: '현재 시나리오', roi: m.ready ? m.roi : null, profit: m.ready ? m.operatingProfit : null, investment: m.ready ? m.investment : null, type: 'estimated' }, ...state.scenarios.map(s => ({ name: s.name, roi: s.result?.ready ? s.result.roi : null, profit: s.result?.ready ? s.result.operatingProfit : null, investment: s.result?.ready ? s.result.investment : null, type: 'saved', id: s.id }))];
  return `${pageHead('SCENARIO LIBRARY', 'Scenario Compare', '저장된 의사결정과 계산 결과를 Round 0 기준과 함께 비교합니다.', '<button class="primary-button" data-action="save-scenario">현재 시나리오 저장 <span>＋</span></button>')}<section class="surface finance-surface"><div class="section-heading"><div><span class="eyebrow">COMPARISON</span><h2>시나리오 결과</h2></div>${pill(`${state.scenarios.length}개 저장`)}</div><div class="table-wrap"><table><thead><tr><th>시나리오</th><th>ROI</th><th>영업이익</th><th>투자자본</th><th></th></tr></thead><tbody>${records.map(r => `<tr><td><strong>${escapeHtml(r.name)}</strong> ${pill(r.type === 'observed' ? '관측' : r.type === 'saved' ? '저장' : '현재', r.type === 'observed' ? 'observed' : 'estimated')}</td><td>${valueOrUnknown(r.roi, percent)}</td><td>${valueOrUnknown(r.profit)}</td><td>${valueOrUnknown(r.investment)}</td><td>${r.id ? `<button class="table-action" data-action="load-scenario" data-id="${r.id}">불러오기</button><button class="table-action danger" data-action="delete-scenario" data-id="${r.id}">삭제</button>` : ''}</td></tr>`).join('')}</tbody></table></div><div class="finance-note">비교표는 자동으로 “최선” 시나리오를 선택하지 않습니다. 서비스 수준과 모델 불확실성도 함께 검토하세요.</div></section>`;
}
function sensitivity(m) {
  const id = 'fgSafety', base = state.decisions[id]?.scenario;
  let points = [];
  if (m.ready && base != null) {
    for (let offset = -2; offset <= 2; offset++) {
      const v = Math.max(0, base + offset * 0.5);
      const next = structuredClone(state.decisions); next[id].scenario = v;
      const r = simulate(next, state.calibration);
      points.push({ x: v, y: r.ready ? r.roi : null });
    }
  }
  const ys = points.map(p => p.y).filter(x => x != null), min = Math.min(...ys), max = Math.max(...ys), range = Math.max(0.01, max - min);
  return `${pageHead('WHAT-IF ANALYSIS', 'Sensitivity Analysis', '완제품 안전재고를 현재 시나리오 주변에서 바꾸며 ROI 민감도를 확인합니다.')}${m.ready ? `<section class="surface sensitivity-surface"><div class="section-heading"><div><span class="eyebrow">ONE VARIABLE AT A TIME</span><h2>완제품 안전재고 · ROI</h2></div>${pill('0.5 weeks 간격')}</div><div class="bar-chart">${points.map(p => `<div class="bar-col"><span>${percent(p.y)}</span><div class="bar-track"><div style="height:${Math.max(6, ((p.y - min) / range * 80 + 20))}%"></div></div><strong>${number(p.x, 1)}w</strong></div>`).join('')}</div><div class="finance-note">서비스·진부화 계수는 사용자가 입력한 가정입니다. 관측 라운드 결과로 재보정하기 전에는 의사결정 근거로 단독 사용하지 마세요.</div></section>` : '<div class="inline-empty">의사결정과 모형 입력값을 채우면 민감도 그래프가 계산됩니다.</div>'}`;
}
function dataPage() {
  return `${pageHead('PROVENANCE & MODEL', 'Data / Assumptions', '모든 수치의 출처와 계산 상태를 확인합니다.')}
    <div class="data-grid"><section class="surface data-card"><span class="eyebrow">OBSERVED / ROUND 0</span><h2>확인된 기준점</h2><div class="data-line"><span>영업이익</span><strong>${euro(BASELINE.operatingProfit, 4)}</strong></div><div class="data-line"><span>총 투자자본</span><strong>${euro(BASELINE.investment, 4)}</strong></div><div class="data-line"><span>보고서 ROI</span><strong>${number(BASELINE.reportedRoi, 2)}%</strong></div><p>출처: FinanceReport_0라운드.xlsx 추출 결과 · DATA_COVERAGE_AUDIT.md</p></section><section class="surface data-card"><span class="eyebrow">UNAVAILABLE / ROUND 1</span><h2>현재 누락된 원본 값</h2><p>저장소의 압축 데이터 묶음은 복원되지 않습니다. Round 1 화면의 현재 의사결정 값, 세부 재무행, 제품별 수요·재고는 확인 전까지 빈 값으로 유지합니다.</p><div class="data-line"><span>Round 1 실현 ROI</span><strong>미발생 / 미관측</strong></div><div class="data-line"><span>Round 1 결정값</span><strong>원본 대기</strong></div></section><section class="surface data-card span-two"><span class="eyebrow">MODEL METHODS</span><h2>계산 방식과 경계</h2><div class="method-grid"><div><strong>확정된 회계식</strong><p>ROI = 영업이익 ÷ 총 투자자본. Round 0 수치로 보고서 표기값을 재현합니다.</p></div><div><strong>명시적 대체 모형</strong><p>재고 증분은 주간 수요 × 안전재고 또는 순환재고 변화 × 단위 재고가치로 계산합니다.</p></div><div><strong>사용자 보정 계수</strong><p>서비스 변화, 재고보유비, 진부화율은 TFC 내부 공식이 확인되지 않아 사용자가 입력합니다.</p></div><div><strong>기준점 가정</strong><p>Round 1의 현재 재무 실적이 없으므로 Round 0 재무 결과에 시나리오 증분을 더합니다. 따라서 결과는 조건부 추정입니다.</p></div><div><strong>아직 정량화하지 않은 효과</strong><p>생산 확정구간, 계약지수, 능력·노무, 구매 가격, 보너스·페널티 효과는 관계만 표시합니다.</p></div></div><button class="text-link" data-action="open-calibration">보정값 입력 →</button></section></div>`;
}
function render() {
  const m = model(); renderNav();
  document.querySelector('#view').innerHTML = ({ dashboard: () => dashboard(m), supply: () => supply(m), finance: () => finance(m), purchasing: () => genericDepartment('purchasing'), operations: () => genericDepartment('operations'), sales: () => genericDepartment('sales'), scenarios: () => scenarios(m), sensitivity: () => sensitivity(m), data: dataPage })[state.page]();
}
function renderCalibration() {
  document.querySelector('#calibration-fields').innerHTML = CALIBRATION.map(field => `<label class="calibration-field"><span><strong>${field.label}</strong>${pill(field.kind === 'observed' ? '관측 입력' : '가정 입력', field.kind === 'observed' ? 'observed' : 'estimated')}</span><small>${field.help}</small><div class="calibration-control"><input type="number" inputmode="decimal" min="0" step="any" data-calibration="${field.id}" value="${state.calibration[field.id] ?? ''}" placeholder="미입력"><span>${field.unit}</span></div></label>`).join('');
}
function openCalibration() { renderCalibration(); document.querySelector('#calibration-dialog').showModal(); }
function parseInput(value) { return value.trim() === '' ? null : Number(value); }
document.addEventListener('click', event => {
  const page = event.target.closest('[data-page]');
  if (page) { state.page = page.dataset.page; persist(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'open-calibration') openCalibration();
  if (action === 'run') { state.page = 'finance'; persist(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  if (action === 'save-scenario') {
    const name = prompt('시나리오 이름을 입력하세요', `Scenario ${state.scenarios.length + 1}`);
    if (!name?.trim()) return;
    state.scenarios.push({ id: crypto.randomUUID(), name: name.trim(), decisions: structuredClone(state.decisions), calibration: structuredClone(state.calibration), result: model() });
    persist(); render();
  }
  if (action === 'load-scenario') {
    const saved = state.scenarios.find(s => s.id === button.dataset.id);
    if (saved) { state.decisions = structuredClone(saved.decisions); state.calibration = structuredClone(saved.calibration); state.page = 'supply'; persist(); render(); }
  }
  if (action === 'delete-scenario') { state.scenarios = state.scenarios.filter(s => s.id !== button.dataset.id); persist(); render(); }
});
document.addEventListener('change', event => {
  const input = event.target.closest('[data-decision]');
  if (!input) return;
  state.decisions[input.dataset.decision][input.dataset.side] = parseInput(input.value);
  persist(); render();
});
document.querySelector('#open-calibration').addEventListener('click', openCalibration);
document.querySelector('#notice-action').addEventListener('click', openCalibration);
document.querySelector('#calibration-form').addEventListener('submit', event => {
  if (event.submitter?.value === 'cancel') return;
  for (const input of document.querySelectorAll('[data-calibration]')) state.calibration[input.dataset.calibration] = parseInput(input.value);
  persist(); render();
});
document.querySelector('#clear-calibration').addEventListener('click', () => { state.calibration = emptyCalibration(); persist(); renderCalibration(); render(); });
render();
