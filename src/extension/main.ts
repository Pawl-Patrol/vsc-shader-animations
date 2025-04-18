import * as path from "path";
import * as vscode from "vscode";
import { Bridge } from "./bridge";
import { getConfig } from "./configuration";
import { Patcher } from "./patch";

const patcher = new Patcher();
let bridge: Bridge;

export async function activate(context: vscode.ExtensionContext) {
  bridge = new Bridge();
  await bridge.connect();

  bridge.onMessage(async (type, payload, reply) => {
    if (type === "config-request") {
      reply("config-response", await getConfig());
    }
  });

  vscode.workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration("vsc-shader-animations")) {
      bridge.sendMessage("config-response", await getConfig());
    }
  });

  const scriptFile = context.asAbsolutePath(
    path.join("dist", "script.bundle.js")
  );

  const disposable = vscode.commands.registerCommand(
    "vsc-shader-animations.toggle",
    () => patcher.toggle(scriptFile)
  );

  const disposable2 = vscode.commands.registerCommand(
    "vsc-shader-animations.reload",
    () => patcher.reload(scriptFile)
  );

  const disposable3 = vscode.commands.registerCommand(
    "vsc-shader-animations.hyperspace",
    async () => {
      const file = await getRandomFile();
      if (!file) {
        return;
      }
      bridge.sendMessage("hyperspace", undefined);
      setTimeout(async () => {
        const doc = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(doc);
      }, 3500);
    }
  );

  context.subscriptions.push(disposable, disposable2, disposable3);
}

async function getRandomFile() {
  const files = await vscode.workspace.findFiles(
    "**/*.*",
    "**/node_modules/**"
  );
  if (files.length === 0) {
    return null;
  }
  const randomFile = files[Math.floor(Math.random() * files.length)];
  return randomFile;
}

export function deactivate() {
  bridge.close();
}
