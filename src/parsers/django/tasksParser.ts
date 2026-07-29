import { CeleryTaskDefinition } from '../../models/featureDocumentation';
import { toLogicalLines } from './pythonSource';

const DEF_HEADER = /^def\s+(\w+)\s*\(/;
const TASK_DECORATOR = /^@(?:shared_task\b|[\w.]+\.task\()/;
const PERIODIC_DECORATOR = /^@[\w.]+\.periodic\(/;

/**
 * Parses a `tasks.py` for background-task-decorated functions. Recognizes
 * both Celery's `@shared_task` / `@app.task` and task-queue libraries with
 * the same decorator shape (e.g. Procrastinate's `@app.task`), since a
 * `@some_app.task(...)` decorator immediately above a function is the
 * common pattern across all of them. A function is periodic if it also
 * carries an `@app.periodic(...)`-style decorator (decorators may stack,
 * so all lines immediately above the def are checked, not just the first).
 */
export class TasksParser {
  parse(fileContent: string, sourceFile: string): CeleryTaskDefinition[] {
    const lines = toLogicalLines(fileContent);
    const tasks: CeleryTaskDefinition[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indent !== 0) {
        continue;
      }
      const defMatch = DEF_HEADER.exec(lines[i].text.trim());
      if (!defMatch) {
        continue;
      }

      const decoratorLines: string[] = [];
      for (let j = i - 1; j >= 0 && lines[j].text.trim().startsWith('@'); j--) {
        decoratorLines.unshift(lines[j].text.trim());
      }
      if (decoratorLines.length === 0) {
        continue;
      }

      const isTask = decoratorLines.some((d) => TASK_DECORATOR.test(d));
      if (!isTask) {
        continue;
      }
      const isPeriodic = decoratorLines.some((d) => PERIODIC_DECORATOR.test(d));

      tasks.push({ name: defMatch[1], sourceFile, isPeriodic });
    }

    return tasks;
  }
}
