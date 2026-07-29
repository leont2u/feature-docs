export interface DiagramResult {
  /** Raw SVG markup, embeddable directly into the PDF via svg-to-pdfkit. */
  svg: string;
  /** Suggested file name if the diagram is also exported to disk. */
  suggestedFileName: string;
}

/**
 * Contract for a component that renders a specific diagram type
 * (ERD, request flow, ...) to SVG from static-analysis data.
 */
export interface IDiagramGenerator<TInput> {
  generate(input: TInput): DiagramResult;
}
