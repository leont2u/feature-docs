import { EndpointDefinition, PermissionUsage, AuthenticationRequirement } from '../../models/featureDocumentation';

export interface ViewsParseResult {
  endpoints: EndpointDefinition[];
  permissions: PermissionUsage[];
  authentication: AuthenticationRequirement[];
}

/**
 * Parses a Django `views.py` (function-based views, APIView, ViewSet
 * subclasses) to extract handlers, HTTP methods, and declared
 * permission_classes/authentication_classes.
 * TODO: implement static analysis once feature work begins.
 */
export class ViewsParser {
  parse(_fileContent: string, _sourceFile: string): ViewsParseResult {
    return { endpoints: [], permissions: [], authentication: [] };
  }
}
