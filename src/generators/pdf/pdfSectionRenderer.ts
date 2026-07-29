import { PdfDocument } from './pdfDocument';
import { FeatureDocumentationData } from '../../models/featureDocumentation';

/** Entry recorded by a section so the table of contents can link to it. */
export interface TocEntry {
  title: string;
  pageNumber: number;
}

/**
 * Contract for a single report section (Feature Overview, API Endpoints,
 * Models, ERD, ...). Each section owns its own layout logic and reports
 * back a TOC entry, keeping PdfReportGenerator a thin orchestrator.
 */
export interface IPdfSectionRenderer {
  readonly title: string;

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry;
}
