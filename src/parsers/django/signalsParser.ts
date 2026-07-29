import { SignalDefinition } from '../../models/featureDocumentation';
import { toLogicalLines } from './pythonSource';

const RECEIVER_DECORATOR = /^@receiver\(\s*([\w.]+)\s*,\s*sender\s*=\s*([\w.]+)/;
const DEF_HEADER = /^def\s+(\w+)\s*\(/;

/**
 * Parses a Django `signals.py` for `@receiver(signal, sender=Model)`-decorated
 * functions (the standard Django signal pattern). Does not resolve
 * signal.connect(...) style manual registration.
 */
export class SignalsParser {
  parse(fileContent: string, sourceFile: string): SignalDefinition[] {
    const lines = toLogicalLines(fileContent);
    const signals: SignalDefinition[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indent !== 0) {
        continue;
      }
      const defMatch = DEF_HEADER.exec(lines[i].text.trim());
      if (!defMatch) {
        continue;
      }
      const decoratorText = i > 0 ? lines[i - 1].text.trim() : '';
      const receiverMatch = RECEIVER_DECORATOR.exec(decoratorText);
      if (!receiverMatch) {
        continue;
      }

      signals.push({
        signalType: lastSegment(receiverMatch[1]),
        senderModel: lastSegment(receiverMatch[2]),
        receiverName: defMatch[1],
        sourceFile,
      });
    }

    return signals;
  }
}

function lastSegment(dotted: string): string {
  const parts = dotted.split('.');
  return parts[parts.length - 1];
}
