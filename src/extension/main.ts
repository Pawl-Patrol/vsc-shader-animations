import * as path from "path";
import * as vscode from "vscode";
import * as WebSocket from "ws";
import { WEBSOCKET_PORT } from "../common/common";
import { patchHtmlFile, revertChanges } from "./patch";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "vsc-cursor-animations" is now active!'
  );

  const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

  console.log("WebSocket server started");
  wss.on("connection", (socket) => {
    console.log("WebSocket connection!");
    socket.on("message", (message) => {
      console.log("From DOM:", message);
    });

    socket.send(
      JSON.stringify({ type: "from-extension", data: "Hello from Extension" })
    );
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
  revertChanges();
}
