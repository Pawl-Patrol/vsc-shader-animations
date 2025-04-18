import { Server, WebSocket } from "ws";
import { WEBSOCKET_PORT } from "../lib/common";
import { BridgeMessage, BridgeMessageType, IBridge } from "../lib/types";

export class Bridge implements IBridge {
  _wss?: Server;

  get wss() {
    if (!this._wss) {
      throw new Error("WebSocket server not connected");
    }
    return this._wss;
  }

  async connect() {
    this._wss = new WebSocket.Server({ port: WEBSOCKET_PORT });
    console.log(`WebSocket server started on port ${WEBSOCKET_PORT}`);
  }

  close() {
    this.wss.close(() => {
      console.log("WebSocket server closed.");
    });
  }

  sendMessage<T extends BridgeMessageType>(type: T, payload: BridgeMessage<T>) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, payload }));
      }
    });
  }

  onMessage(
    callback: <T extends BridgeMessageType>(
      type: T,
      payload: BridgeMessage<T>,
      reply: <U extends BridgeMessageType>(
        type: U,
        payload: BridgeMessage<U>
      ) => void
    ) => void
  ) {
    this.wss.on("connection", (client) => {
      client.on("message", (data) => {
        const message = JSON.parse(data.toString());
        callback(message.type, message.payload, (type, payload) =>
          client.send(JSON.stringify({ type, payload }))
        );
      });
    });
  }

  waitForMessage<T extends BridgeMessageType>(
    type: T
  ): Promise<BridgeMessage<T>> {
    return new Promise((resolve) => {
      this.wss.on("connection", (client) => {
        client.once("message", (data) => {
          const message = JSON.parse(data.toString());
          if (message.type === type) {
            resolve(message.payload);
          }
        });
      });
    });
  }
}
