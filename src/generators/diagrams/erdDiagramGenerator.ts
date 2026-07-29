import { ModelDefinition } from '../../models/featureDocumentation';
import { DiagramResult, IDiagramGenerator } from './diagramGenerator';

const BOX_WIDTH = 220;
const HEADER_HEIGHT = 26;
const FIELD_LINE_HEIGHT = 15;
const BOX_PADDING = 8;
const MAX_FIELDS_SHOWN = 8;
const COLUMN_GAP = 60;
const ROW_GAP = 50;
const MARGIN = 20;
const MAX_COLUMNS = 3;

const RELATION_COLORS: Record<string, string> = {
  ForeignKey: '#2563eb',
  OneToOne: '#059669',
  ManyToMany: '#d97706',
};

interface BoxLayout {
  model: ModelDefinition;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Renders an Entity Relationship Diagram as SVG from parsed Django models:
 * one box per model listing its fields, laid out in a grid, with connector
 * lines for ForeignKey/OneToOne/ManyToMany relationships between boxes.
 */
export class ErdDiagramGenerator implements IDiagramGenerator<ModelDefinition[]> {
  generate(models: ModelDefinition[]): DiagramResult {
    if (models.length === 0) {
      return { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>', suggestedFileName: 'erd.svg' };
    }

    const boxes = this.layoutBoxes(models);
    const boxesByName = new Map(boxes.map((box) => [box.model.name, box]));

    const width = Math.max(...boxes.map((box) => box.x + box.width)) + MARGIN;
    const height = Math.max(...boxes.map((box) => box.y + box.height)) + MARGIN;

    const connectors = this.renderConnectors(boxes, boxesByName);
    const entities = boxes.map((box) => this.renderBox(box)).join('\n');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${connectors}
        ${entities}
      </svg>
    `.trim();

    return { svg, suggestedFileName: 'erd.svg' };
  }

  private layoutBoxes(models: ModelDefinition[]): BoxLayout[] {
    const columns = Math.min(MAX_COLUMNS, models.length);
    const columnX = Array.from({ length: columns }, (_, col) => MARGIN + col * (BOX_WIDTH + COLUMN_GAP));
    const columnY = new Array(columns).fill(MARGIN);
    const boxes: BoxLayout[] = [];

    models.forEach((model, index) => {
      const col = index % columns;
      const shownFields = Math.min(model.fields.length, MAX_FIELDS_SHOWN);
      const overflow = model.fields.length > MAX_FIELDS_SHOWN ? 1 : 0;
      const height = HEADER_HEIGHT + (shownFields + overflow) * FIELD_LINE_HEIGHT + BOX_PADDING * 2;

      boxes.push({ model, x: columnX[col], y: columnY[col], width: BOX_WIDTH, height });
      columnY[col] += height + ROW_GAP;
    });

    return boxes;
  }

  private renderBox(box: BoxLayout): string {
    const { model, x, y, width, height } = box;
    const shownFields = model.fields.slice(0, MAX_FIELDS_SHOWN);
    const overflowCount = model.fields.length - shownFields.length;

    const fieldLines = shownFields
      .map((field, i) => {
        const fy = y + HEADER_HEIGHT + BOX_PADDING + (i + 1) * FIELD_LINE_HEIGHT - 4;
        const marker = field.isRelation ? '● ' : '';
        const label = escapeXml(`${marker}${field.name}: ${field.fieldType}`);
        return `<text x="${x + BOX_PADDING}" y="${fy}" font-family="Helvetica, Arial, sans-serif" font-size="10.5" fill="#1e293b">${label}</text>`;
      })
      .join('\n');

    const overflowLine =
      overflowCount > 0
        ? `<text x="${x + BOX_PADDING}" y="${
            y + HEADER_HEIGHT + BOX_PADDING + (shownFields.length + 1) * FIELD_LINE_HEIGHT - 4
          }" font-family="Helvetica, Arial, sans-serif" font-size="10.5" font-style="italic" fill="#64748b">+${overflowCount} more</text>`
        : '';

    return `
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
      <rect x="${x}" y="${y}" width="${width}" height="${HEADER_HEIGHT}" rx="6" fill="#1e293b" />
      <rect x="${x}" y="${y + HEADER_HEIGHT - 6}" width="${width}" height="6" fill="#1e293b" />
      <text x="${x + BOX_PADDING}" y="${y + HEADER_HEIGHT - 8}" font-family="Helvetica, Arial, sans-serif" font-size="12.5" font-weight="bold" fill="#f8fafc">${escapeXml(
        model.name
      )}</text>
      ${fieldLines}
      ${overflowLine}
    `;
  }

  private renderConnectors(boxes: BoxLayout[], boxesByName: Map<string, BoxLayout>): string {
    const lines: string[] = [];
    const colorFor = (kind: string): string => RELATION_COLORS[kind] ?? '#64748b';

    for (const box of boxes) {
      for (const field of box.model.fields) {
        if (!field.relation) {
          continue;
        }
        const target = boxesByName.get(field.relation.targetModel);
        if (!target || target === box) {
          continue;
        }

        const sourceCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
        const color = colorFor(field.relation.kind);
        const midX = (sourceCenter.x + targetCenter.x) / 2;
        const midY = (sourceCenter.y + targetCenter.y) / 2;

        lines.push(`
          <line x1="${sourceCenter.x}" y1="${sourceCenter.y}" x2="${targetCenter.x}" y2="${targetCenter.y}"
            stroke="${color}" stroke-width="1.25" stroke-dasharray="4,3" />
          <text x="${midX}" y="${midY}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
            font-size="9" fill="${color}">${escapeXml(field.relation.kind)}</text>
        `);
      }
    }

    return lines.join('\n');
  }
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
