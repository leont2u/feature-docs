import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection } from '../sectionHelpers';
import { PdfTheme } from '../theme';

export class FileStructureSection implements IPdfSectionRenderer {
  readonly title = 'File Structure';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    for (const file of data.fileInventory) {
      doc
        .fillColor(file.present ? PdfTheme.colors.body : PdfTheme.colors.muted)
        .text(`${file.present ? '✓' : '—'}  ${file.fileName}`);
    }

    return entry;
  }
}
