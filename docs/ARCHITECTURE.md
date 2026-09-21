# Web prototype architecture

The website lives in `site/` and runs as a static web app. It has no build step or backend.

## Data flow

1. `screens.js` stores the values transcribed from the user-supplied screenshots. The UI cites the image number near each report or decision table.
2. `model.js` stores the observed Round 0 finance anchor and declares decision and calibration schemas.
3. `app.js` keeps Round 1 edits, calibration inputs, and saved scenarios in browser `localStorage`. Round 0 views use the original values and are read-only.
4. `simulate()` returns either missing-input status or an explicit delta bridge from decisions to inventory, service, revenue, operating profit, investment, and ROI.
5. The UI renders status and explanation trace from that result. A saved scenario includes its inputs and calculated result.

## Provenance and round identity

| Value | Round | Status | Source |
| --- | ---: | --- | --- |
| Operating profit -€306,503.3078 | 0 | observed | `DATA_COVERAGE_AUDIT.md`, extracted finance report |
| Total investment €3,989,513.2650 | 0 | observed | `DATA_COVERAGE_AUDIT.md`, extracted finance report |
| Reported ROI -7.68% | 0 | observed | `DATA_COVERAGE_AUDIT.md`, extracted finance report |
| Visible supplier, customer, operations, and SCM settings | 1 | observed in screenshots, then editable locally | User-supplied screenshots; image numbers in `screens.js` |
| Full underlying game dataset and formulas | 1 | unavailable | Detailed bundle unavailable in current repository state |
| ROI after a decision change | 1 | estimated, conditional | Round 0 anchor + explicit surrogate delta model |

The Round 1-named finance workbook contains historical columns through Round 0, not realized Round 1 financial results. The prototype never labels that workbook as Round 1 performance.

## Model boundaries

The final accounting identity is `ROI = operating profit / total investment`. Round 0 reproduces -7.68% at report precision. Changes in raw and finished goods inventory use demand weeks and unit values supplied by the user. Holding cost, service response, and obsolescence use user-supplied assumptions. Production interval uses an explicit five-working-days-per-week conversion. The frozen period is shown as a source-supported directional decision and has no numeric coefficient.

The current scenario estimate applies modeled changes to Round 0 financials because current Round 1 financials are unavailable. This is a conditional comparison, not a forecast calibrated against realized Round 1 data. Purchasing, Operations, and Sales show source-supported relationships but have no numeric prediction until observed inputs and calibrated parameters are available.

The existing aggregate SCM surrogate is used only when all five raw materials share the same safety stock and order size, and all six finished products share the same safety stock and production interval. Different per-item settings cannot be weighted reliably without item demand and cost data, so the UI reports the estimate as unavailable instead of averaging them.

## Missing source pack

`python3 scripts/unpack_knowledge.py` currently fails because `knowledge_pack/tfc_text_bundle.tar.gz.b64` is absent from `main`. Git history contains a truncated archive and `safe_chunks/` currently contains only parts 000–002; those parts do not form a valid complete archive. The website shows the values visible in the supplied screenshots and leaves unsupported values or calculations unavailable. When the complete source pack is supplied, normalize it into a versioned JSON file, bind decision inputs to source values, and validate each finance line item against the observed baseline before extending the causal model.
