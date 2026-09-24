import hashlib
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

def normalize(value):
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", text.casefold()).strip()


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def governance_status(value):
    status = normalize(value)
    if "regra de seguranca" in status: return "REGRA_SEGURANCA"
    if "requer validacao" in status or "validar" in status: return "PENDENTE_VALIDACAO"
    if "anedotica" in status or "case" in status: return "CASE_INTERNO"
    if "premissa" in status: return "PREMISSA_COMERCIAL"
    if "treinamento" in status or "tecnica" in status or "insight" in status or "regra comercial" in status: return "TREINAMENTO_INTERNO"
    if "validado" in status: return "VALIDADO"
    return "PENDENTE_VALIDACAO"


def import_jsonl(path):
    records, errors = [], []
    with path.open("r", encoding="utf-8-sig") as handle:
        for line_number, raw in enumerate(handle, 1):
            if not raw.strip():
                continue
            try:
                row = json.loads(raw)
                if not isinstance(row, dict):
                    raise ValueError("esperado objeto JSON")
                missing = [key for key in ("id", "category", "title", "statement", "source") if not row.get(key)]
                if missing:
                    raise ValueError("campos ausentes: " + ", ".join(missing))
                original_status = str(row.get("status") or "Não informado")
                now = datetime.now(timezone.utc).isoformat()
                records.append({
                    "knowledge_id": str(row["id"]),
                    "id": str(row["id"]),
                    "category": str(row["category"]),
                    "subcategory": str(row.get("subcategory") or ""),
                    "title": str(row["title"]),
                    "content": str(row["statement"]),
                    "text": str(row["statement"]),
                    "status": governance_status(original_status),
                    "originalStatus": original_status,
                    "confidence": str(row.get("confidence") or "Não informada"),
                    "tags": [str(tag) for tag in row.get("tags", []) if str(tag).strip()],
                    "source": str(row["source"]),
                    "origin": path.name,
                    "locator": f"linha {line_number}",
                    "created_at": str(row.get("created_at") or now),
                    "updated_at": str(row.get("updated_at") or now),
                    "last_reviewed_at": str(row.get("last_reviewed_at") or ""),
                })
            except Exception as exc:
                errors.append({"line": line_number, "error": str(exc)})
    return records, errors


def main():
    jsonl, docx, output = map(Path, sys.argv[1:4])
    canonical, errors = import_jsonl(jsonl)
    all_records = canonical
    seen, duplicates = {}, []
    for record in all_records:
        fingerprint = normalize(record["text"])
        if fingerprint in seen:
            duplicates.append({"kept": seen[fingerprint], "duplicate": record["id"]})
        else:
            seen[fingerprint] = record["id"]
    deduplicated = [record for record in all_records if seen.get(normalize(record["text"])) == record["id"]]
    cautions = [
        record["id"] for record in deduplicated
        if any(term in normalize(record.get("status")) for term in ("requer validacao", "pendente validacao", "premissa", "case interno"))
        or any(term in normalize(record["text"]) for term in ("nao garantir", "nao prometer"))
    ]
    result = {
        "schemaVersion": 1,
        "version": "0.1",
        "importedAt": datetime.now(timezone.utc).isoformat(),
        "sources": [
            {"file": jsonl.name, "sha256": sha256(jsonl)},
            {"file": docx.name, "sha256": sha256(docx)},
        ],
        "governance": {"structuredSource": jsonl.name, "humanManual": docx.name, "docxIndexed": False},
        "stats": {
            "jsonlRecords": len(canonical),
            "docxRecords": 0,
            "indexedRecords": len(deduplicated),
            "errors": len(errors),
            "duplicates": len(duplicates),
            "cautions": len(cautions),
        },
        "errors": errors,
        "duplicates": duplicates,
        "cautions": cautions,
        "records": deduplicated,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: result[key] for key in ("version", "stats", "sources")}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
