// Values transcribed from the screenshots supplied in this conversation.
// The image number is displayed in the UI so each figure stays traceable.
export const PRODUCTS = ['프레시 오렌지 1 리터','프레시 오렌지/C-파워 1 리터','프레시 오렌지/망고 1 리터','프레시 오렌지 PET','프레시 오렌지/C-파워 PET','프레시 오렌지/망고 PET'];
export const MATERIALS = ['1 리터 팩','PET','오렌지','망고','비타민 C'];
export const CUSTOMERS = ['Food & Groceries','LAND Market',"Dominick's"];
export const DEPARTMENTS = [
  {id:'purchasing',label:'구매',icon:'♧'},
  {id:'operations',label:'생산운영',icon:'▤'},
  {id:'sales',label:'판매',icon:'▰'},
  {id:'scm',label:'공급사슬',icon:'♧'}
];
export const TABS = {
  purchasing:['대시보드','공급업체','원자재/구성품','분석','의사결정 로그'],
  operations:['대시보드','창고보고','혼합공정과 용기주입공정','분석','의사결정 로그'],
  sales:['대시보드','고객','완제품','고객 제품','제품 고객','분석','의사결정 로그'],
  scm:['대시보드','원자재','완제품','분석','의사결정 로그']
};
export const CURRENT_TABS = {
  purchasing:['계약 현황'],
  operations:['원자재 입고','혼합공정','용기주입','완제품 출고'],
  sales:['계약 현황','주문관리','카테고리 관리'],
  scm:['원자재','생산','완제품']
};
export const SUPPLIERS = [
  {material:'팩',name:'Mono Packaging Materials',index:'0.9940',quality:'높음',lead:'15',cert:'✕',country:'프랑스',capacity:'18%',payment:'4',unit:'파레트',reliability:'95.0%',window:'4시간',source:40},
  {material:'페트',name:'Trio PET PLC',index:'0.9620',quality:'나쁨',lead:'10',cert:'✕',country:'스페인',capacity:'3%',payment:'4',unit:'파레트',reliability:'94.0%',window:'1일',source:16},
  {material:'오렌지',name:'Miami Oranges',index:'1.0040',quality:'높음',lead:'30',cert:'✓',country:'미국',capacity:'38%',payment:'4',unit:'탱크',reliability:'98.0%',window:'1일',source:17},
  {material:'망고',name:'NO8DO Mango',index:'1.0580',quality:'높음',lead:'10',cert:'✓',country:'스페인',capacity:'4%',payment:'4',unit:'중급 벌크 컨테이너',reliability:'96.0%',window:'1일',source:20},
  {material:'비타민 C',name:'Seitan Vitamins',index:'0.9658',quality:'높음',lead:'60',cert:'✕',country:'중국',capacity:'50%',payment:'8',unit:'드럼',reliability:'90.0%',window:'1일',source:20}
];
export const CUSTOMER_CONTRACTS = [
  {name:'Food & Groceries',index:'1.0085',type:'주문 라인품목',service:'95.0',shelf:'75.0',cutoff:'8pm',unit:'파레트 층(단)',payment:'4',pressure:'중간',forecast:'짧은',source:19},
  {name:'LAND Market',index:'0.9615',type:'주문 라인품목',service:'95.0',shelf:'75.0',cutoff:'5pm',unit:'파레트 층(단)',payment:'4',pressure:'중간',forecast:'짧은',source:17},
  {name:"Dominick's",index:'1.0166',type:'주문 라인품목',service:'95.0',shelf:'75.0',cutoff:'12pm',unit:'파레트',payment:'4',pressure:'중간',forecast:'짧은',source:17}
];
export const SCM_MATERIAL_VALUES = MATERIALS.map(name=>({name,safety:'2.0',lot:'4.0',source:26}));
export const SCM_PRODUCT_VALUES = PRODUCTS.map(name=>({name,interval:'10',safety:'3.0',warehouse:'네덜란드 유통센터',source:26}));
export const SALES_PRODUCT_REPORT = [
  ['프레시 오렌지 1 리터','67,394','€ 25,508','€ 0.379','€ 0.147','93.4%','92.1%','87.2%','3','€ 569','0.0%','8.4%','€ 1,319'],
  ['프레시 오렌지/C-파워 1 리터','11,361','€ 5,256','€ 0.463','€ 0.204','83.8%','80.3%','82.0%','2','€ 779','0.3%','7.1%','€ 210'],
  ['프레시 오렌지/망고 1 리터','42,162','€ 17,018','€ 0.404','€ 0.137','97.4%','97.0%','91.2%','3','€ 532','0.1%','8.8%','€ 993'],
  ['프레시 오렌지 PET','118,084','€ 23,935','€ 0.203','€ 0.079','98.0%','97.5%','97.6%','4','€ 399','0.0%','8.2%','€ 1,201'],
  ['프레시 오렌지/C-파워 PET','17,741','€ 5,229','€ 0.295','€ 0.155','83.6%','80.6%','83.0%','3','€ 1,259','-0.2%','5.5%','€ 137'],
  ['프레시 오렌지/망고 PET','51,040','€ 11,756','€ 0.230','€ 0.093','97.1%','96.1%','98.5%','3','€ 557','-0.1%','8.0%','€ 561']
];
export const SCM_RAW_REPORT = [
  ['1 리터 팩','92.3%','564,440','4.3','€ 17,553','8.7','132,257','0.0%','99.5%','0.1%','3,559,348','619,636'],
  ['PET','84.1%','851,667','4.2','€ 46,566','7.7','204,297','0.0%','99.5%','-0.0%','5,631,948','951,612'],
  ['오렌지','97.8%','160,757','4.5','€ 70,610','10.8','35,360','0.0%','99.3%','0.0%','931,265','172,581'],
  ['망고','93.7%','14,089','4.4','€ 13,983','7.7','3,165','0.0%','100.0%','0.0%','82,276','15,497'],
  ['비타민 C','81.5%','769','4.2','€ 364','18.4','184','0.0%','84.3%','0.2%','4,852','1,032']
];
export const SCM_FG_REPORT = [
  ['프레시 오렌지 1 리터','67,394','93.4%','92.1%','3.2','€ 49,522','7.5','€ 0','8.4%','€ 1,319','49.0%','0.0%','13.0','€ 934','€ 646','82.9%'],
  ['프레시 오렌지/C-파워 1 리터','11,361','83.8%','80.3%','2.5','€ 7,466','7.5','€ 0','7.1%','€ 210','60.6%','0.3%','13.0','€ 1,043','€ 1,021','69.8%'],
  ['프레시 오렌지/망고 1 리터','42,162','97.4%','97.0%','3.3','€ 37,556','7.5','€ 0','8.8%','€ 993','50.9%','0.1%','13.0','€ 1,075','€ 1,424','82.9%'],
  ['프레시 오렌지 PET','118,084','98.0%','97.5%','3.4','€ 49,505','7.6','€ 0','8.2%','€ 1,201','47.1%','0.0%','13.0','€ 1,663','€ 1,056','83.3%'],
  ['프레시 오렌지/C-파워 PET','17,741','83.6%','80.6%','2.3','€ 5,761','7.4','€ 0','5.5%','€ 137','58.4%','-0.2%','13.0','€ 1,876','€ 1,829','70.1%'],
  ['프레시 오렌지/망고 PET','51,040','97.1%','96.1%','3.2','€ 22,539','7.5','€ 0','8.0%','€ 561','51.7%','-0.1%','13.0','€ 1,843','€ 2,336','83.3%']
];
