import { SerializerDefinition } from '../../models/featureDocumentation';

/**
 * Parses a Django `serializers.py` into serializer class definitions.
 * TODO: implement static analysis of ModelSerializer/Serializer subclasses,
 * their Meta.model/Meta.fields, and declared field attributes.
 */
export class SerializersParser {
  parse(_fileContent: string, _sourceFile: string): SerializerDefinition[] {
    return [];
  }
}
