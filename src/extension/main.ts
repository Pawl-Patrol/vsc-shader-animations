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
    if (m.from === "script" && m.type === "config") {
      reply(await getConfig());
    }
  });

  vscode.workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration("vsc-cursor-animations")) {
      bridge.sendMessage(await getConfig());
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

  context.subscriptions.push(disposable);
}

export function deactivate() {
  bridge.close();
}
