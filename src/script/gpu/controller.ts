import { AnimationConfiguration } from "../../common/types";
import { Bridge } from "../vscode/bridge";
import { Editor } from "../vscode/editor";
import { AnimationBase } from "./animation/base";
import { CursorTrail } from "./animation/CursorTrail";
import { Hyperspace } from "./animation/Hyperspace";
import { WigglyWorm } from "./animation/WigglyWorm";
import { initWebGPU } from "./initWebGPU";
import { GPUContext, VscodeContext } from "./types";

const ANIMATIONS = {
  "cursor-trail": CursorTrail,
  "wiggly-worm": WigglyWorm,
  hyperspace: Hyperspace,
} satisfies Record<string, typeof AnimationBase>;

export class AnimationController {
  animation?: AnimationBase;
  running = false;

  constructor(
    private gpu: GPUContext,
    private vscode: VscodeContext,
    private config: AnimationConfiguration
  ) {
    this.setupEvents();
  }

  static async run() {
    const vscode = {
      editor: await Editor.loopUntilEditorElementExists(),
      bridge: await Bridge.waitUntilConnectionCanBeEstablished(),
    };
    vscode.bridge.sendMessage({ type: "config-request", payload: {} });
    const config = await vscode.bridge.waitForMessage("config-response");
    const gpu = await initWebGPU(vscode.editor.canvas);
    const controller = new AnimationController(gpu, vscode, config);
    await controller.startAnimation("cursor-trail"); // TODO: move
  }

  setupEvents() {
    this.vscode.bridge.onMessage(async (m) => {
      if (m.type === "config-response") {
        this.animation?.build();
        Object.assign(this.config, m.payload);
        console.log("New configuration", m.payload);
      } else if (m.type === "hyperspace") {
        this.startAnimation("hyperspace", 7000, () => {
          this.startAnimation("cursor-trail");
        });
      }
    });
  }

  async startAnimation(
    name: keyof typeof ANIMATIONS,
    durationMs?: number,
    timeoutCallback?: () => void
  ) {
    const Animation = ANIMATIONS[name];
    this.animation = new Animation(this.gpu, this.vscode, this.config);
    await this.animation.build();

    const startTime = performance.now();
    const animate = (time: DOMHighResTimeStamp) => {
      if (!this.running) {
        return;
      }
      this.animation!.render(time - startTime);
      requestAnimationFrame(animate);
    };

    this.running = true;
    requestAnimationFrame(animate);

    if (durationMs) {
      setTimeout(() => {
        this.running = false;
        timeoutCallback?.();
      }, durationMs);
    }
  }
}
