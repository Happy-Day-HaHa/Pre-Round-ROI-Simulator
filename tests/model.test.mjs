import {BASELINE, FINANCE_ANCHORS, MODEL_ASSUMPTIONS, emptyScenario, scenarioKey, calculateScenario} from '../site/model.js';

function assert(condition, message) { if (!condition) throw new Error(message); }
function copy(value) { return JSON.parse(JSON.stringify(value)); }

const original = calculateScenario(emptyScenario());
assert(original.ready, 'Round 1 original proxy must calculate without extra inputs');
assert(Math.abs(original.operatingProfit - BASELINE.operatingProfit) < 0.001, 'Round 0 operating profit anchor');
assert(Math.abs(original.investment - BASELINE.investment) < 0.001, 'Round 0 investment anchor');
assert(Math.abs(original.roi - BASELINE.reportedRoi) < 0.01, 'Round 0 reported ROI precision');
assert(Math.abs(MODEL_ASSUMPTIONS.holdingRatePerRound - FINANCE_ANCHORS.inventoryInterestCost / FINANCE_ANCHORS.inventoryInvestment) < 1e-12, 'Inventory interest uses observed Round 0 finance ratio');
assert(MODEL_ASSUMPTIONS.laborCostPerEmployeeRound === 20000, 'Warehouse labor unit cost matches observed staffing cost');
assert(MODEL_ASSUMPTIONS.warehouseCostPerPalletPositionRound === 100, 'Warehouse position unit cost matches observed finance report');

const individualDecisions = [
  ['purchasing','supplier','Miami Oranges',{index:'1.02'}],
  ['purchasing','supplier','Miami Oranges',{lead:'20'}],
  ['purchasing','supplier','Miami Oranges',{payment:'5'}],
  ['purchasing','supplier','Miami Oranges',{reliability:'99'}],
  ['operations','warehouse','원자재 창고',{pallet:'950'}],
  ['operations','warehouse','원자재 창고',{staff:'6'}],
  ['operations','bottling','스위스 필2',{shifts:'3'}],
  ['sales','customer','Food & Groceries',{index:'1.02'}],
  ['sales','customer','Food & Groceries',{service:'98'}],
  ['sales','customer','Food & Groceries',{shelf:'80'}],
  ['sales','customer','Food & Groceries',{payment:'5'}],
  ['supplyChain','material','오렌지',{safety:'3'}],
  ['supplyChain','material','오렌지',{lot:'5'}],
  ['supplyChain','product','프레시 오렌지 PET',{safety:'2'}],
  ['supplyChain','product','프레시 오렌지 PET',{interval:'12'}],
  ['supplyChain','production','생산관리',{frozen:'4'}]
];
for(const [department,kind,name,patch] of individualDecisions){
  const scenario=emptyScenario();
  scenario[department][scenarioKey(kind,name)]=patch;
  const result=calculateScenario(scenario);
  assert(result.ready && result.roi !== original.roi, kind+' '+Object.keys(patch)[0]+' save must update ROI');
}
const palletOnly = emptyScenario();
palletOnly.operations[scenarioKey('warehouse','원자재 창고')] = {pallet:'950'};
const palletResult = calculateScenario(palletOnly);
assert(palletResult.warehouseCostDelta === 5000 && palletResult.operatingProfitDelta === -5000, '50 extra pallet positions add observed warehouse cost');
assert(palletResult.investmentDelta === 0, 'Pallet position cost is not misclassified as capital investment');

const scm = emptyScenario();
scm.supplyChain[scenarioKey('product', '프레시 오렌지 PET')] = {safety:'2'};
const afterScm = calculateScenario(scm);
assert(afterScm.ready && afterScm.roi !== original.roi, 'One product safety change immediately changes ROI');
assert(afterScm.fgInventoryDelta < 0, 'Lower safety stock reduces finished goods inventory');
assert(afterScm.trace.some(t => t.decision === '프레시 오렌지 PET'), 'Explanation identifies changed product');

const combined = copy(scm);
combined.sales[scenarioKey('customer', 'Food & Groceries')] = {service:'98'};
const afterSales = calculateScenario(combined);
assert(afterSales.roi !== afterScm.roi, 'Sales save changes the accumulated scenario ROI');
assert(afterSales.fgInventoryDelta > afterScm.fgInventoryDelta, 'Higher target service increases required inventory proxy');
assert(afterSales.trace.some(t => t.department === '판매'), 'Explanation includes sales change');
const shelfOnly = emptyScenario();
shelfOnly.sales[scenarioKey('customer', 'Food & Groceries')] = {shelf:'80'};
assert(calculateScenario(shelfOnly).roi !== original.roi, 'Shelf-life contract change has a visible modeled effect');

combined.purchasing[scenarioKey('supplier', 'Miami Oranges')] = {lead:'20', reliability:'99'};
const afterPurchasing = calculateScenario(combined);
assert(afterPurchasing.roi !== afterSales.roi, 'Purchasing save changes ROI');
assert(afterPurchasing.rawInventoryDelta !== afterSales.rawInventoryDelta, 'Lead time and reliability affect raw inventory proxy');

combined.operations[scenarioKey('warehouse', '원자재 창고')] = {pallet:'950', staff:'6'};
const afterOperations = calculateScenario(combined);
assert(afterOperations.roi !== afterPurchasing.roi, 'Operations save changes ROI');
assert(afterOperations.laborCostDelta > afterPurchasing.laborCostDelta, 'Extra employee changes labor cost');

combined.supplyChain = {};
const resetDepartment = calculateScenario(combined);
assert(resetDepartment.fgInventoryDelta !== afterOperations.fgInventoryDelta, 'Department reset removes SCM inventory change');
assert(resetDepartment.trace.some(t => t.department === '판매'), 'Department reset preserves Sales decisions');
assert(Math.abs(calculateScenario(emptyScenario()).roi - original.roi) < 1e-9, 'Full reset restores original ROI');
print('model tests passed');
