import * as path from "path";
import * as vscode from "vscode";
import { Bridge } from "./bridge";
import { patchHtmlFile, revertChanges } from "./patch";

let bridge: Bridge;

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "vsc-cursor-animations" is now active!'
  );
  bridge = new Bridge();

  bridge.onMessage((m) => {
    console.log("From injection script:", m);
    bridge.sendMessage({ message: "Hello from extension!" });
  });

  const disposable = vscode.commands.registerCommand(
    "vsc-cursor-animations.restart",
    () => {
      const scriptFile = context.asAbsolutePath(
        path.join("dist", "script.bundle.js")
      );
      patchHtmlFile(scriptFile);
    }
  );

  context.subscriptions.push(disposable);

  vscode.window.onDidChangeTextEditorSelection((event) => {
    // wss.clients.forEach((client) => {
    //   if (client.readyState !== WebSocket.OPEN) {
    //     return;
    //   }
    // });
  });
}

export function deactivate() {
  bridge.close();
  revertChanges();
}
