from pathlib import Path
import base64, gzip, io, tarfile

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "knowledge_pack" / "tfc_text_bundle.tar.gz.b64"

if not SRC.exists():
    raise SystemExit(f"Missing bundle: {SRC}")

raw = base64.b64decode(SRC.read_text(encoding="ascii"))
with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as tf:
    for member in tf.getmembers():
        target = (ROOT / member.name).resolve()
        if ROOT.resolve() not in target.parents and target != ROOT.resolve():
            raise RuntimeError(f"Unsafe archive path: {member.name}")
    tf.extractall(ROOT)

print("TFC knowledge pack unpacked successfully.")
print("Read AGENTS.md, CODEX_INSTRUCTIONS.md, DATA_COVERAGE_AUDIT.md, SOURCE_INDEX.md, data/master_dataset.json and docs/TFC_role_guide_full_text.txt.")
