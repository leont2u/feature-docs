import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';

export class SignalsSection implements IPdfSectionRenderer {
  readonly title = 'Signals';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.signals.length === 0) {
      renderPlaceholder(doc, 'No signal receivers detected.');
      return entry;
    }

    renderSimpleTable(doc, {
      columnWidths: [110, 130, 130, 110],
      headers: ['Signal Type', 'Sender Model', 'Receiver', 'Source'],
      rows: data.signals.map((s) => [s.signalType, s.senderModel ?? '—', s.receiverName, s.sourceFile]),
    });

    return entry;
  }
}
