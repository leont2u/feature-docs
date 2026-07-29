import { SignalDefinition } from '../../models/featureDocumentation';

/**
 * Parses a Django `signals.py` into signal receiver definitions
 * (post_save, pre_delete, custom signals, etc.).
 * TODO: implement static analysis once feature work begins.
 */
export class SignalsParser {
  parse(_fileContent: string, _sourceFile: string): SignalDefinition[] {
    return [];
  }
}
