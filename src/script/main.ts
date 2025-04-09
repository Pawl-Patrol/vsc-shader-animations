import { AnimationConfiguration } from "../common/types";
import { Bridge } from "./bridge";
import { GPUAnimation } from "./gpu/GPUAnimation";
import { deferrable } from "./utils/defer";
import { Editor } from "./utils/editor";
import * as rect from "./utils/rect";

console.log("Injection script loaded.");

let source: DOMRect | undefined;
let target: DOMRect;

async function main() {
  const editor = await Editor.create();
  const animation = await GPUAnimation.create(editor.canvas);
  editor.element.addEventListener("resize", () => animation.onCanvasResize());

  const bridge = await Bridge.waitUntilConnectionCanBeEstablished();
  bridge.sendMessage({ from: "script", type: "config", payload: {} });

  let config: AnimationConfiguration;
  const deferred = deferrable<AnimationConfiguration>();

  bridge.onMessage((m) => {
    if (m.from === "extension" && m.type === "config") {
      config = m.payload;
      deferred.resolve(config);
    }
  });

  await deferred.promise;

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
        duration =
          rect.distance(source, target) / config.velocityInPxsPerSecond;
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
