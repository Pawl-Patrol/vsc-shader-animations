import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

/**
 * Inspired by code from here:
 * https://github.com/be5invis/vscode-custom-css/blob/master/src/extension.js
 */

export class Patcher {
  htmlFile: string = possiblePaths.find((p) => fs.existsSync(p))!;
  backupFile: string = `${this.htmlFile}.backup`;

  async patchHtmlFile(scriptFile: string) {
    await this.restoreBackupIfExists();
    await this.createBackup();
    const script = await fs.promises.readFile(scriptFile, "utf8");
    await this.injectScript(script);
    this.needsRestart();
  }

  private async restoreBackupIfExists() {
    try {
      if (fs.existsSync(this.backupFile)) {
        await fs.promises.unlink(this.htmlFile);
        await fs.promises.rename(this.backupFile, this.htmlFile);
      }
    } catch (e) {
      vscode.window.showErrorMessage(
        "Need admin privilege to patch html file."
      );
      throw e;
    }
  }

  private async injectScript(script: string) {
    let html = await fs.promises.readFile(this.htmlFile, "utf8");
    html = html.replace(
      /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/,
      ""
    );
    html = html.replace(/(<\/html>)/, `<script>${script}</script>\n</html>`);
    await fs.promises.writeFile(this.htmlFile, html, "utf8");
  }

  private async createBackup() {
    try {
      const html = await fs.promises.readFile(this.htmlFile, "utf8");
      await fs.promises.writeFile(this.backupFile, html, "utf8");
    } catch (e) {
      vscode.window.showErrorMessage(
        "Need admin privilege to patch html file."
      );
      throw e;
    }
  }

  private needsRestart() {
    vscode.window
      .showInformationMessage("Restart your IDE to apply changes", "Restart")
      .then((btn) => {
        if (btn === "Restart") {
          vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      });
  }
}

// prettier-ignore
const possiblePaths = [
  path.join(vscode.env.appRoot, "out", "vs", "code", "electron-sandbox", "workbench", "workbench.html"),
  path.join(vscode.env.appRoot, "out", "vs", "code", "electron-sandbox", "workbench", "workbench-apc-extension.html"),
  path.join(vscode.env.appRoot, "out", "vs", "code", "electron-sandbox", "workbench", "workbench.esm.html"),
];
