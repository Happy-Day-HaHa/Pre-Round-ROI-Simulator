// Observed Round 0 anchors: FinanceReport_0라운드.xlsx, as documented in DATA_COVERAGE_AUDIT.md.
export const BASELINE = Object.freeze({ round: 0, operatingProfit: -306503.3078, investment: 3989513.2650, reportedRoi: -7.68 });

export const DECISIONS = Object.freeze([
  { id: 'rawSafety', label: '원자재 안전재고', unit: 'weeks', group: '재고', source: '역할별 의사결정 보충 설명 p.31', effect: '원자재 재고 · 자본 · 공급 안정성' },
  { id: 'rawLot', label: '원자재 LOT 크기', unit: 'weeks', group: '재고', source: '역할별 의사결정 보충 설명 p.31', effect: '순환재고 · 창고 공간 · 구매 효율' },
  { id: 'fgSafety', label: '완제품 안전재고', unit: 'weeks', group: '재고', source: '역할별 의사결정 보충 설명 p.33', effect: '서비스 수준 · 재고 · 진부화' },
  { id: 'productionInterval', label: '생산 간격', unit: 'working days', group: '생산', source: '역할별 의사결정 보충 설명 p.33', effect: '완제품 순환재고 · 생산 효율' },
  { id: 'frozenPeriod', label: '생산 확정구간', unit: 'weeks', group: '생산', source: '역할별 의사결정 보충 설명 p.32', effect: '구매 안정성 · 생산 균등화 · 수요 대응성' }
]);

export const CALIBRATION = Object.freeze([
  { id: 'weeklyDemand', label: '주당 수요(개)', unit: '개 / 주', help: '판매 > 완제품 보고서의 「주당 수요(개)」에 해당하는 입력값', kind: 'observed' },
  { id: 'rawUnitValue', label: '원자재 재고 단가', unit: '€ / 개 또는 리터', help: '공급사슬 > 원자재 보고서의 「재고 금액 ÷ 재고(개수 또는 리터)」로 계산', kind: 'derived' },
  { id: 'fgUnitValue', label: '완제품 재고 단가', unit: '€ / 개', help: '공급사슬 > 완제품 보고서의 「재고 금액」을 추정 재고 수량으로 나눈 모형 입력값', kind: 'derived' },
  { id: 'unitRevenue', label: '판매 단가', unit: '€ / 개', help: '판매 > 완제품 보고서의 「판매 단가」에 해당하는 입력값', kind: 'observed' },
  { id: 'roundWeeks', label: '시뮬레이션 기간', unit: 'weeks', help: '이번 시나리오에서 계산할 기간. TFC 보고서 항목이 아닌 모형 설정', kind: 'assumed' },
  { id: 'annualHoldingRate', label: '재고 보유비율 (연간)', unit: '% / year', help: '재고 금액에 적용할 연간 보유비율. TFC 내부 계수 미확인', kind: 'assumed' },
  { id: 'servicePpPerWeek', label: '서비스수준(개수) 변화', unit: '%p / week', help: '완제품 「안전재고 (weeks)」를 1주 늘렸을 때의 변화. TFC 내부 계수 미확인', kind: 'assumed' },
  { id: 'obsolescenceRate', label: '추가 완제품 재고의 진부화율', unit: '% / round', help: '공급사슬 > 완제품의 「진부화」와 관련된 모형 가정. TFC 내부 계수 미확인', kind: 'assumed' }
]);

export const emptyDecisions = () => Object.fromEntries(DECISIONS.map(d => [d.id, { base: null, scenario: null }]));
export const emptyCalibration = () => Object.fromEntries(CALIBRATION.map(d => [d.id, null]));

export const observedRoi = BASELINE.operatingProfit / BASELINE.investment * 100;
const valid = n => typeof n === 'number' && Number.isFinite(n);
const complete = obj => Object.values(obj).every(valid);

export function simulate(decisions, calibration) {
  const values = Object.fromEntries(DECISIONS.map(({ id }) => [id, decisions[id] || {}]));
  const changed = DECISIONS.filter(({ id }) => valid(values[id].base) && valid(values[id].scenario) && values[id].base !== values[id].scenario);
  // Frozen period has only a source-supported directional link so it is optional for numeric output.
  const missingDecisions = DECISIONS.filter(({ id }) => id !== 'frozenPeriod' && (!valid(values[id].base) || !valid(values[id].scenario))).map(d => d.label);
  const missingCalibration = CALIBRATION.filter(({ id }) => !valid(calibration[id])).map(d => d.label);
  if (missingDecisions.length || missingCalibration.length || Object.values(calibration).some(v => valid(v) && v < 0) || calibration.roundWeeks === 0) return { ready: false, changed, missingDecisions, missingCalibration };
  const d = id => values[id].scenario - values[id].base;
  const c = calibration;
  // A named, replaceable surrogate. No TFC internal coefficient is claimed.
  const rawInventoryDelta = c.weeklyDemand * (d('rawSafety') + d('rawLot') / 2) * c.rawUnitValue;
  // Production interval is in working days; five working days per week is a visible modeling assumption.
  const fgInventoryDelta = c.weeklyDemand * (d('fgSafety') + d('productionInterval') / 10) * c.fgUnitValue;
  const inventoryDelta = rawInventoryDelta + fgInventoryDelta;
  const holdingCostDelta = inventoryDelta * c.annualHoldingRate / 100 * c.roundWeeks / 52;
  // A bounded service proxy; frozen period has no numerical coefficient and stays qualitative.
  const serviceDeltaPp = Math.max(-100, Math.min(100, d('fgSafety') * c.servicePpPerWeek));
  const lostRevenueDelta = -c.weeklyDemand * c.roundWeeks * c.unitRevenue * serviceDeltaPp / 100;
  const obsolescenceCostDelta = Math.max(0, fgInventoryDelta) * c.obsolescenceRate / 100;
  const profitDelta = -lostRevenueDelta - holdingCostDelta - obsolescenceCostDelta;
  const operatingProfit = BASELINE.operatingProfit + profitDelta;
  const investment = BASELINE.investment + inventoryDelta;
  const roi = investment > 0 ? operatingProfit / investment * 100 : null;
  return {
    ready: roi !== null, changed, rawInventoryDelta, fgInventoryDelta, inventoryDelta,
    holdingCostDelta, serviceDeltaPp, lostRevenueDelta, obsolescenceCostDelta,
    profitDelta, operatingProfit, investment, roi,
    revenueDelta: -lostRevenueDelta,
    uncertainty: ['Round 1 실적 미관측', '재고·서비스·진부화 계수는 사용자 입력 가정', '구매·생산·판매의 나머지 효과는 수치화 전', '생산 확정구간의 정량 효과 미반영']
  };
}
