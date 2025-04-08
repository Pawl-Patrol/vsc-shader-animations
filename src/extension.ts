import path from "path";
import * as vscode from "vscode";
import { patchHtmlFile } from "./patch";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "vsc-cursor-animations" is now active!'
  );

  const disposable = vscode.commands.registerCommand(
    "vsc-cursor-animations.restart",
    () => {
      const scriptFile = context.asAbsolutePath(path.join("dist", "main.js"));
      patchHtmlFile(scriptFile);
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
