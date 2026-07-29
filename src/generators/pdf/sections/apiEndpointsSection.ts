import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';

export class ApiEndpointsSection implements IPdfSectionRenderer {
  readonly title = 'API Endpoints';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.endpoints.length === 0) {
      renderPlaceholder(doc, 'No endpoints detected.');
      return entry;
    }

    renderSimpleTable(doc, {
      columnWidths: [150, 90, 130, 120],
      headers: ['Path', 'Methods', 'Handler', 'Type'],
      rows: data.endpoints.map((e) => [e.path, e.methods.join(', '), e.handlerName, e.handlerType]),
    });

    return entry;
  }
}
