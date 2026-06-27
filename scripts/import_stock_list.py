from __future__ import annotations

import argparse
import os
import re
import sys
from decimal import Decimal
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

import django  # noqa: E402

django.setup()

from django.db import transaction  # noqa: E402
from django.utils import timezone  # noqa: E402

from api.models import Category, InventoryLog, Product  # noqa: E402


def fix_text(value: str) -> str:
    try:
        value = value.encode("latin1").decode("utf-8")
    except UnicodeError:
        pass
    return re.sub(r"\s+", " ", value).strip(" -")


def infer_category(name: str) -> str:
    text = name.lower()
    if "soap" in text or "beauty bar" in text:
        return "Bar Soap"
    if any(term in text for term in ["cleanser", "toner", "face wash", "facial wash"]):
        return "Cleansers & Toners"
    if "shampoo" in text or "conditioner" in text:
        return "Hair Care"
    if "scrub" in text or "spa salt" in text or re.search(r"\bsalt\b", text):
        return "Body Scrub"
    if "body oil" in text or re.search(r"\boil\b", text):
        return "Body Oil"
    if any(term in text for term in ["cream", "gel", "moisturiser", "moisturizer"]):
        return "Face Creams"
    if "lotion" in text:
        return "Lotions"
    return "Skin Care"


def parse_price(text: str) -> tuple[str, int]:
    matches = list(re.finditer(r"#\s*(?:\d+\s*=\s*)?(\d+)", text))
    equals_matches = list(re.finditer(r"=\s*(\d+)\s*$", text))
    trailing_matches = list(re.finditer(r"(?:^|\s)(\d{3,5})\s*$", text))
    if not matches and not equals_matches and not trailing_matches:
        return text.replace("#", " "), 0
    match = (matches or equals_matches or trailing_matches)[-1]
    price = int(match.group(1))
    return (text[: match.start()] + " " + text[match.end() :]), price


def parse_quantity(text: str) -> tuple[str, int]:
    match = re.search(r"\bqty\s*([0-9]+)\b", text, flags=re.IGNORECASE)
    if not match:
        return re.sub(r"\bqty\b", " ", text, flags=re.IGNORECASE), 1

    raw = match.group(1)
    if len(raw) > 2:
        quantity = int(raw[0])
        replacement = raw[1:]
    else:
        quantity = int(raw)
        replacement = ""
    return text[: match.start()] + " " + replacement + " " + text[match.end() :], quantity


def parse_barcode(text: str) -> tuple[str, str]:
    text = re.sub(r"(?<=\d)\s+(?=\d)", "", text)
    matches = list(re.finditer(r"\d{8,18}", text))
    if not matches:
        return text, ""
    match = matches[-1]
    barcode = match.group(0)
    return (text[: match.start()] + " " + text[match.end() :]), barcode


def parse_rows(raw_text: str, prefix: str = "P-LIST") -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    current_category = ""
    for raw_line in raw_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        number_match = re.match(r"^(\d+)\.\s*(.*)$", line)
        if not number_match:
            heading = fix_text(line).strip(":").title()
            if heading and len(heading) <= 40:
                current_category = heading
            continue

        list_no = int(number_match.group(1))
        body = number_match.group(2).strip()
        if not body:
            continue

        body, price = parse_price(body)
        body, quantity = parse_quantity(body)
        body, barcode = parse_barcode(body)
        name = fix_text(body)
        if not name:
            continue

        rows.append(
            {
                "list_no": list_no,
                "id": f"{prefix}-{len(rows) + 1:03d}",
                "category": current_category or infer_category(name),
                "name": name,
                "barcode": barcode,
                "quantity": quantity,
                "price": price,
            }
        )
    return rows


def import_rows(rows: list[dict[str, object]], dry_run: bool = False) -> tuple[int, int, int]:
    created = 0
    updated = 0
    skipped_barcodes = 0
    seen_barcodes: set[str] = set()

    with transaction.atomic():
        for item in rows:
            category, _ = Category.objects.get_or_create(name=str(item["category"]))
            barcode = str(item["barcode"]).strip() or None
            if barcode and barcode in seen_barcodes:
                barcode = None
                skipped_barcodes += 1
            if barcode:
                seen_barcodes.add(barcode)

            product = Product.objects.filter(id=str(item["id"])).first()
            if product is None and barcode:
                product = Product.objects.filter(serial_code=barcode).first()

            if barcode and Product.objects.filter(serial_code=barcode).exclude(id=product.id if product else "").exists():
                barcode = None
                skipped_barcodes += 1

            defaults = {
                "name": str(item["name"]),
                "description": f"Imported stock list item {item['list_no']}",
                "sku": barcode,
                "serial_code": barcode,
                "category": category,
                "quantity": int(item["quantity"]),
                "cost_price": Decimal("0"),
                "selling_price": Decimal(str(item["price"])),
                "low_stock_at": 2,
                "supplier": None,
            }

            if product is None:
                product = Product(id=str(item["id"]), **defaults)
                created += 1
            else:
                for field, value in defaults.items():
                    setattr(product, field, value)
                updated += 1

            if not dry_run:
                product.save()
                InventoryLog.objects.update_or_create(
                    id=f"TX-{item['id']}",
                    defaults={
                        "product": product,
                        "type": "Stock In",
                        "quantity": int(item["quantity"]),
                        "note": "Imported stock list",
                        "created_at": timezone.now(),
                    },
                )

        if dry_run:
            transaction.set_rollback(True)

    return created, updated, skipped_barcodes


def main() -> None:
    parser = argparse.ArgumentParser(description="Import numbered stock list text into Kingstore inventory.")
    parser.add_argument("path", type=Path)
    parser.add_argument("--prefix", default="P-LIST")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    rows = parse_rows(args.path.read_text(encoding="utf-8", errors="replace"), prefix=args.prefix)
    created, updated, skipped_barcodes = import_rows(rows, args.dry_run)
    print(f"Parsed {len(rows)} products")
    print(f"Created {created} products")
    print(f"Updated {updated} products")
    print(f"Skipped duplicate/conflicting barcodes {skipped_barcodes}")


if __name__ == "__main__":
    main()
