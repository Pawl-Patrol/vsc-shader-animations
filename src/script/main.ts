import { WEBSOCKET_PORT } from "../common/common";

console.log("Injection script loaded.");

tryConnect(10);
function tryConnect(attempts: number) {
  const socket = new WebSocket(`ws://localhost:${WEBSOCKET_PORT}`);

  socket.onopen = () => {
    socket.send(
      JSON.stringify({ type: "from-dom", data: "Hello from Workbench DOM" })
    );
  };

  socket.onerror = () => {
    console.warn("WebSocket connection failed. Retrying...");
    if (attempts > 0) {
      setTimeout(() => tryConnect(attempts - 1), 500);
    } else {
      console.error("Giving up after multiple attempts.");
    }
  };

  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    console.log("From Extension:", msg);
  };
}
