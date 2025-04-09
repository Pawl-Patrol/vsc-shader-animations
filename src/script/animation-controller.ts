import { AnimationConfiguration } from "../common/types";
import { Bridge } from "./bridge";
import { GPUAnimation } from "./gpu/GPUAnimation";
import { deferrable } from "./utils/defer";
import { Editor } from "./utils/editor";
import * as rect from "./utils/rect";

export class AnimationController {
  config = deferrable<AnimationConfiguration>();
  animation: GPUAnimation = null!;

  constructor(private bridge: Bridge, private editor: Editor) {
    this.setupEvents();
    this.setupBridge();
  }

  setupEvents() {
    this.editor.element.addEventListener("resize", () =>
      this.animation?.onCanvasResize()
    );
  }

  setupBridge() {
    this.bridge.sendMessage({ from: "script", type: "config", payload: {} });
    this.bridge.onMessage(async (m) => {
      if (m.from === "extension" && m.type === "config") {
        this.animation = await GPUAnimation.create(
          this.editor.canvas,
          m.payload
        );
        this.config.setValue(m.payload);
        console.log("New configuration", m.payload);
      }
    });
  }

  async startAnimation() {
    console.log("Waiting for configuration...");
    await this.config.wait();
    console.log("Starting animation...");

    let source: DOMRect | undefined;
    let target: DOMRect;

    let progress = 0;
    let duration = 0;
    let lastTime = 0;

    const animate = (time: number) => {
      requestAnimationFrame(animate);

      const config = this.config.getValue();
      const deltaTime = time - lastTime;
      lastTime = time;

      const nextCursor = this.editor.findSuitableCursorRect();

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
        this.animation.render(source ?? target, target, time, progress);
      } else {
        this.animation.clear();
      }
    };

    requestAnimationFrame(animate);
  }
}
