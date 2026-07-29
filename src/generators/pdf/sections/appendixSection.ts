import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';

export class AppendixSection implements IPdfSectionRenderer {
  readonly title = 'Appendix';

  render(doc: PdfDocument, _data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);
    renderPlaceholder(doc, 'Reserved for supplementary notes (admin registrations, test coverage summaries, etc.).');
    return entry;
  }
}
