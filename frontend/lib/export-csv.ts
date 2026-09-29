/**
 * Universal CSV Export utility for CSM reports and tables.
 * Uses UTF-8 BOM (\uFEFF) to ensure Microsoft Excel correctly parses
 * Khmer text and special characters without garbled encodings.
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const sanitizeCell = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const cellStr = String(cell).replace(/"/g, '""');
    return `"${cellStr}"`;
  };

  const headerLine = headers.map(sanitizeCell).join(",");
  const dataLines = rows.map((row) => row.map(sanitizeCell).join(","));
  const csvContent = "\uFEFF" + [headerLine, ...dataLines].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `${filename}_${dateStr}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
