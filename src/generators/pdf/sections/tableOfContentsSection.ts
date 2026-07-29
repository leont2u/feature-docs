import { PdfDocument } from '../pdfDocument';
import { TocEntry } from '../pdfSectionRenderer';
import { PdfTheme } from '../theme';

/**
 * Reserves a page for the table of contents. Because entry page numbers
 * are only known after every other section has rendered, PdfReportGenerator
 * calls reserve() first, renders the rest of the report, then calls
 * fill() once all TocEntry values are known (pdfkit's bufferedPageRange +
 * doc.switchToPage lets us go back and draw on an already-created page).
 */
export class TableOfContentsSection {
  reserve(doc: PdfDocument): number {
    doc.addPage();
    return doc.bufferedPageRange().count;
  }

  fill(doc: PdfDocument, pageIndex: number, entries: TocEntry[]): void {
    doc.switchToPage(pageIndex - 1);

    doc.font(PdfTheme.fonts.heading).fontSize(PdfTheme.fontSize.sectionTitle).fillColor(PdfTheme.colors.heading);
    doc.text('Table of Contents', doc.page.margins.left, doc.page.margins.top);
    doc.moveDown(1.2);

    doc.font(PdfTheme.fonts.body).fontSize(PdfTheme.fontSize.body).fillColor(PdfTheme.colors.body);
    for (const entry of entries) {
      const y = doc.y;
      doc.text(entry.title, doc.page.margins.left, y, { continued: false });
      doc.text(String(entry.pageNumber), doc.page.width - doc.page.margins.right - 30, y, { width: 30, align: 'right' });
    }
  }
}
