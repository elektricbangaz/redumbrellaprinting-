export function formatJMD(cents: number): string {
  return `JMD $${(cents / 100).toLocaleString("en-JM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
