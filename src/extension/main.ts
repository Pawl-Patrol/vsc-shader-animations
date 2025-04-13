import * as path from "path";
import * as vscode from "vscode";
import { Bridge } from "./bridge";
import { getConfig } from "./configuration";
import { Patcher } from "./patch";

const patcher = new Patcher();
let bridge: Bridge;

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "vsc-cursor-animations" is now active!'
  );

  bridge = new Bridge();

  bridge.onMessage(async (m, reply) => {
    if (m.type === "config-request") {
      reply(await getConfig());
    }
  });

  vscode.workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration("vsc-cursor-animations")) {
      bridge.sendMessage(await getConfig());
    }
  });

  let isHandlingSwitch = false;
  let lastEditorUri: vscode.Uri;
  vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (!editor || isHandlingSwitch) {
      return;
    }

    const formUri = lastEditorUri;
    const toUri = editor.document.uri;
    lastEditorUri = toUri;

    if (!formUri) {
      return;
    }

    console.log("Switching editors", formUri.toString(), toUri.toString());

    isHandlingSwitch = true;

    if (toUri.toString() === formUri.toString()) {
      const doc = await vscode.workspace.openTextDocument(formUri);
      await vscode.window.showTextDocument(doc, { preview: false });
      bridge.sendMessage({ type: "hyperspace", payload: {} });
      setTimeout(async () => {
        const doc = await vscode.workspace.openTextDocument(toUri);
        await vscode.window.showTextDocument(doc, { preview: false });
        isHandlingSwitch = false;
      }, 3500);
    }
  });

  const disposable = vscode.commands.registerCommand(
    "vsc-cursor-animations.toggle",
    () => {
      patcher.toggle(
        context.asAbsolutePath(path.join("dist", "script.bundle.js"))
      );
    }
  );

  const disposable2 = vscode.commands.registerCommand(
    "vsc-cursor-animations.hyperspace",
    () => {
      bridge.sendMessage({ type: "hyperspace", payload: {} });
    }
  );

  context.subscriptions.push(disposable, disposable2);
}

export function deactivate() {
  bridge.close();
}
