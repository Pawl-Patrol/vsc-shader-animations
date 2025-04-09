import { Bridge } from "./bridge";

console.log("Injection script loaded.");

async function main() {
  const bridge = await Bridge.waitUntilConnectionCanBeEstablished();
  bridge.sendMessage({ message: "test!" });
  bridge.onMessage((m) => console.log("From extension:", m));
}

main();
