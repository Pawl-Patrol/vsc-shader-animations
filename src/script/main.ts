import { Bridge } from "./bridge";
import { GPUAnimation } from "./gpu/GPUAnimation";
import { Editor } from "./utils/editor";
import * as rect from "./utils/rect";

console.log("Injection script loaded.");
const velocityInPxPerMs = 1.45;

let source: DOMRect | undefined;
let target: DOMRect;

async function main() {
  const editor = await Editor.create();
  const animation = await GPUAnimation.create(editor.canvas);
  editor.element.addEventListener("resize", () => animation.onCanvasResize());

  const bridge = await Bridge.waitUntilConnectionCanBeEstablished();
  bridge.sendMessage({ message: "test!" });
  bridge.onMessage((m) => console.log("From extension:", m));

  let progress = 0;
  let duration = 0;
  let lastTime = 0;
  function animate(time: number) {
    requestAnimationFrame(animate);

    const deltaTime = time - lastTime;
    lastTime = time;

    const nextCursor = editor.findSuitableCursorRect();

    if (nextCursor && !rect.equal(target, nextCursor)) {
      if (source) {
        source = rect.lerp(progress, source, target);
      } else {
        source = target;
      }

      target = nextCursor;

      if (source) {
        duration = rect.distance(source, target) / velocityInPxPerMs;
        progress = 0;
      } else {
        progress = 1;
      }
    }

    if (progress < 1) {
      progress += deltaTime / duration;
      if (progress > 1) {
        console.log("Animation finished");
        progress = 1;
      }
    }

    if (nextCursor) {
      animation.render(source ?? target, target, time, progress);
    } else {
      animation.clear();
    }
  }

  animate(0);
}

main();
