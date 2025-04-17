import { AnimationConfiguration, VscodeContext } from "../../lib/types";
import { AnimationBase } from "./animation/base";
import { CursorTrail } from "./animation/CursorTrail";
import { Hyperspace } from "./animation/Hyperspace";
import { WigglyWorm } from "./animation/WigglyWorm";
import { getWebGPUContext, GPUContext } from "./context";

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
      "cursor-trail": {
        animation: new CursorTrail(this.gpu, this.vscode, this.config),
      },
      "wiggly-worm": {
        animation: new WigglyWorm(this.gpu, this.vscode, this.config),
      },
      hyperspace: {
        animation: new Hyperspace(this.gpu, this.vscode, this.config),
      },
    };
  }

  static async run(vscode: VscodeContext) {
    const editorPromise = vscode.editor.connect();
    await vscode.bridge.connect();
    vscode.bridge.sendMessage("config-request", undefined);
    const config = await vscode.bridge.waitForMessage("config-response");
    await editorPromise;
    const gpu = await getWebGPUContext(vscode.editor.canvas);
    const controller = new AnimationController(gpu, vscode, config);
    await controller.onConfigChange();
    controller.mainLoop();
    controller.startAnimation("hyperspace");
  }

  setupEvents() {
    this.vscode.bridge.onMessage(async (type, message) => {
      if (type === "config-response") {
        Object.assign(this.config, message);
        this.onConfigChange();
        console.log("New configuration", message);
      } else if (type === "hyperspace") {
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
