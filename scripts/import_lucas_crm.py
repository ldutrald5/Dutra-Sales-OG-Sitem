import json
import re
import shutil
import sys
from datetime import date, datetime, timezone
from pathlib import Path

import openpyxl

SOURCE = Path(r"C:\Users\usuario\OneDrive\Desktop\CRM_LUCASD_ATUALIZADO_2026-09-18.xlsx")
ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "apps" / "sistema-og" / ".data" / "shared-state.json"
EXPORT = ROOT / "apps" / "sistema-og" / "imports" / "lucas-2026.json"

STATUS = {
    "Em conversa": "contatado",
    "Interessado": "contatado",
    "Aguardando retorno": "contatado",
    "Negociação": "negociacao",
    "Cliente": "fechado",
    "Cliente fidelizado": "fechado",
    "Não tem interesse": "perdido",
    "Sem potencial": "perdido",
}

PRIORITY = {"Urgente": "alta", "Alta": "alta", "Média": "media", "Baixa": "baixa"}


def text(value):
    return str(value or "").strip()


def iso(value, local=False):
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%dT%H:%M") if local else value.isoformat()
    if isinstance(value, date):
        return value.strftime("%Y-%m-%dT00:00") if local else datetime.combine(value, datetime.min.time()).isoformat()
    return ""


def normalize_phone(value):
    return re.sub(r"\D", "", text(value))


def load_rows():
    workbook = openpyxl.load_workbook(SOURCE, data_only=True, read_only=False)
    sheet = workbook["📋 CRM"]
    leads = []
    for row in range(8, 1001):
        values = [sheet.cell(row, column).value for column in range(1, 24)]
        company = text(values[1])
        status_label = text(values[3])
        summary = text(values[9])
        last_contact = values[8]
        if not company or not summary or not last_contact or status_label == "Não abordado":
            continue
        source_code = text(values[0])
        contact = text(values[21]) or company.title()
        last_contact_iso = iso(last_contact)
        lead_id = f"CRM-{source_code}" if source_code else f"CRM-LUCAS-{row:03d}"
        leads.append({
            "id": lead_id,
            "nome": contact,
            "empresa": company,
            "telefone": normalize_phone(values[2]),
            "cnpj": text(values[17]),
            "cidadeUf": text(values[20]),
            "segmentId": "transportadora",
            "status": STATUS.get(status_label, "contatado"),
            "observacoes": summary,
            "createdDate": last_contact_iso,
            "priority": PRIORITY.get(text(values[7]), "media"),
            "fleetSize": 0,
            "pain": summary,
            "decisionMaker": contact,
            "nextAction": text(values[5]),
            "followUpAt": iso(values[6], local=True),
            "lastContactAt": last_contact_iso,
            "source": {
                "type": "excel",
                "file": SOURCE.name,
                "sheet": "📋 CRM",
                "row": row,
                "customerCode": source_code,
                "originalStatus": status_label,
                "temperature": text(values[4]),
                "potential": text(values[10]),
            },
            "interactions": [{
                "id": f"INT-IMPORT-{row}",
                "at": last_contact_iso,
                "type": "conversa",
                "note": summary,
            }],
        })
    return leads


def main():
    leads = load_rows()
    STATE.parent.mkdir(parents=True, exist_ok=True)
    EXPORT.parent.mkdir(parents=True, exist_ok=True)
    current = {"revision": 0, "updatedAt": None, "leads": [], "history": []}
    if STATE.exists():
        current = json.loads(STATE.read_text(encoding="utf-8"))
        backup = STATE.with_name(f"shared-state.before-lucas-import-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json")
        shutil.copy2(STATE, backup)
    retained = [lead for lead in current.get("leads", []) if lead.get("source", {}).get("file") != SOURCE.name and "DEMO" not in text(lead.get("empresa")).upper()]
    merged = leads + retained
    updated = {
        "revision": int(current.get("revision", 0)) + 1,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "leads": merged,
        "history": current.get("history", []),
    }
    STATE.write_text(json.dumps(updated, ensure_ascii=False, indent=2), encoding="utf-8")
    EXPORT.write_text(json.dumps({"source": SOURCE.name, "count": len(leads), "leads": leads}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"imported": len(leads), "retained": len(retained), "total": len(merged), "state": str(STATE), "export": str(EXPORT)}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"IMPORT_ERROR: {error}", file=sys.stderr)
        raise
