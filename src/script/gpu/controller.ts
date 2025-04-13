import { AnimationConfiguration } from "../../common/types";
import { Bridge } from "../vscode/bridge";
import { Editor } from "../vscode/editor";
import { AnimationBase } from "./animation/base";
import { CursorTrail } from "./animation/CursorTrail";
import { Hyperspace } from "./animation/Hyperspace";
import { WigglyWorm } from "./animation/WigglyWorm";
import { initWebGPU } from "./initWebGPU";
import { GPUContext, VscodeContext } from "./types";

type AnimationState = {
  animation: AnimationBase;
  startedAt?: number;
};

export class AnimationController {
  animations: Record<string, AnimationState>;

  constructor(
    private gpu: GPUContext,
    private vscode: VscodeContext,
    private config: AnimationConfiguration
  ) {
    this.setupEvents();
    this.animations = {
      hyperspace: {
        animation: new Hyperspace(this.gpu, this.vscode, this.config),
      },
      "cursor-trail": {
        animation: new CursorTrail(this.gpu, this.vscode, this.config),
      },
      "wiggly-worm": {
        animation: new WigglyWorm(this.gpu, this.vscode, this.config),
      },
    };
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
    await controller.onConfigChange();
    controller.mainLoop();
  }

  setupEvents() {
    this.vscode.bridge.onMessage(async (m) => {
      if (m.type === "config-response") {
        Object.assign(this.config, m.payload);
        this.onConfigChange();
        console.log("New configuration", m.payload);
      } else if (m.type === "hyperspace") {
        this.startAnimation("hyperspace");
        setTimeout(() => {
          this.stopAnimation("hyperspace");
        }, 7000);
      }
    });
  }

  async onConfigChange() {
    await this.startAnimation("cursor-trail");
    if (this.config.wigglyWorm) {
      await this.startAnimation("wiggly-worm");
    } else {
      this.stopAnimation("wiggly-worm");
    }
  }

  async startAnimation(name: string) {
    const state = this.animations[name];
    if (!state) {
      throw new Error(`Animation ${name} not found`);
    }
    state.startedAt ??= performance.now();
    await state.animation.build();
  }

  stopAnimation(name: string) {
    const state = this.animations[name];
    if (!state) {
      throw new Error(`Animation ${name} not found`);
    }
    state.startedAt = undefined;
  }

  mainLoop() {
    const animate = (time: DOMHighResTimeStamp) => {
      let clear = true;
      for (const name in this.animations) {
        const state = this.animations[name];
        if (state.startedAt) {
          state.animation.render(time - state.startedAt, clear);
          clear = false;
        }
      }
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}
