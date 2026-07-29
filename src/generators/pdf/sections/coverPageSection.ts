import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { PdfTheme } from '../theme';

/** Renders the cover page. Not part of the TOC, so it does not implement IPdfSectionRenderer. */
export class CoverPageSection {
  render(doc: PdfDocument, data: FeatureDocumentationData): void {
    const { metadata } = data;

    doc.rect(0, 0, doc.page.width, doc.page.height).fill(PdfTheme.colors.heading);

    doc
      .fillColor('#f8fafc')
      .font(PdfTheme.fonts.heading)
      .fontSize(PdfTheme.fontSize.coverTitle)
      .text(metadata.featureName, doc.page.margins.left, doc.page.height / 2 - 80, {
        width: doc.page.width - doc.page.margins.left * 2,
      });

    doc
      .font(PdfTheme.fonts.body)
      .fontSize(PdfTheme.fontSize.coverSubtitle)
      .fillColor('#cbd5e1')
      .text('Feature Documentation', { width: doc.page.width - doc.page.margins.left * 2 });

    doc.moveDown(2);
    doc.fontSize(PdfTheme.fontSize.body);
    doc.text(`Project: ${metadata.projectName}`);
    doc.text(`Generated: ${metadata.generatedAt.toDateString()}`);
  }
}
