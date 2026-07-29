import { PdfDocument } from '../pdfDocument';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';
import { PdfTheme } from '../theme';

export class ModelsSection implements IPdfSectionRenderer {
  readonly title = 'Models';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.models.length === 0) {
      renderPlaceholder(doc, 'No models detected.');
      return entry;
    }

    for (const model of data.models) {
      doc.font(PdfTheme.fonts.heading).fontSize(PdfTheme.fontSize.subsectionTitle).fillColor(PdfTheme.colors.heading);
      doc.text(model.name);
      doc.moveDown(0.3);

      renderSimpleTable(doc, {
        columnWidths: [140, 110, 70, 170],
        headers: ['Field', 'Type', 'Required', 'Relation'],
        rows: model.fields.map((f) => [
          f.name,
          f.fieldType,
          f.required ? 'Yes' : 'No',
          f.relation ? `${f.relation.kind} -> ${f.relation.targetModel}` : '—',
        ]),
      });
      doc.moveDown(0.8);
    }

    return entry;
  }
}
