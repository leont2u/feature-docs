/**
 * Parses a Django `admin.py`. Currently only contributes to the file
 * inventory and dependency extraction (via ImportsParser); admin-specific
 * details (list_display, inlines, etc.) can be added to the Appendix in a
 * future iteration.
 * TODO: implement static analysis once feature work begins.
 */
export class AdminParser {
  parse(_fileContent: string, _sourceFile: string): void {
    // Intentionally minimal for the initial scaffold.
  }
}
