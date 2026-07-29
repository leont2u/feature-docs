import { PdfDocument } from './pdfDocument';
import { PdfTheme } from './theme';
import { TocEntry } from './pdfSectionRenderer';

/** Starts a new page, draws the section heading, and returns its TOC entry. */
export function beginSection(doc: PdfDocument, title: string): TocEntry {
  doc.addPage();
  const pageNumber = doc.bufferedPageRange().count;

  doc
    .font(PdfTheme.fonts.heading)
    .fontSize(PdfTheme.fontSize.sectionTitle)
    .fillColor(PdfTheme.colors.heading)
    .text(title);

  doc
    .moveTo(doc.page.margins.left, doc.y + 4)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
    .strokeColor(PdfTheme.colors.border)
    .lineWidth(1)
    .stroke();

  doc.moveDown(1.2);
  doc.font(PdfTheme.fonts.body).fontSize(PdfTheme.fontSize.body).fillColor(PdfTheme.colors.body);

  return { title, pageNumber };
}

/** Renders a muted placeholder line for sections whose data extraction isn't implemented yet. */
export function renderPlaceholder(doc: PdfDocument, message: string): void {
  doc
    .font(PdfTheme.fonts.body)
    .fontSize(PdfTheme.fontSize.body)
    .fillColor(PdfTheme.colors.muted)
    .text(message);
}
