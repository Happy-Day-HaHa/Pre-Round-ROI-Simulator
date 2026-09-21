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
  { id: 'weeklyDemand', label: '평균 주간 수요', unit: 'units / week', help: 'Round 1 판매 예측 또는 관측 주간 수요', kind: 'observed' },
  { id: 'rawUnitValue', label: '원자재 단위 재고가치', unit: '€ / unit', help: '재고 평가액 ÷ 해당 원자재 수량', kind: 'observed' },
  { id: 'fgUnitValue', label: '완제품 단위 재고가치', unit: '€ / unit', help: '재고 평가액 ÷ 해당 완제품 수량', kind: 'observed' },
  { id: 'unitRevenue', label: '완제품 단위 매출', unit: '€ / unit', help: '판매 예측 수량에 대응하는 매출 단가', kind: 'observed' },
  { id: 'roundWeeks', label: '계산 대상 기간', unit: 'weeks', help: '이번 시나리오가 포괄하는 기간', kind: 'assumed' },
  { id: 'annualHoldingRate', label: '연간 재고보유비율', unit: '% / year', help: 'TFC 내부 계수 미확인. 사용자가 보정하는 가정', kind: 'assumed' },
  { id: 'servicePpPerWeek', label: '안전재고 1주당 서비스 변화', unit: '%p / week', help: 'TFC 내부 계수 미확인. 실제 라운드 관측 후 보정', kind: 'assumed' },
  { id: 'obsolescenceRate', label: '완제품 재고 증분 중 진부화 비율', unit: '% / round', help: 'TFC 내부 계수 미확인. 실제 라운드 관측 후 보정', kind: 'assumed' }
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
