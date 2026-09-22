import {
  SUPPLIERS, CUSTOMER_CONTRACTS, SCM_MATERIAL_VALUES, SCM_PRODUCT_VALUES,
  SALES_PRODUCT_REPORT, SCM_RAW_REPORT, SCM_FG_REPORT
} from './screens.js';

// Round 0 finance report: realized accounting anchor, not a realized Round 1 result.
export const BASELINE = Object.freeze({
  round: 0, revenue: 2306254.8984, grossProfit: 903148.1457,
  operatingProfit: -306503.3078, investment: 3989513.2650, reportedRoi: -7.68
});

// Observed Round 0 FinanceReport_0라운드.xlsx line items. Unit costs below extrapolate
// from these rows; the game's response to a changed decision remains unverified.
export const FINANCE_ANCHORS = Object.freeze({
  inventoryInvestment: 321424.4914, inventoryInterestCost: 24106.8369,
  rawWarehouseEmployees: 5, rawWarehouseStaffCost: 100000,
  finishedWarehouseEmployees: 4, finishedWarehouseStaffCost: 80000,
  rawWarehousePositions: 900, rawWarehousePositionsCost: 90000,
  finishedWarehousePositions: 1500, finishedWarehousePositionsCost: 150000
});

// Replaceable surrogate assumptions, not official TFC coefficients. Values derived
// from FINANCE_ANCHORS are observed accounting ratios, linearly extrapolated.
export const MODEL_ASSUMPTIONS = Object.freeze({
  roundWeeks: 26, // Approximation from the visible 26-week sales history.
  holdingRatePerRound: FINANCE_ANCHORS.inventoryInterestCost / FINANCE_ANCHORS.inventoryInvestment,
  fgServicePpPerSafetyWeek: 0.8,
  servicePpPerContractTargetPp: 0.2,
  servicePpPerSupplierReliabilityPp: 0.08,
  servicePpPerLeadWeek: -0.25,
  servicePpPerShift: 0.5,
  servicePpPerWarehouseEmployee: 0.1,
  servicePpPerFrozenWeek: -0.15,
  rawSafetyWeeksPerLeadWeek: 0.15,
  rawSafetyWeeksPerReliabilityPp: -0.02,
  fgSafetyWeeksPerContractPp: 0.15,
  laborCostPerEmployeeRound: FINANCE_ANCHORS.rawWarehouseStaffCost / FINANCE_ANCHORS.rawWarehouseEmployees,
  laborCostPerShiftRound: 18000,
  warehouseCostPerPalletPositionRound: FINANCE_ANCHORS.rawWarehousePositionsCost / FINANCE_ANCHORS.rawWarehousePositions,
  shelfObsolescencePpPerTargetPp: 0.1
});

export const DEPARTMENT_FOR_KIND = Object.freeze({
  supplier: 'purchasing', warehouse: 'operations', bottling: 'operations',
  customer: 'sales', material: 'supplyChain', product: 'supplyChain', production: 'supplyChain'
});
export const emptyScenario = () => ({purchasing:{}, operations:{}, sales:{}, supplyChain:{}});
export const scenarioKey = (kind, name) => `${kind}:${name}`;

const number = value => Number(String(value ?? '').replace(/[,€%\s]/g, '')) || 0;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const ratio = (amount, total) => total ? amount / total : 0;
const diff = (next, original, key) => number(next[key]) - number(original[key]);
const saved = (scenario, kind, name, original) => ({
  ...original, ...(scenario?.[DEPARTMENT_FOR_KIND[kind]]?.[scenarioKey(kind, name)] || {})
});
// Round 0 screenshot values: Purchasing #44, Sales #34.
const supplierSpending = [110692, 307931, 409042, 81658, 2295];
const customerRevenue = [1045136, 586461, 674658];

export function calculateScenario(scenario = emptyScenario()) {
  const a = MODEL_ASSUMPTIONS;
  const suppliers = SUPPLIERS.map(s => saved(scenario, 'supplier', s.name, s));
  const customers = CUSTOMER_CONTRACTS.map(c => saved(scenario, 'customer', c.name, c));
  const materials = SCM_MATERIAL_VALUES.map(m => saved(scenario, 'material', m.name, m));
  const products = SCM_PRODUCT_VALUES.map(p => saved(scenario, 'product', p.name, p));
  const rawWarehouseBase = {pallet:'900', staff:'5'};
  const fgWarehouseBase = {pallet:'1500', staff:'4'};
  const rawWarehouse = saved(scenario, 'warehouse', '원자재 창고', rawWarehouseBase);
  const fgWarehouse = saved(scenario, 'warehouse', '네덜란드 유통센터', fgWarehouseBase);
  const bottlingBase = {shifts:'2'};
  const bottling = saved(scenario, 'bottling', '스위스 필2', bottlingBase);
  const production = saved(scenario, 'production', '생산관리', {frozen:'3'});
  const totalSupplierSpend = supplierSpending.reduce((x, y) => x + y, 0);
  const totalCustomerRevenue = customerRevenue.reduce((x, y) => x + y, 0);
  let purchaseCostDelta = 0, payableInvestmentDelta = 0, receivableInvestmentDelta = 0;
  let contractRevenueDelta = 0, supplierServicePp = 0, rawInventoryDelta = 0;
  let fgInventoryDelta = 0, obsolescenceCostDelta = 0, serviceRevenueDelta = 0;
  const trace = [];

  suppliers.forEach((s, i) => {
    const b = SUPPLIERS[i], spend = supplierSpending[i], weight = ratio(spend, totalSupplierSpend);
    const indexDelta = diff(s, b, 'index');
    purchaseCostDelta += spend * ratio(indexDelta, number(b.index));
    payableInvestmentDelta -= spend * diff(s, b, 'payment') / a.roundWeeks;
    supplierServicePp += weight * (
      diff(s, b, 'reliability') * a.servicePpPerSupplierReliabilityPp +
      diff(s, b, 'lead') / 7 * a.servicePpPerLeadWeek
    );
    const rawWeeksDelta = diff(s, b, 'lead') / 7 * a.rawSafetyWeeksPerLeadWeek +
      diff(s, b, 'reliability') * a.rawSafetyWeeksPerReliabilityPp;
    const rawReport = SCM_RAW_REPORT[i];
    const stockDelta = number(rawReport[4]) / number(rawReport[3]) * (
      diff(materials[i], SCM_MATERIAL_VALUES[i], 'safety') +
      diff(materials[i], SCM_MATERIAL_VALUES[i], 'lot') / 2 + rawWeeksDelta
    );
    rawInventoryDelta += stockDelta;
    if (indexDelta || diff(s, b, 'lead') || diff(s, b, 'reliability') ||
        diff(s, b, 'payment') || diff(materials[i], SCM_MATERIAL_VALUES[i], 'safety') ||
        diff(materials[i], SCM_MATERIAL_VALUES[i], 'lot')) {
      trace.push({department:'구매 · 공급사슬', decision:`${b.material} / ${b.name}`,
        kpi:'원자재 재고·구매비·공급 안정성', inventoryDelta:stockDelta,
        note:'보고서의 재고 금액·재고 주수·구매금액과 공개된 대체 계수 사용'});
    }
  });

  let contractTargetPp = 0, shelfTargetPp = 0;
  customers.forEach((c, i) => {
    const b = CUSTOMER_CONTRACTS[i], annualRevenue = customerRevenue[i];
    const weight = ratio(annualRevenue, totalCustomerRevenue);
    contractRevenueDelta += annualRevenue * ratio(diff(c, b, 'index'), number(b.index));
    receivableInvestmentDelta += annualRevenue * diff(c, b, 'payment') / a.roundWeeks;
    contractTargetPp += weight * diff(c, b, 'service');
    shelfTargetPp += weight * diff(c, b, 'shelf');
    if (diff(c, b, 'index') || diff(c, b, 'service') || diff(c, b, 'shelf') || diff(c, b, 'payment')) {
      trace.push({department:'판매', decision:b.name, kpi:'계약 매출·목표 서비스수준·운전자본',
        note:'고객별 Round 0 매출과 계약 변경값을 사용한 대체 모형'});
    }
  });

  const employeeDelta = diff(rawWarehouse, rawWarehouseBase, 'staff') + diff(fgWarehouse, fgWarehouseBase, 'staff');
  const palletDelta = diff(rawWarehouse, rawWarehouseBase, 'pallet') + diff(fgWarehouse, fgWarehouseBase, 'pallet');
  const shiftDelta = diff(bottling, bottlingBase, 'shifts');
  const frozenDelta = diff(production, {frozen:'3'}, 'frozen');
  const laborCostDelta = employeeDelta * a.laborCostPerEmployeeRound + shiftDelta * a.laborCostPerShiftRound;
  const warehouseCostDelta = palletDelta * a.warehouseCostPerPalletPositionRound;
  const operationServicePp = shiftDelta * a.servicePpPerShift +
    employeeDelta * a.servicePpPerWarehouseEmployee + frozenDelta * a.servicePpPerFrozenWeek;
  if (employeeDelta || palletDelta || shiftDelta || frozenDelta) {
    trace.push({department:'생산운영 · 공급사슬', decision:'정직원·파레트 위치·교대근무·생산확정 구간',
      kpi:'인건비·창고 위치 비용·서비스수준', note:'직원·파레트 단가는 Round 0 비용의 선형 외삽, 교대·서비스는 대체 계수'});
  }

  const serviceDeltaPp = clamp(
    supplierServicePp + operationServicePp + contractTargetPp * a.servicePpPerContractTargetPp,
    -20, 20
  );
  products.forEach((p, i) => {
    const b = SCM_PRODUCT_VALUES[i], report = SCM_FG_REPORT[i], productSales = SALES_PRODUCT_REPORT[i];
    const weeksDelta = diff(p, b, 'safety') + diff(p, b, 'interval') / 10 +
      contractTargetPp * a.fgSafetyWeeksPerContractPp;
    const stockDelta = number(report[5]) / number(report[4]) * weeksDelta;
    fgInventoryDelta += stockDelta;
    const productServiceDelta = clamp(
      serviceDeltaPp + diff(p, b, 'safety') * a.fgServicePpPerSafetyWeek,
      -number(productSales[5]), 100 - number(productSales[5])
    );
    serviceRevenueDelta += number(productSales[2]) * a.roundWeeks * productServiceDelta / 100;
    const baselineObsolescencePct = number(report[8]);
    obsolescenceCostDelta += Math.max(0, stockDelta) * baselineObsolescencePct / 100 +
      number(report[5]) * shelfTargetPp * a.shelfObsolescencePpPerTargetPp / 100;
    if (diff(p, b, 'safety') || diff(p, b, 'interval') || contractTargetPp || serviceDeltaPp) {
      trace.push({department:'공급사슬 · 판매', decision:b.name,
        kpi:'완제품 재고·서비스수준·매출·진부화', inventoryDelta:stockDelta,
        note:'제품별 Round 0 재고·주당 매출과 공개된 서비스 대체 계수 사용'});
    }
  });

  const inventoryDelta = rawInventoryDelta + fgInventoryDelta;
  const holdingCostDelta = inventoryDelta * a.holdingRatePerRound;
  const revenueDelta = contractRevenueDelta + serviceRevenueDelta;
  // The observed Round 0 gross-margin ratio is applied to incremental revenue as a surrogate.
  const incrementalGrossProfit = revenueDelta * ratio(BASELINE.grossProfit, BASELINE.revenue);
  const operatingProfitDelta = incrementalGrossProfit - purchaseCostDelta - laborCostDelta -
    warehouseCostDelta - holdingCostDelta - obsolescenceCostDelta;
  const investmentDelta = inventoryDelta + payableInvestmentDelta +
    receivableInvestmentDelta;
  const revenue = BASELINE.revenue + revenueDelta;
  const operatingProfit = BASELINE.operatingProfit + operatingProfitDelta;
  const investment = BASELINE.investment + investmentDelta;
  const roi = investment > 0 ? operatingProfit / investment * 100 : null;
  return {
    ready: roi !== null && Number.isFinite(roi), roi, revenue, operatingProfit, investment,
    revenueDelta, operatingProfitDelta, investmentDelta, rawInventoryDelta, fgInventoryDelta,
    inventoryDelta, holdingCostDelta, obsolescenceCostDelta, purchaseCostDelta, laborCostDelta,
    warehouseCostDelta,
    serviceDeltaPp, contractRevenueDelta, serviceRevenueDelta, payableInvestmentDelta,
    receivableInvestmentDelta, trace,
    provenance:'Round 0 실제 재무·운영 보고서 + Round 1 저장 의사결정 + 공개된 대체 모형 가정'
  };
}
