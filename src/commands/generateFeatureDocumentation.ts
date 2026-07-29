import * as vscode from 'vscode';
import * as path from 'path';
import { ParserRegistry } from '../parsers/parserRegistry';
import { PdfReportGenerator } from '../generators/pdf/pdfReportGenerator';
import { Logger } from '../utils/logger';

/**
 * Registers the "Generate Feature Documentation" command. The command
 * itself stays framework-agnostic: it asks the ParserRegistry which
 * framework parser (if any) recognizes the folder, then hands the result
 * to the PDF generator. Adding a new framework only requires registering
 * an additional IFeatureParser — this file does not change.
 */
export function registerGenerateFeatureDocumentationCommand(
  context: vscode.ExtensionContext,
  registry: ParserRegistry,
  logger: Logger
): void {
  const disposable = vscode.commands.registerCommand(
    'featuredocs.generateFeatureDocumentation',
    async (resource?: vscode.Uri) => {
      const featureFolderUri = resource ?? (await pickFolder());
      if (!featureFolderUri) {
        return;
      }

      const featureFolderPath = featureFolderUri.fsPath;
      const parser = await registry.detect(featureFolderPath);

      if (!parser) {
        vscode.window.showWarningMessage(
          `FeatureDocs: "${path.basename(featureFolderPath)}" does not look like a supported backend feature folder.`
        );
        return;
      }

      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'FeatureDocs: Generating documentation…' },
        async () => {
          try {
            logger.info(`Parsing ${featureFolderPath} with ${parser.frameworkName} parser`);
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(featureFolderUri);
            const projectName = workspaceFolder?.name ?? path.basename(path.dirname(featureFolderPath));

            const data = await parser.parse(featureFolderPath, projectName);

            const outputDirectory = path.join(featureFolderPath, '.featuredocs');
            const generator = new PdfReportGenerator();
            const report = await generator.generate(data, outputDirectory);

            logger.info(`Generated report at ${report.pdfPath}`);
            const openReport = 'Open Report';
            const selection = await vscode.window.showInformationMessage(
              `FeatureDocs: documentation generated for "${data.metadata.featureName}".`,
              openReport
            );
            if (selection === openReport) {
              await vscode.env.openExternal(vscode.Uri.file(report.pdfPath));
            }
          } catch (err) {
            logger.error('Failed to generate feature documentation', err);
            vscode.window.showErrorMessage(`FeatureDocs: failed to generate documentation. ${String(err)}`);
          }
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

async function pickFolder(): Promise<vscode.Uri | undefined> {
  const selection = await vscode.window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Select feature folder',
  });
  return selection?.[0];
}
