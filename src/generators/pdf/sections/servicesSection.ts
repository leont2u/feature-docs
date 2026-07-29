import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';

export class ServicesSection implements IPdfSectionRenderer {
  readonly title = 'Services';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.services.length === 0) {
      renderPlaceholder(doc, 'No services detected.');
      return entry;
    }

    renderSimpleTable(doc, {
      columnWidths: [180, 200, 110],
      headers: ['Service', 'Description', 'Source'],
      rows: data.services.map((s) => [s.name, s.description ?? '—', s.sourceFile]),
    });

    return entry;
  }
}
