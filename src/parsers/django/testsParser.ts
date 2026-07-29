import { TestSummary } from '../../models/featureDocumentation';
import { findBlockEnd, toLogicalLines } from './pythonSource';

const CLASS_HEADER = /^class\s+(\w+)\s*\(([^)]*)\)\s*:/;
const TEST_DEF = /^def\s+(test_\w+)\s*\(/;

/**
 * Parses a Django `tests.py` into a lightweight summary (test case classes
 * and test methods found), rather than full per-test detail — the report's
 * Appendix just needs a coverage indicator, not a full test catalogue.
 */
export class TestsParser {
  parse(fileContent: string, sourceFile: string): TestSummary {
    const lines = toLogicalLines(fileContent);
    let testClassCount = 0;
    let testFunctionCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const headerMatch = CLASS_HEADER.exec(lines[i].text.trim());
      if (!headerMatch) {
        continue;
      }
      const [, , basesRaw] = headerMatch;
      const baseClasses = basesRaw
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      if (!baseClasses.some((b) => b.endsWith('TestCase'))) {
        continue;
      }
      testClassCount++;

      const bodyEnd = findBlockEnd(lines, i + 1, lines[i].indent);
      for (let j = i + 1; j < bodyEnd; j++) {
        if (TEST_DEF.test(lines[j].text.trim())) {
          testFunctionCount++;
        }
      }
    }

    return { testClassCount, testFunctionCount, sourceFile };
  }
}
