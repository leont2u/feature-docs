import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';

export class DependenciesSection implements IPdfSectionRenderer {
  readonly title = 'Dependencies';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.dependencies.length === 0) {
      renderPlaceholder(doc, 'No imports detected.');
      return entry;
    }

    renderSimpleTable(doc, {
      columnWidths: [160, 60, 130, 110],
      headers: ['Module', 'External', 'Imported', 'Source'],
      rows: data.dependencies.map((d) => [d.module, d.isExternal ? 'Yes' : 'No', d.imported.join(', '), d.sourceFile]),
    });

    return entry;
  }
}
