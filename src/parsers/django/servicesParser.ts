import { ServiceDefinition } from '../../models/featureDocumentation';

/**
 * Parses a Django `services.py` into service function/class definitions
 * representing the feature's business logic layer.
 * TODO: implement static analysis once feature work begins.
 */
export class ServicesParser {
  parse(_fileContent: string, _sourceFile: string): ServiceDefinition[] {
    return [];
  }
}
