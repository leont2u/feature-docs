import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { FeatureDocumentationData } from '../../models/featureDocumentation';
import { GeneratedReport, IDocumentGenerator } from '../documentGenerator';
import { PdfTheme } from './theme';
import { IPdfSectionRenderer, TocEntry } from './pdfSectionRenderer';
import { CoverPageSection } from './sections/coverPageSection';
import { TableOfContentsSection } from './sections/tableOfContentsSection';
import { FeatureOverviewSection } from './sections/featureOverviewSection';
import { FileStructureSection } from './sections/fileStructureSection';
import { ApiEndpointsSection } from './sections/apiEndpointsSection';
import { ModelsSection } from './sections/modelsSection';
import { ErdSection } from './sections/erdSection';
import { RequestFlowSection } from './sections/requestFlowSection';
import { PermissionsSection } from './sections/permissionsSection';
import { AuthenticationSection } from './sections/authenticationSection';
import { ServicesSection } from './sections/servicesSection';
import { SignalsSection } from './sections/signalsSection';
import { CeleryTasksSection } from './sections/celeryTasksSection';
import { DependenciesSection } from './sections/dependenciesSection';
import { AppendixSection } from './sections/appendixSection';

/**
 * Assembles the full PDF report: cover page, table of contents, the 12
 * content sections, and page numbering. Diagrams are exported as sibling
 * .svg files in outputDirectory in addition to being embedded in the PDF.
 */
export class PdfReportGenerator implements IDocumentGenerator {
  async generate(data: FeatureDocumentationData, outputDirectory: string): Promise<GeneratedReport> {
    fs.mkdirSync(outputDirectory, { recursive: true });

    const doc = new PDFDocument({
      size: PdfTheme.page.size,
      margin: PdfTheme.page.margin,
      bufferPages: true,
    });

    const pdfPath = path.join(outputDirectory, `${data.metadata.featureName}-documentation.pdf`);
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    const diagramPaths: string[] = [];
    const writeDiagram = (fileName: string, svg: string): string => {
      const diagramPath = path.join(outputDirectory, fileName);
      fs.writeFileSync(diagramPath, svg, 'utf-8');
      return diagramPath;
    };

    new CoverPageSection().render(doc, data);

    const toc = new TableOfContentsSection();
    const tocPageIndex = toc.reserve(doc);

    const erdSection = new ErdSection(writeDiagram);
    const requestFlowSection = new RequestFlowSection(writeDiagram);

    const sections: IPdfSectionRenderer[] = [
      new FeatureOverviewSection(),
      new FileStructureSection(),
      new ApiEndpointsSection(),
      new ModelsSection(),
      erdSection,
      requestFlowSection,
      new PermissionsSection(),
      new AuthenticationSection(),
      new ServicesSection(),
      new SignalsSection(),
      new CeleryTasksSection(),
      new DependenciesSection(),
      new AppendixSection(),
    ];

    const tocEntries: TocEntry[] = sections.map((section) => section.render(doc, data));
    diagramPaths.push(...erdSection.exportedDiagramPaths, ...requestFlowSection.exportedDiagramPaths);

    toc.fill(doc, tocPageIndex, tocEntries);
    this.paginate(doc);

    doc.end();
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    return { pdfPath, diagramPaths };
  }

  /** Stamps "Page X of N" on every page except the cover. */
  private paginate(doc: PDFKit.PDFDocument): void {
    const range = doc.bufferedPageRange();
    for (let i = range.start + 1; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .font(PdfTheme.fonts.body)
        .fontSize(PdfTheme.fontSize.small)
        .fillColor(PdfTheme.colors.muted)
        .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - doc.page.margins.bottom + 10, {
          align: 'center',
          width: doc.page.width,
        });
    }
  }
}
