import { WEBSOCKET_PORT } from "../common/common";

export class Bridge {
  private constructor(private socket: WebSocket) {}

  static async waitUntilConnectionCanBeEstablished() {
    const socket = await new Promise<WebSocket>((resolve, reject) =>
      tryConnect(resolve, reject)
    );
    return new Bridge(socket);
  }

  async sendMessage(message: unknown) {
    this.socket.send(JSON.stringify(message));
  }

  async onMessage(callback: (message: unknown) => void) {
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };
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
