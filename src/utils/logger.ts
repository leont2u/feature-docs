import * as vscode from 'vscode';

/** Thin wrapper around a dedicated VS Code output channel. */
export class Logger {
  private readonly channel: vscode.OutputChannel;

  constructor(name: string) {
    this.channel = vscode.window.createOutputChannel(name);
  }

  info(message: string): void {
    this.channel.appendLine(`[INFO] ${message}`);
  }

  error(message: string, err?: unknown): void {
    this.channel.appendLine(`[ERROR] ${message}${err ? `: ${String(err)}` : ''}`);
  }

  show(): void {
    this.channel.show(true);
  }

  dispose(): void {
    this.channel.dispose();
  }
}
