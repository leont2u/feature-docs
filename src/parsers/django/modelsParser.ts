import { FieldRelationKind, ModelDefinition, ModelField, ModelRelation, WorkflowState } from '../../models/featureDocumentation';
import { directMemberIndent, findBlockEnd, LogicalLine, toLogicalLines } from './pythonSource';

const RELATION_FIELD_TYPES: Partial<Record<string, FieldRelationKind>> = {
  ForeignKey: 'ForeignKey',
  OneToOneField: 'OneToOne',
  ManyToManyField: 'ManyToMany',
};

const CLASS_HEADER = /^class\s+(\w+)\s*\(([^)]*)\)\s*:/;
const FIELD_ASSIGNMENT = /^(\w+)\s*=\s*models\.(\w+)\(([\s\S]*)\)\s*$/;
const META_CLASS_HEADER = /^class\s+Meta\s*:/;
const META_OPTION = /^(\w+)\s*=\s*([\s\S]+)$/;
const CHOICES_ASSIGNMENT = /^(\w+)\s*=\s*[([]([\s\S]*)[)\]]\s*$/;
const CHOICE_PAIR = /["']([\w-]+)["']\s*,\s*_?\(?\s*["']([^"']*)["']/g;

/**
 * Parses a Django `models.py` into model definitions, including fields and
 * relationships (ForeignKey, OneToOneField, ManyToManyField). Recognizes
 * any class whose base list includes `Model` or `*.Model` (so subclasses
 * that also mix in custom base classes, e.g. `class X(SomeMixin, models.Model)`,
 * are still picked up), and ignores plain mixins that don't inherit from Model.
 */
export class ModelsParser {
  parse(fileContent: string, sourceFile: string): ModelDefinition[] {
    const lines = toLogicalLines(fileContent);
    const models: ModelDefinition[] = [];

    for (let i = 0; i < lines.length; i++) {
      const headerMatch = CLASS_HEADER.exec(lines[i].text.trim());
      if (!headerMatch) {
        continue;
      }

      const [, className, basesRaw] = headerMatch;
      const baseClasses = basesRaw
        .split(',')
        .map((base) => base.trim())
        .filter(Boolean);

      if (!baseClasses.some((base) => base === 'Model' || base.endsWith('.Model'))) {
        continue;
      }

      const bodyEnd = findBlockEnd(lines, i + 1, lines[i].indent);
      models.push({
        name: className,
        sourceFile,
        baseClasses,
        fields: this.extractFields(lines, i + 1, bodyEnd),
        metaOptions: this.extractMetaOptions(lines, i + 1, bodyEnd),
        statusChoices: this.extractStatusChoices(lines, i + 1, bodyEnd),
      });
    }

    return models;
  }

  private extractFields(lines: LogicalLine[], start: number, end: number): ModelField[] {
    const bodyIndent = directMemberIndent(lines, start, end);
    const fields: ModelField[] = [];

    for (let j = start; j < end; j++) {
      if (lines[j].indent !== bodyIndent) {
        continue;
      }
      const text = lines[j].text.trim();
      const fieldMatch = FIELD_ASSIGNMENT.exec(text);
      if (!fieldMatch) {
        continue;
      }

      const [, fieldName, fieldType, argsText] = fieldMatch;
      const relationKind = RELATION_FIELD_TYPES[fieldType];
      const required = !/(null\s*=\s*True|blank\s*=\s*True|default\s*=)/.test(argsText);

      const field: ModelField = {
        name: fieldName,
        fieldType,
        required,
        isRelation: Boolean(relationKind),
      };
      if (relationKind) {
        field.relation = this.extractRelation(relationKind, argsText);
      }
      fields.push(field);
    }

    return fields;
  }

  private extractRelation(kind: FieldRelationKind, argsText: string): ModelRelation {
    const firstArg = argsText.split(',')[0]?.trim() ?? '';
    const quoted = /^["']([\w.]+)["']$/.exec(firstArg);
    const bare = /^(\w+)$/.exec(firstArg);
    const toKwarg = /\bto\s*=\s*["']?([\w.]+)["']?/.exec(argsText);
    const rawTarget = quoted?.[1] ?? bare?.[1] ?? toKwarg?.[1] ?? 'Unknown';

    const relatedNameMatch = /related_name\s*=\s*["']([\w]+)["']/.exec(argsText);
    const onDeleteMatch = /on_delete\s*=\s*models\.(\w+)/.exec(argsText);

    return {
      kind,
      targetModel: rawTarget.includes('.') ? rawTarget.split('.').pop()! : rawTarget,
      relatedName: relatedNameMatch?.[1],
      onDelete: onDeleteMatch?.[1],
    };
  }

  private extractMetaOptions(lines: LogicalLine[], start: number, end: number): Record<string, string> | undefined {
    let metaIndex = -1;
    for (let j = start; j < end; j++) {
      if (META_CLASS_HEADER.test(lines[j].text.trim())) {
        metaIndex = j;
        break;
      }
    }
    if (metaIndex === -1) {
      return undefined;
    }

    const metaBodyEnd = findBlockEnd(lines, metaIndex + 1, lines[metaIndex].indent);
    const metaBodyIndent = directMemberIndent(lines, metaIndex + 1, metaBodyEnd);
    const options: Record<string, string> = {};

    for (let j = metaIndex + 1; j < metaBodyEnd; j++) {
      if (lines[j].indent !== metaBodyIndent) {
        continue;
      }
      const match = META_OPTION.exec(lines[j].text.trim());
      if (match) {
        options[match[1]] = match[2].trim();
      }
    }

    return Object.keys(options).length ? options : undefined;
  }

  /**
   * Finds a `*_CHOICES` tuple whose name mentions "status" (e.g. `STATUS_CHOICES`)
   * and returns its (value, label) pairs in declared order. Django convention
   * routinely lists these in lifecycle order (draft -> submitted -> ... ->
   * processed), which is what makes this a usable stand-in for a business
   * workflow diagram without any NLP/AI involved.
   */
  private extractStatusChoices(lines: LogicalLine[], start: number, end: number): WorkflowState[] | undefined {
    const bodyIndent = directMemberIndent(lines, start, end);

    for (let j = start; j < end; j++) {
      if (lines[j].indent !== bodyIndent) {
        continue;
      }
      const text = lines[j].text.trim();
      const match = CHOICES_ASSIGNMENT.exec(text);
      if (!match || !match[1].toUpperCase().includes('STATUS')) {
        continue;
      }

      const states: WorkflowState[] = [];
      CHOICE_PAIR.lastIndex = 0;
      let pair: RegExpExecArray | null;
      while ((pair = CHOICE_PAIR.exec(match[2])) !== null) {
        states.push({ value: pair[1], label: pair[2] });
      }
      if (states.length > 0) {
        return states;
      }
    }

    return undefined;
  }
}
