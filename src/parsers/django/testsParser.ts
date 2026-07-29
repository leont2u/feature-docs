/**
 * Parses a Django `tests.py`. Currently only contributes to the file
 * inventory; test-case/coverage summaries can be added to the Appendix in a
 * future iteration.
 * TODO: implement static analysis once feature work begins.
 */
export class TestsParser {
  parse(_fileContent: string, _sourceFile: string): void {
    // Intentionally minimal for the initial scaffold.
  }
}
