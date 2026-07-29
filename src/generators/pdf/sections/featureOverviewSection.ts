import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';

export class FeatureOverviewSection implements IPdfSectionRenderer {
  readonly title = 'Feature Overview';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);
    const purpose = data.metadata.purpose ?? 'Purpose not detected from source comments/docstrings.';
    doc.text(`Feature: ${data.metadata.featureName}`);
    doc.text(`Project: ${data.metadata.projectName}`);
    doc.moveDown();
    renderPlaceholder(doc, purpose);
    return entry;
  }
}
