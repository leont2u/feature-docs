import { DiagramResult, IDiagramGenerator } from './diagramGenerator';

const FLOW_STAGES = ['Client', 'URL', 'View', 'Serializer', 'Service', 'Model', 'Database', 'Response'] as const;

const STAGE_WIDTH = 160;
const STAGE_HEIGHT = 50;
const STAGE_GAP = 40;
const MARGIN = 20;

/**
 * Renders the static Client -> URL -> View -> Serializer -> Service ->
 * Model -> Database -> Response request flow as an SVG diagram. This
 * diagram's shape never varies per feature, so it is fully implemented
 * (unlike the ERD generator, which depends on parsed model data).
 */
export class RequestFlowDiagramGenerator implements IDiagramGenerator<void> {
  generate(): DiagramResult {
    const width = STAGE_WIDTH + MARGIN * 2;
    const height = FLOW_STAGES.length * (STAGE_HEIGHT + STAGE_GAP) - STAGE_GAP + MARGIN * 2;

    const boxes = FLOW_STAGES.map((label, index) => {
      const y = MARGIN + index * (STAGE_HEIGHT + STAGE_GAP);
      const arrow =
        index < FLOW_STAGES.length - 1
          ? `<line x1="${width / 2}" y1="${y + STAGE_HEIGHT}" x2="${width / 2}" y2="${
              y + STAGE_HEIGHT + STAGE_GAP
            }" stroke="#64748b" stroke-width="2" marker-end="url(#arrowhead)" />`
          : '';

      return `
        <rect x="${MARGIN}" y="${y}" width="${STAGE_WIDTH}" height="${STAGE_HEIGHT}" rx="8"
          fill="#1e293b" stroke="#3b82f6" stroke-width="1.5" />
        <text x="${width / 2}" y="${y + STAGE_HEIGHT / 2 + 5}" text-anchor="middle"
          font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#f8fafc">${label}</text>
        ${arrow}
      `;
    }).join('\n');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#64748b" />
          </marker>
        </defs>
        ${boxes}
      </svg>
    `.trim();

    return { svg, suggestedFileName: 'request-flow.svg' };
  }
}
