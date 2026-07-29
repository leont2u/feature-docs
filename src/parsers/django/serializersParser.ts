import { SerializerDefinition } from '../../models/featureDocumentation';
import { directMemberIndent, findBlockEnd, toLogicalLines } from './pythonSource';

const CLASS_HEADER = /^class\s+(\w+)\s*\(([^)]*)\)\s*:/;
const META_CLASS_HEADER = /^class\s+Meta\s*:/;
const FIELD_ASSIGNMENT = /^(\w+)\s*=\s*serializers\.\w+\(/;
const META_MODEL = /^model\s*=\s*(\w+)/;
const META_FIELDS_ALL = /^fields\s*=\s*["']__all__["']/;
const META_FIELDS_LIST = /^fields\s*=\s*\[([\s\S]*)\]/;

/**
 * Parses a Django `serializers.py` into serializer class definitions:
 * explicitly declared `serializers.XField(...)` attributes, plus
 * `Meta.model`/`Meta.fields`. When `Meta.fields = "__all__"` (or no
 * explicit fields are declared at all), `fields` is left empty and the
 * consumer is expected to fall back to the linked model's own field list.
 */
export class SerializersParser {
  parse(fileContent: string, sourceFile: string): SerializerDefinition[] {
    const lines = toLogicalLines(fileContent);
    const serializers: SerializerDefinition[] = [];

    for (let i = 0; i < lines.length; i++) {
      const headerMatch = CLASS_HEADER.exec(lines[i].text.trim());
      if (!headerMatch) {
        continue;
      }

      const [, className, basesRaw] = headerMatch;
      const baseClasses = basesRaw
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      if (!baseClasses.some((b) => b.endsWith('Serializer'))) {
        continue;
      }

      const bodyEnd = findBlockEnd(lines, i + 1, lines[i].indent);
      const bodyIndent = directMemberIndent(lines, i + 1, bodyEnd);
      const explicitFields: string[] = [];
      let modelName: string | undefined;
      let metaFields: string[] | undefined;

      for (let j = i + 1; j < bodyEnd; j++) {
        if (lines[j].indent !== bodyIndent) {
          continue;
        }
        const text = lines[j].text.trim();

        const fieldMatch = FIELD_ASSIGNMENT.exec(text);
        if (fieldMatch) {
          explicitFields.push(fieldMatch[1]);
          continue;
        }

        if (META_CLASS_HEADER.test(text)) {
          const metaEnd = findBlockEnd(lines, j + 1, lines[j].indent);
          const metaIndent = directMemberIndent(lines, j + 1, metaEnd);
          for (let k = j + 1; k < metaEnd; k++) {
            if (lines[k].indent !== metaIndent) {
              continue;
            }
            const metaText = lines[k].text.trim();
            const modelMatch = META_MODEL.exec(metaText);
            if (modelMatch) {
              modelName = modelMatch[1];
              continue;
            }
            if (META_FIELDS_ALL.test(metaText)) {
              continue;
            }
            const fieldsListMatch = META_FIELDS_LIST.exec(metaText);
            if (fieldsListMatch) {
              metaFields = Array.from(fieldsListMatch[1].matchAll(/["'](\w+)["']/g)).map((m) => m[1]);
            }
          }
        }
      }

      serializers.push({
        name: className,
        sourceFile,
        modelName,
        fields: metaFields ?? explicitFields,
        baseClasses,
      });
    }

    return serializers;
  }
}
