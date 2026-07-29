import { EndpointDefinition } from '../../models/featureDocumentation';

/**
 * Parses a Django `urls.py` into endpoint definitions.
 * TODO: implement static analysis of path()/re_path() calls and router
 * registrations (DefaultRouter/SimpleRouter) once feature work begins.
 */
export class UrlsParser {
  parse(_fileContent: string, _sourceFile: string): EndpointDefinition[] {
    return [];
  }
}
