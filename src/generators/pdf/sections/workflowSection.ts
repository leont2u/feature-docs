import { PdfDocument } from '../pdfDocument';
import SVGtoPDF from 'svg-to-pdfkit';
import { FeatureDocumentationData } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { PdfTheme } from '../theme';
import { WorkflowDiagramGenerator } from '../../diagrams/workflowDiagramGenerator';

/**
 * Renders one status-lifecycle diagram per model that has a STATUS_CHOICES-style
 * field — the business workflow a user actually experiences, rather than the
 * generic technical Client->URL->View->...->Response request pipeline.
 */
export class WorkflowSection implements IPdfSectionRenderer {
  readonly title = 'Workflow';

  private readonly diagramGenerator = new WorkflowDiagramGenerator();
  readonly exportedDiagramPaths: string[] = [];

  constructor(private readonly diagramOutputWriter: (fileName: string, svg: string) => string) {}

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.workflows.length === 0) {
      renderPlaceholder(
        doc,
        'No STATUS_CHOICES-style lifecycle detected on any model — nothing to diagram here.'
      );
      return entry;
    }

    data.workflows.forEach((workflow, index) => {
      if (index > 0) {
        doc.addPage();
      }
      doc
        .font(PdfTheme.fonts.heading)
        .fontSize(PdfTheme.fontSize.subsectionTitle)
        .fillColor(PdfTheme.colors.heading)
        .text(workflow.modelName);
      doc.moveDown(0.5);

      const diagram = this.diagramGenerator.generate(workflow);
      const savedPath = this.diagramOutputWriter(diagram.suggestedFileName, diagram.svg);
      this.exportedDiagramPaths.push(savedPath);

      SVGtoPDF(doc, diagram.svg, doc.page.margins.left, doc.y, { width: 220 });
    });

    return entry;
  }
}
