import { FeatureDocumentationData } from '../models/featureDocumentation';

export interface GeneratedReport {
  /** Absolute path to the generated PDF file. */
  pdfPath: string;
  /** Absolute paths to any diagram assets exported alongside the PDF. */
  diagramPaths: string[];
}

/**
 * Contract for turning FeatureDocumentationData into an output document.
 * Only one implementation exists today (PdfReportGenerator), but this
 * indirection lets future output formats (e.g. HTML, Markdown) plug in
 * without touching command or parser code.
 */
export interface IDocumentGenerator {
  generate(data: FeatureDocumentationData, outputDirectory: string): Promise<GeneratedReport>;
}
