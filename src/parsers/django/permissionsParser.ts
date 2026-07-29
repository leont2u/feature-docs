import { PermissionUsage } from '../../models/featureDocumentation';
import { toLogicalLines } from './pythonSource';

const CLASS_HEADER = /^class\s+(\w+)\s*\(([^)]*)\)\s*:/;

/**
 * Parses a Django `permissions.py` into custom permission class definitions
 * (any class whose base list ends in `Permission`, e.g. BasePermission).
 * Where each is actually applied (permission_classes on a view) is captured
 * separately by ViewsParser — these entries represent the definitions
 * themselves, with an empty appliedTo until cross-referenced.
 */
export class PermissionsParser {
  parse(fileContent: string, sourceFile: string): PermissionUsage[] {
    const lines = toLogicalLines(fileContent);
    const permissions: PermissionUsage[] = [];

    for (const line of lines) {
      const headerMatch = CLASS_HEADER.exec(line.text.trim());
      if (!headerMatch) {
        continue;
      }
      const [, className, basesRaw] = headerMatch;
      const baseClasses = basesRaw
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      if (baseClasses.some((b) => b.endsWith('Permission'))) {
        permissions.push({ className, appliedTo: [], sourceFile });
      }
    }

    return permissions;
  }
}
