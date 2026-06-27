export function generateNumericBarcode(existingBarcodes: Iterable<string>) {
  const existing = new Set(Array.from(existingBarcodes, (barcode) => barcode.trim()).filter(Boolean));

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const randomParts = new Uint32Array(2);
    window.crypto.getRandomValues(randomParts);
    const barcode = Array.from(randomParts, (part) => String(part % 100_000).padStart(5, "0")).join("");
    if (!existing.has(barcode)) return barcode;
  }

  return `${Date.now()}`.slice(-10).padStart(10, "0");
}
