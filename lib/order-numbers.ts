function datePart(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function generateOrderNumber(): string {
  return `RUP-${datePart()}-${randomSuffix()}`;
}

export function generateWorkOrderNumber(): string {
  return `WO-${datePart()}-${randomSuffix()}`;
}

export function generatePONumber(): string {
  return `PO-${datePart()}-${randomSuffix()}`;
}
