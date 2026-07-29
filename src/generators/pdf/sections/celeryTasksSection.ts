import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';

export class CeleryTasksSection implements IPdfSectionRenderer {
  readonly title = 'Celery Tasks';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.celeryTasks.length === 0) {
      renderPlaceholder(doc, 'No Celery tasks detected.');
      return entry;
    }

    renderSimpleTable(doc, {
      columnWidths: [220, 110, 130],
      headers: ['Task', 'Periodic', 'Source'],
      rows: data.celeryTasks.map((t) => [t.name, t.isPeriodic ? 'Yes' : 'No', t.sourceFile]),
    });

    return entry;
  }
}
