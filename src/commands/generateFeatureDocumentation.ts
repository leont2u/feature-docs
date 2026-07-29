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

      // The "Open Report" follow-up prompt is deliberately NOT awaited inside
      // withProgress: showInformationMessage only resolves once the user
      // clicks a button or dismisses it, and awaiting it in here would keep
      // the progress spinner on screen indefinitely even though generation
      // itself already finished.
      const result = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'FeatureDocs: Generating documentation…' },
        async () => {
          logger.info(`Parsing ${featureFolderPath} with ${parser.frameworkName} parser`);
          const workspaceFolder = vscode.workspace.getWorkspaceFolder(featureFolderUri);
          const projectName = workspaceFolder?.name ?? path.basename(path.dirname(featureFolderPath));

          const data = await parser.parse(featureFolderPath, projectName);

          const outputDirectory = path.join(featureFolderPath, '.featuredocs');
          const generator = new PdfReportGenerator();
          const report = await generator.generate(data, outputDirectory);

          logger.info(`Generated report at ${report.pdfPath}`);
          return { report, featureName: data.metadata.featureName };
        }
      ).then(
        (value) => ({ ok: true as const, value }),
        (err) => ({ ok: false as const, err })
      );

      if (!result.ok) {
        logger.error('Failed to generate feature documentation', result.err);
        vscode.window.showErrorMessage(`FeatureDocs: failed to generate documentation. ${String(result.err)}`);
        return;
      }

      const openReport = 'Open Report';
      const selection = await vscode.window.showInformationMessage(
        `FeatureDocs: documentation generated for "${result.value.featureName}".`,
        openReport
      );
      if (selection === openReport) {
        await vscode.env.openExternal(vscode.Uri.file(result.value.report.pdfPath));
      }
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
