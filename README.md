# The Fresh Connection - Pre-Round ROI Simulator Knowledge Pack

## Web prototype

The current interactive prototype is in [`site/`](site/). Run it locally with:

```bash
python3 -m http.server 8765 --directory site
```

Then open <http://127.0.0.1:8765/>. Enter the current Round 1 settings and proposed values under **Supply Chain**, then fill **모형 입력값** to calculate a conditional ROI bridge. Scenarios are stored in this browser's local storage. The interface is in Korean.

The verified Round 0 operating profit, investment, and ROI are built in. The complete machine-readable bundle described below is not present in the current `main` branch, so detailed Round 1 settings and finance rows remain unknown. The website never presents a fabricated Round 1 result. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the data schema, provenance, calculation method, and limitations.

This repository is the source-of-truth context for building a **pre-round ROI estimator / digital twin** for The Fresh Connection (TFC).

## Goal

TFC exposes realized ROI only after a round is calculated. This project aims to estimate ROI **before round close** by connecting decisions across Purchasing, Operations, Sales, Supply Chain Management, and Finance.

Target causal chain:

`Decision -> Operational KPI -> Inventory / Service / Cost -> Revenue / Operating Profit -> Investment -> ROI`

The model must let a user change current-round decision values in a TFC-like interface and immediately see estimated ROI, KPI changes, sensitivity, and the reason for the change.

## Current game state represented here

- Completed historical data: rounds **-2, -1, 0**
- Baseline round: **Round 0**
- Active scenario: **Round 1**
- Realized Round 1 result: **not available yet**
- Important: the file named `FinanceReport_1라운드.xlsx` still contains historical results only through Round 0 and is identical to the Round 0 finance report at the extracted-value level.

## Read order for Codex

1. `AGENTS.md`
2. `CODEX_INSTRUCTIONS.md`
3. `DATA_COVERAGE_AUDIT.md`
4. `SOURCE_INDEX.md`
5. `data/round0_structured.json`
6. `data/round1_structured.json`
7. `data/historical_minus2_to0.json`
8. `data/finance_normalized.json`
9. `docs/TFC_ROLE_GUIDE_FULL_TEXT.txt`
10. `docs/PROJECT_CONTEXT.md`
11. `docs/PRIOR_CONTEXT_RECOVERED.md`

## Data provenance

- `observed`: directly visible in source screenshot/report/file.
- `derived`: mathematically calculated from observed values.
- `inferred`: interpretation of source behavior; not an exact game formula.
- `assumed`: explicit modeling assumption.

Never silently convert an inferred or assumed value into an observed value.

## Baseline finance anchor

Round 0:
- ROI: **-7.68%**
- Operating profit: **-EUR 306,503.3078**
- Total investment: **EUR 3,989,513.2650**

The reported ROI matches `Operating Profit / Total Investment` within report precision.
