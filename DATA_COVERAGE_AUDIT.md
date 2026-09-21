# Data Coverage Audit

## Current-conversation source inventory

All source files supplied in this conversation were inventoried before packaging:

- PNG screenshots: **43 / 43 accounted for**
- Excel workbooks: **3 / 3 accounted for**
- PDF guides: **1 / 1 accounted for**
- Total: **47 / 47**

### Screenshot coverage
- Round 0 Purchasing: 6 / 6
- Round 0 Operations: 4 / 4
- Round 0 Sales: 9 / 9
- Round 0 SCM: 7 / 7
- Round 0 My Company: 1 / 1
- Round 1 Purchasing: 4 / 4
- Round 1 Operations: 4 / 4
- Round 1 Sales: 4 / 4
- Round 1 SCM: 3 / 3
- Round 1 My Company: 1 / 1

The repository bundle contains machine-readable extraction of all screenshot information used in the analysis. Raw PNG bytes are not embedded in GitHub because the connected GitHub write interface used here is text-oriented; SHA-256/source mapping is retained in the local full pack. No screenshot-derived numeric datum intentionally used by the project was dropped from the structured dataset.

### Excel coverage
`TFC_-2_0.xlsx`:
- 13 / 13 sheets extracted.
- Historical records preserve round identifiers -2, -1, 0.
- `운송업체-창고` contains only a header row in the source, therefore zero data records is correct.

Finance workbooks:
- 65 / 65 used rows represented for each.
- Round 0 and Round 1-named workbooks are identical at extracted-value level.

### PDF coverage
- 38-page guide extracted using its text layer.
- Full text and role-specific splits are in the packed data after running the unpack script.

## Round interpretation
- Round 0: completed baseline.
- Round 1: active decision state.
- No realized Round 1 KPI/finance result is present.
- Historical Round 0 values displayed while viewing Round 1 must not be relabeled as Round 1 outcomes.

## Baseline cross-check
- Round 0 ROI: -7.68%
- Operating Profit: -EUR 306,503.3078
- Total Investment: EUR 3,989,513.2650
- Operating Profit / Total Investment reproduces reported ROI to report precision.

## Entire-project limitation

Earlier project chats referenced raw files that are not available in the current runtime:
- `자료4_TFC_영상_PDF_교차분석_텍스트.md`
- `TFC_AI_전달용_영상스크립트_정리본.md`
- `TFC_OT자료.pdf`

Recovered high-level facts are included in `docs/PRIOR_CONTEXT_RECOVERED.md` inside the bundle, but verbatim zero-omission preservation of those unavailable historical raw files cannot be certified until they are re-uploaded.

### Certification

- Current-conversation dataset: source-inventory complete (47/47) and machine-readable.
- Entire multi-chat project history: not certifiable as zero-omission until the unavailable earlier raw files are re-uploaded.
