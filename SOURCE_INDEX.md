# Source Index

## Current-conversation sources

### Historical workbook
`TFC_-2_0.xlsx`
- 13 sheets
- rounds -2, -1, 0
- extracted to JSON matrices and row records in the packed dataset

Sheets:
1. 원자재
2. 공급업체
3. 공급업체-원자재
4. 용기주입 라인
5. 혼합기
6. 고객
7. 고객-제품
8. 완제품
9. 창고, 판매지역
10. 운송업체-창고
11. 판매지역-고객-제품
12. 운송업체
13. 제품-창고

### Finance reports
- `FinanceReport_0라운드.xlsx`
- `FinanceReport_1라운드.xlsx`

Both contain one Output sheet A1:D65 and are identical. They contain round columns -2, -1, 0. The Round 1-named report does not contain a realized Round 1 result.

### Role guide
`TFC 역할별 의사결정 보충 설명.pdf`
- 38 pages
- full text extracted and split by Purchasing, Operations, Sales, SCM, FAQ

### Screenshots
43 screenshots:
- R0 Purchasing 6
- R0 Operations 4
- R0 Sales 9
- R0 SCM 7
- R0 My Company 1
- R1 Purchasing 4
- R1 Operations 4
- R1 Sales 4
- R1 SCM 3
- R1 My Company 1

Machine-readable screenshot values are included in the packed files.

## Packed payload

`knowledge_pack/tfc_text_bundle.tar.gz.b64` contains the exact generated text/JSON knowledge pack. Decode it with `python scripts/unpack_knowledge.py`.
