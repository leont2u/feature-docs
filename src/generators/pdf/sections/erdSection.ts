import { PdfDocument } from '../pdfDocument';
import SVGtoPDF from 'svg-to-pdfkit';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { ErdDiagramGenerator } from '../../diagrams/erdDiagramGenerator';

/** Renders the ERD section and records the exported diagram path for the caller. */
export class ErdSection implements IPdfSectionRenderer {
  readonly title = 'Entity Relationship Diagram (ERD)';

  private readonly diagramGenerator = new ErdDiagramGenerator();
  readonly exportedDiagramPaths: string[] = [];

  constructor(private readonly diagramOutputWriter: (fileName: string, svg: string) => string) {}

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.models.length === 0) {
      renderPlaceholder(doc, 'No models available to diagram.');
      return entry;
    }

    const diagram = this.diagramGenerator.generate(data.models);
    const savedPath = this.diagramOutputWriter(diagram.suggestedFileName, diagram.svg);
    this.exportedDiagramPaths.push(savedPath);

    SVGtoPDF(doc, diagram.svg, doc.page.margins.left, doc.y, { width: doc.page.width - doc.page.margins.left * 2 });

    return entry;
  }
}
