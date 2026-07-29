import { DependencyReference } from '../../models/featureDocumentation';

/**
 * Extracts `import`/`from ... import ...` statements from a Python source
 * file into DependencyReference entries, shared across all Django file
 * parsers.
 * TODO: implement static analysis once feature work begins.
 */
export class ImportsParser {
  parse(_fileContent: string, _sourceFile: string): DependencyReference[] {
    return [];
  }
}
