import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';

export class PermissionsSection implements IPdfSectionRenderer {
  readonly title = 'Permissions';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.permissions.length === 0) {
      renderPlaceholder(doc, 'No permission classes detected.');
      return entry;
    }

    renderSimpleTable(doc, {
      columnWidths: [180, 200, 110],
      headers: ['Permission Class', 'Applied To', 'Source'],
      rows: data.permissions.map((p) => [p.className, p.appliedTo.join(', '), p.sourceFile]),
    });

    return entry;
  }
}
