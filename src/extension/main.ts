import * as path from "path";
import * as vscode from "vscode";
import { BridgeMessage } from "../common/types";
import { Bridge } from "./bridge";
import { patchHtmlFile, revertChanges } from "./patch";

let bridge: Bridge;

async function resolveImage(imageUrl: string) {
  try {
    const response = await fetch(imageUrl);
    const contentType = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();
    const base64String = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64String}`;
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to load image from URL: ${imageUrl}. Error: ${error}`
    );
    return undefined;
  }
}

async function getConfig(): Promise<BridgeMessage> {
  const config = vscode.workspace.getConfiguration("vsc-cursor-animations");
  const velocity = config.get<number>("velocity");
  const imageUrl = config.get<string>("backgroundImageUrl");
  return {
    from: "extension",
    type: "config",
    payload: {
      velocityInPxsPerSecond: velocity ? Number(velocity) : 1.45,
      backgroundImageUrl: imageUrl ? await resolveImage(imageUrl) : undefined,
    },
  };
}

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

  const disposable = vscode.commands.registerCommand(
    "vsc-cursor-animations.reload",
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

  vscode.workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration("vsc-cursor-animations")) {
      bridge.sendMessage(await getConfig());
    }
  });
}

export function deactivate() {
  bridge.close();
  revertChanges();
}
