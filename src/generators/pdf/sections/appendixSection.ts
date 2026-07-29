import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';
import { PdfTheme } from '../theme';

export class AppendixSection implements IPdfSectionRenderer {
  readonly title = 'Appendix';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    doc.font(PdfTheme.fonts.heading).fontSize(PdfTheme.fontSize.subsectionTitle).fillColor(PdfTheme.colors.heading);
    doc.text('Admin Registrations');
    doc.moveDown(0.3);

    if (data.adminRegistrations.length === 0) {
      renderPlaceholder(doc, 'No admin.py registrations detected.');
    } else {
      renderSimpleTable(doc, {
        columnWidths: [140, 160, 200],
        headers: ['Model', 'Admin Class', 'List Display'],
        rows: data.adminRegistrations.map((r) => [r.modelName, r.adminClassName, r.listDisplay.join(', ') || '—']),
      });
    }

    doc.moveDown(1);
    doc.font(PdfTheme.fonts.heading).fontSize(PdfTheme.fontSize.subsectionTitle).fillColor(PdfTheme.colors.heading);
    doc.text('Test Coverage');
    doc.moveDown(0.3);

    if (!data.testSummary || data.testSummary.testClassCount === 0) {
      renderPlaceholder(doc, 'No tests.py test cases detected.');
    } else {
      doc
        .font(PdfTheme.fonts.body)
        .fontSize(PdfTheme.fontSize.body)
        .fillColor(PdfTheme.colors.body)
        .text(
          `${data.testSummary.testClassCount} test case class(es), ${data.testSummary.testFunctionCount} test method(s) detected in ${data.testSummary.sourceFile}.`
        );
    }

    return entry;
  }
}
