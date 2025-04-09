import { Server, WebSocket } from "ws";
import { WEBSOCKET_PORT } from "../common/common";
import { BridgeMessage } from "../common/types";

export class Bridge {
  wss: Server;

  constructor() {
    console.log("WebSocket server started on port", WEBSOCKET_PORT);
    this.wss = new WebSocket.Server({ port: WEBSOCKET_PORT });
  }

  close() {
    this.wss.close(() => {
      console.log("WebSocket server closed.");
    });
  }

  sendMessage(message: BridgeMessage) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  onMessage(
    callback: (
      message: BridgeMessage,
      reply: (message: BridgeMessage) => void
    ) => void
  ) {
    this.wss.on("connection", (client) => {
      client.on("message", (data) => {
        const message = JSON.parse(data.toString());
        callback(message, (m) => client.send(JSON.stringify(m)));
      });
    });
  }
}
