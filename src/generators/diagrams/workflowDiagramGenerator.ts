import { WorkflowDefinition } from '../../models/featureDocumentation';
import { DiagramResult, IDiagramGenerator } from './diagramGenerator';

const STAGE_WIDTH = 170;
const STAGE_HEIGHT = 46;
const STAGE_GAP = 34;
const MARGIN = 20;

/**
 * Renders a model's business-status lifecycle (from its STATUS_CHOICES
 * order) as a linear top-to-bottom flow — the "user journey" a feature
 * actually implements, in place of the generic technical request pipeline.
 */
export class WorkflowDiagramGenerator implements IDiagramGenerator<WorkflowDefinition> {
  generate(workflow: WorkflowDefinition): DiagramResult {
    const states = workflow.states;
    const width = STAGE_WIDTH + MARGIN * 2;
    const height = states.length * (STAGE_HEIGHT + STAGE_GAP) - STAGE_GAP + MARGIN * 2;

    const boxes = states
      .map((state, index) => {
        const y = MARGIN + index * (STAGE_HEIGHT + STAGE_GAP);
        const arrow =
          index < states.length - 1
            ? `<line x1="${width / 2}" y1="${y + STAGE_HEIGHT}" x2="${width / 2}" y2="${
                y + STAGE_HEIGHT + STAGE_GAP
              }" stroke="#64748b" stroke-width="2" marker-end="url(#arrowhead)" />`
            : '';

        return `
          <rect x="${MARGIN}" y="${y}" width="${STAGE_WIDTH}" height="${STAGE_HEIGHT}" rx="8"
            fill="#1e293b" stroke="#3b82f6" stroke-width="1.5" />
          <text x="${width / 2}" y="${y + STAGE_HEIGHT / 2 + 5}" text-anchor="middle"
            font-family="Helvetica, Arial, sans-serif" font-size="14" fill="#f8fafc">${escapeXml(state.label)}</text>
          ${arrow}
        `;
      })
      .join('\n');

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

    return { svg, suggestedFileName: `workflow-${workflow.modelName.toLowerCase()}.svg` };
  }
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
