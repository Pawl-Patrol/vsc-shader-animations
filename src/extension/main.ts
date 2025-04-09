import * as path from "path";
import * as vscode from "vscode";
import { BridgeMessage } from "../common/types";
import { Bridge } from "./bridge";
import { patchHtmlFile, revertChanges } from "./patch";

let bridge: Bridge;

function getConfig(): BridgeMessage {
  const config = vscode.workspace.getConfiguration("vsc-cursor-animations");
  return {
    from: "extension",
    type: "config",
    payload: {
      velocityInPxsPerSecond: Number(config.get("velocity")),
    },
  };
}

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "vsc-cursor-animations" is now active!'
  );

  bridge = new Bridge();
  bridge.onMessage((m, reply) => {
    if (m.from === "script" && m.type === "config") {
      const config = vscode.workspace.getConfiguration("vsc-cursor-animations");
      reply(getConfig());
    }
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

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("vsc-cursor-animations")) {
      bridge.sendMessage(getConfig());
    }
  });
}

export function deactivate() {
  bridge.close();
  revertChanges();
}
