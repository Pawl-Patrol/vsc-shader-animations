import { AnimationController } from "./animation-controller";
import { Bridge } from "./bridge";
import { Editor } from "./utils/editor";

console.log("Injection script loaded.");

(async () => {
  const bridge = await Bridge.waitUntilConnectionCanBeEstablished();
  const editor = await Editor.loopUntilEditorElementExists();
  const main = new AnimationController(bridge, editor);
  main.startAnimation();
})();
