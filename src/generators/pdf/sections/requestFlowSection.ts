import { PdfDocument } from '../pdfDocument';
import SVGtoPDF from 'svg-to-pdfkit';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection } from '../sectionHelpers';
import { RequestFlowDiagramGenerator } from '../../diagrams/requestFlowDiagramGenerator';

/** Renders the static request-flow diagram and records its exported path for the caller. */
export class RequestFlowSection implements IPdfSectionRenderer {
  readonly title = 'Request Flow Diagram';

  private readonly diagramGenerator = new RequestFlowDiagramGenerator();
  readonly exportedDiagramPaths: string[] = [];

  constructor(private readonly diagramOutputWriter: (fileName: string, svg: string) => string) {}

  render(doc: PdfDocument, _data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    const diagram = this.diagramGenerator.generate();
    const savedPath = this.diagramOutputWriter(diagram.suggestedFileName, diagram.svg);
    this.exportedDiagramPaths.push(savedPath);

    SVGtoPDF(doc, diagram.svg, doc.page.margins.left, doc.y, { width: 240 });

    return entry;
  }
}
