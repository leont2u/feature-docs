import { PdfDocument } from '../pdfDocument';
import { EndpointDefinition, FeatureDocumentationData, ModelField } from '../../../models/featureDocumentation';
import { IPdfSectionRenderer, TocEntry } from '../pdfSectionRenderer';
import { beginSection, renderPlaceholder } from '../sectionHelpers';
import { renderSimpleTable } from '../simpleTable';
import { PdfTheme } from '../theme';

interface PayloadField {
  name: string;
  type: string;
}

/**
 * Renders each endpoint as a self-contained block (path + methods, handler,
 * and its request/response payload shape) rather than one flat table —
 * closer to how real API docs (Swagger, Postman collections) present a
 * single endpoint. The payload is resolved by following
 * endpoint.serializerName into data.serializers, then falling back to the
 * serializer's linked model's fields when the serializer itself declares
 * none (e.g. `Meta.fields = "__all__"`).
 */
export class ApiEndpointsSection implements IPdfSectionRenderer {
  readonly title = 'API Endpoints';

  render(doc: PdfDocument, data: FeatureDocumentationData): TocEntry {
    const entry = beginSection(doc, this.title);

    if (data.endpoints.length === 0) {
      renderPlaceholder(doc, 'No endpoints detected.');
      return entry;
    }

    data.endpoints.forEach((endpoint, index) => {
      if (index > 0) {
        doc.moveDown(1);
      }
      this.renderEndpoint(doc, endpoint, data);
    });

    return entry;
  }

  private renderEndpoint(doc: PdfDocument, endpoint: EndpointDefinition, data: FeatureDocumentationData): void {
    const methodLabel = endpoint.methods.length ? endpoint.methods.join(', ') : 'Unknown';

    doc
      .font(PdfTheme.fonts.heading)
      .fontSize(PdfTheme.fontSize.subsectionTitle)
      .fillColor(PdfTheme.colors.heading)
      .text(`${methodLabel}  ${endpoint.path}`);

    doc
      .font(PdfTheme.fonts.body)
      .fontSize(PdfTheme.fontSize.small)
      .fillColor(PdfTheme.colors.muted)
      .text(`Handler: ${endpoint.handlerName} (${endpoint.handlerType})`);

    doc.moveDown(0.3);

    const fields = this.resolvePayloadFields(endpoint, data);
    if (fields.length === 0) {
      doc
        .font(PdfTheme.fonts.body)
        .fontSize(PdfTheme.fontSize.small)
        .fillColor(PdfTheme.colors.muted)
        .text('No payload fields resolved (no linked serializer, or fields declared dynamically).');
      return;
    }

    doc
      .font(PdfTheme.fonts.heading)
      .fontSize(PdfTheme.fontSize.small)
      .fillColor(PdfTheme.colors.body)
      .text('Request / Response Payload:');
    doc.moveDown(0.15);

    renderSimpleTable(doc, {
      columnWidths: [220, 200],
      headers: ['Field', 'Type'],
      rows: fields.map((f) => [f.name, f.type]),
    });
  }

  private resolvePayloadFields(endpoint: EndpointDefinition, data: FeatureDocumentationData): PayloadField[] {
    if (!endpoint.serializerName) {
      return [];
    }
    const serializer = data.serializers.find((s) => s.name === endpoint.serializerName);
    if (!serializer) {
      return [];
    }

    const model = serializer.modelName ? data.models.find((m) => m.name === serializer.modelName) : undefined;
    const modelFieldsByName = new Map<string, ModelField>((model?.fields ?? []).map((f) => [f.name, f]));

    const fieldNames = serializer.fields.length > 0 ? serializer.fields : Array.from(modelFieldsByName.keys());

    return fieldNames.map((name) => ({
      name,
      type: modelFieldsByName.get(name)?.fieldType ?? '—',
    }));
  }
}
