import { CeleryTaskDefinition } from '../../models/featureDocumentation';

/**
 * Parses a Django `tasks.py` into Celery task definitions
 * (@shared_task / @app.task decorated functions).
 * TODO: implement static analysis once feature work begins.
 */
export class TasksParser {
  parse(_fileContent: string, _sourceFile: string): CeleryTaskDefinition[] {
    return [];
  }
}
