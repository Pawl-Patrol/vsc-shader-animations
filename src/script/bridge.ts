import { WEBSOCKET_PORT } from "../lib/common";
import { BridgeMessage, BridgeMessageType, IBridge } from "../lib/types";
import { deferrable } from "../lib/utils/defer";

export class Bridge implements IBridge {
  private _socket?: WebSocket;

  private get socket() {
    if (!this._socket) {
      throw new Error("Socket not connected");
    }
    return this._socket;
  }

  async connect() {
    this._socket = await new Promise<WebSocket>((resolve, reject) =>
      tryConnect(resolve, reject)
    );
  }

  async sendMessage<T extends BridgeMessageType>(
    type: T,
    payload: BridgeMessage<T>
  ) {
    this.socket.send(JSON.stringify({ type, payload }));
  }

  onMessage(
    callback: <T extends BridgeMessageType>(
      type: T,
      message: BridgeMessage<T>,
      reply: <U extends BridgeMessageType>(
        type: U,
        payload: BridgeMessage<U>
      ) => void
    ) => void
  ) {
    this.socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      callback(data.type, data.payload, (type, payload) => {
        this.socket.send(JSON.stringify({ type, payload }));
      });
    });
  }

  async waitForMessage<T extends BridgeMessageType>(type: T) {
    const deferred = deferrable<BridgeMessage<T>>();
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
