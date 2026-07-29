import { PdfDocument } from './pdfDocument';
import { PdfTheme } from './theme';

export interface SimpleTableOptions {
  columnWidths: number[];
  headers: string[];
  rows: string[][];
}

/** Renders a minimal bordered table with a styled header row and zebra striping. */
export function renderSimpleTable(doc: PdfDocument, options: SimpleTableOptions): void {
  const { columnWidths, headers, rows } = options;
  const startX = doc.page.margins.left;
  const rowHeight = PdfTheme.spacing.tableRowHeight;
  let y = doc.y;

  const drawRow = (values: string[], bgColor: string | undefined, textColor: string, isHeader: boolean): void => {
    let x = startX;
    if (bgColor) {
      doc.rect(startX, y, columnWidths.reduce((a, b) => a + b, 0), rowHeight).fill(bgColor);
    }
    doc.font(isHeader ? PdfTheme.fonts.heading : PdfTheme.fonts.body).fontSize(PdfTheme.fontSize.small).fillColor(textColor);
    values.forEach((value, i) => {
      doc.text(value, x + 4, y + 6, { width: columnWidths[i] - 8, ellipsis: true });
      x += columnWidths[i];
    });
    y += rowHeight;
  };

  drawRow(headers, PdfTheme.colors.tableHeaderBg, PdfTheme.colors.tableHeaderText, true);
  rows.forEach((row, index) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y;
    }
    drawRow(row, index % 2 === 1 ? PdfTheme.colors.tableRowAlt : undefined, PdfTheme.colors.body, false);
  });

  doc.y = y + 6;
}
