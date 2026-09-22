// A small DOM harness verifies the save trigger without a browser automation dependency.
const nodes = new Map(), listeners = new Map();
const node = selector => {
  if (!nodes.has(selector)) nodes.set(selector, {
    innerHTML:'', textContent:'', classList:{toggle(){}}, showModal(){this.open=true},
    close(){this.open=false}, addEventListener(type,handler){listeners.set(selector+':'+type,handler)}
  });
  return nodes.get(selector);
};
globalThis.structuredClone = value => JSON.parse(JSON.stringify(value));
globalThis.localStorage = {
  data:new Map(), getItem(key){return this.data.get(key)||null},
  setItem(key,value){this.data.set(key,value)}
};
globalThis.document = {
  querySelector:node, querySelectorAll(){return []},
  addEventListener(type,handler){listeners.set('document:'+type,handler)}
};
globalThis.window = {scrollTo(){}};
function assert(condition,message){if(!condition)throw new Error(message)}
function click(selector,dataset={}){
  listeners.get('document:click')({target:{closest(query){return query===selector?{dataset}:null}}});
}
function saveDecision(kind,name,fields){
  click('[data-edit]',{edit:kind,name});
  const before=node('#global-roi').innerHTML;
  assert(node('#edit-dialog').open,'Edit dialog opens');
  listeners.get('#edit-fields:input')();
  assert(node('#draft-status').textContent.includes('저장되지 않은 변경사항'),'Draft is labeled unsaved');
  assert(node('#global-roi').innerHTML===before,'Opening edit does not recalculate ROI');
  const elements={namedItem(id){return {value:fields[id]}}};
  listeners.get('#edit-form:submit')({preventDefault(){},currentTarget:{elements}});
  assert(!node('#edit-dialog').open,'Save closes dialog');
  assert(node('#global-roi').innerHTML!==before,'Save recalculates header ROI');
}

await import('../site/app.js');
assert(node('#global-roi').innerHTML.includes('예상 ROI'),'Expected ROI is visible on load');
assert(!node('#subtabs').innerHTML.includes('모형 입력값'),'Separate calibration tab is absent');
const initial=node('#global-roi').innerHTML;
saveDecision('product','프레시 오렌지 PET',{interval:'10',safety:'2'});
const afterScm=node('#global-roi').innerHTML;
saveDecision('customer','Food & Groceries',{index:'1.0085',service:'98',shelf:'75',payment:'4'});
saveDecision('supplier','Miami Oranges',{index:'1.0040',lead:'20',payment:'4',reliability:'99'});
saveDecision('warehouse','원자재 창고',{pallet:'950',staff:'6'});
assert(node('#impact-panel').innerHTML.includes('ROI 변화 이유') && node('#impact-panel').innerHTML.includes('영업이익'),'Save impact panel explains financial change');
const persisted=JSON.parse(localStorage.getItem('tfc-screen-ui-v3'));
assert(Object.keys(persisted.scenario).length===4,'Global scenario has four departments');
assert(persisted.scenario.supplyChain['product:프레시 오렌지 PET'].safety==='2','SCM decision persists');
assert(persisted.scenario.sales['customer:Food & Groceries'].service==='98','Sales decision persists');
click('[data-reset-department]',{resetDepartment:'operations'});
assert(JSON.parse(localStorage.getItem('tfc-screen-ui-v3')).scenario.supplyChain['product:프레시 오렌지 PET'].safety==='2','Department reset preserves other departments');
click('[data-reset-scenario]');
assert(node('#global-roi').innerHTML===initial,'Full reset restores original expected ROI');
assert(afterScm!==initial,'SCM change affected ROI');
print('UI save-flow tests passed');
