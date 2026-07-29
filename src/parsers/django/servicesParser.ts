import { ServiceDefinition } from '../../models/featureDocumentation';
import { LogicalLine, toLogicalLines } from './pythonSource';

const DEF_HEADER = /^def\s+(\w+)\s*\(/;
const CLASS_HEADER = /^class\s+(\w+)\b/;

/**
 * Parses a Django `services.py` (business-logic layer, by convention a
 * plain module of top-level functions and helper classes/exceptions, not
 * tied to any Django base class) into ServiceDefinitions: every top-level
 * function or class whose name doesn't start with `_` (leading-underscore
 * names are treated as private implementation details, not the service's
 * public surface), with its docstring's first line as a description.
 */
export class ServicesParser {
  parse(fileContent: string, sourceFile: string): ServiceDefinition[] {
    const lines = toLogicalLines(fileContent);
    const services: ServiceDefinition[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indent !== 0) {
        continue;
      }
      const text = lines[i].text.trim();
      const defMatch = DEF_HEADER.exec(text);
      const classMatch = !defMatch ? CLASS_HEADER.exec(text) : null;
      const name = defMatch?.[1] ?? classMatch?.[1];
      if (!name || name.startsWith('_')) {
        continue;
      }

      services.push({ name, sourceFile, description: firstDocstringLine(lines, i) });
    }

    return services;
  }
}

function firstDocstringLine(lines: LogicalLine[], headerIndex: number): string | undefined {
  const next = lines[headerIndex + 1];
  if (!next) {
    return undefined;
  }
  const trimmed = next.text.trim();
  const quoteMatch = /^("""|''')([\s\S]*)$/.exec(trimmed);
  if (!quoteMatch) {
    return undefined;
  }
  const [, quote, rest] = quoteMatch;
  const closingIndex = rest.indexOf(quote);
  const body = closingIndex === -1 ? rest : rest.slice(0, closingIndex);
  const firstLine = body.split('\n')[0].trim();
  return firstLine || undefined;
}
