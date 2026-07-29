import { ModelDefinition } from '../../models/featureDocumentation';

/**
 * Parses a Django `models.py` into model definitions, including fields and
 * relationships (ForeignKey, OneToOneField, ManyToManyField).
 * TODO: implement static analysis once feature work begins.
 */
export class ModelsParser {
  parse(_fileContent: string, _sourceFile: string): ModelDefinition[] {
    return [];
  }
}
