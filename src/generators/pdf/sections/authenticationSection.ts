import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';

export class AuthenticationSection implements IPdfSectionRenderer {
  readonly title = 'Authentication';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.authentication.length === 0) {
      renderPlaceholder(doc, 'No authentication classes detected.');
      return entry;
    }

    renderSimpleTable(doc, {
      columnWidths: [180, 200, 110],
      headers: ['Authentication Class', 'Applied To', 'Source'],
      rows: data.authentication.map((a) => [a.className, a.appliedTo.join(', '), a.sourceFile]),
    });

    return entry;
  }
}
