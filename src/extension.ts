import * as vscode from 'vscode';
import { ParserRegistry } from './parsers/parserRegistry';
import { DjangoFeatureParser } from './parsers/django/djangoFeatureParser';
import { registerGenerateFeatureDocumentationCommand } from './commands/generateFeatureDocumentation';
import { Logger } from './utils/logger';

export function activate(context: vscode.ExtensionContext): void {
  const logger = new Logger('FeatureDocs');
  context.subscriptions.push(logger);

  const registry = new ParserRegistry();
  registry.register(new DjangoFeatureParser());
  // Future frameworks (FastAPI, Express.js, NestJS, Laravel, Spring Boot)
  // register additional IFeatureParser implementations here.

  registerGenerateFeatureDocumentationCommand(context, registry, logger);
}

export function deactivate(): void {
  // No teardown required: all disposables are owned by context.subscriptions.
}
