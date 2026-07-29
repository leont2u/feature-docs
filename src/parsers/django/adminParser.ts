import { AdminRegistration } from '../../models/featureDocumentation';
import { directMemberIndent, findBlockEnd, toLogicalLines } from './pythonSource';

const CLASS_HEADER = /^class\s+(\w+)\s*\(([^)]*)\)\s*:/;
const LIST_DISPLAY_ATTR = /^list_display\s*=\s*[([]([\s\S]*)[)\]]/;
const REGISTER_CALL = /^[\w.]+\.register\(\s*([\w.]+)\s*,\s*([\w.]+)/;
const REGISTER_DECORATOR = /^@[\w.]+\.register\(\s*([\w.]+)\s*\)/;

/**
 * Parses a Django `admin.py` into (model, ModelAdmin, list_display)
 * registrations — via either `site.register(Model, ModelAdmin)` calls or
 * the `@admin.register(Model)` class decorator form.
 */
export class AdminParser {
  parse(fileContent: string, sourceFile: string): AdminRegistration[] {
    const lines = toLogicalLines(fileContent);
    const listDisplayByClass = new Map<string, string[]>();
    const registrations: AdminRegistration[] = [];

    for (let i = 0; i < lines.length; i++) {
      const headerMatch = CLASS_HEADER.exec(lines[i].text.trim());
      if (headerMatch) {
        const [, className] = headerMatch;
        const bodyEnd = findBlockEnd(lines, i + 1, lines[i].indent);
        const bodyIndent = directMemberIndent(lines, i + 1, bodyEnd);
        for (let j = i + 1; j < bodyEnd; j++) {
          if (lines[j].indent !== bodyIndent) {
            continue;
          }
          const listDisplayMatch = LIST_DISPLAY_ATTR.exec(lines[j].text.trim());
          if (listDisplayMatch) {
            listDisplayByClass.set(className, extractQuotedStrings(listDisplayMatch[1]));
            break;
          }
        }

        const decoratorText = i > 0 ? lines[i - 1].text.trim() : '';
        const registerDecorator = REGISTER_DECORATOR.exec(decoratorText);
        if (registerDecorator) {
          registrations.push({
            modelName: lastSegment(registerDecorator[1]),
            adminClassName: className,
            listDisplay: listDisplayByClass.get(className) ?? [],
            sourceFile,
          });
        }
        continue;
      }

      const registerMatch = REGISTER_CALL.exec(lines[i].text.trim());
      if (registerMatch) {
        const adminClassName = lastSegment(registerMatch[2]);
        registrations.push({
          modelName: lastSegment(registerMatch[1]),
          adminClassName,
          listDisplay: listDisplayByClass.get(adminClassName) ?? [],
          sourceFile,
        });
      }
    }

    return registrations;
  }
}

function extractQuotedStrings(text: string): string[] {
  return Array.from(text.matchAll(/["'](\w+)["']/g)).map((m) => m[1]);
}

function lastSegment(dotted: string): string {
  const parts = dotted.split('.');
  return parts[parts.length - 1];
}
