import { PermissionUsage } from '../../models/featureDocumentation';

/**
 * Parses a Django `permissions.py` into custom permission class definitions.
 * TODO: implement static analysis once feature work begins.
 */
export class PermissionsParser {
  parse(_fileContent: string, _sourceFile: string): PermissionUsage[] {
    return [];
  }
}
