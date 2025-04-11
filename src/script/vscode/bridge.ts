import { WEBSOCKET_PORT } from "../../common/common";
import { BridgeMessage } from "../../common/types";
import { deferrable } from "../utils/defer";

export class Bridge {
  private constructor(private socket: WebSocket) {}

  static async waitUntilConnectionCanBeEstablished() {
    const socket = await new Promise<WebSocket>((resolve, reject) =>
      tryConnect(resolve, reject)
    );
    return new Bridge(socket);
  }

  async sendMessage(message: BridgeMessage) {
    this.socket.send(JSON.stringify(message));
  }

  async onMessage(callback: (message: BridgeMessage) => void) {
    this.socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    });
  }

  async waitForMessage<T extends BridgeMessage["type"]>(type: T) {
    const deferred = deferrable<(BridgeMessage & { type: T })["payload"]>();
    const callback = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === type) {
        deferred.setValue(data.payload);
      }
    };
    this.socket.addEventListener("message", callback);
    await deferred.wait();
    this.socket.removeEventListener("message", callback);
    return deferred.getValue();
  }
}

function tryConnect(
  resolve: (socket: WebSocket) => void,
  reject: () => void,
  attempts = 10,
  delayMs = 500
) {
  console.log("Attempting to connect to WebSocket server...");
  const socket = new WebSocket(`ws://localhost:${WEBSOCKET_PORT}`);

  socket.onopen = () => {
    console.log("WebSocket connection established.");
    resolve(socket);
  };

  socket.onerror = () => {
    console.error("WebSocket connection error.");
    if (attempts > 0) {
      setTimeout(() => tryConnect(resolve, reject, attempts - 1), delayMs);
    } else {
      reject();
    }
  };
}
