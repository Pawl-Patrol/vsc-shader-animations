import {
  ANIMATION_NAMES,
  AnimationConfiguration,
  VscodeContext,
} from "../../lib/types";
import { AnimationBase } from "./animation/base";
import { CursorTrail } from "./animation/CursorTrail";
import { CursorTransition } from "./animation/CursorTransition";
import { Firework } from "./animation/Firework";
import { Hyperspace } from "./animation/Hyperspace";
import { Smoke } from "./animation/Smoke";
import { getWebGPUContext, GPUContext } from "./context";

type AnimationState = {
  animation: AnimationBase;
  startedAt?: number;
};

export class AnimationController {
  animations: Record<string, AnimationState> = {};

  constructor(
    private gpu: GPUContext,
    private vscode: VscodeContext,
    private config: AnimationConfiguration
  ) {
    this.setupEvents();
    this.initAnimationState("cursor-transition", CursorTransition);
    this.initAnimationState("cursor-trail", CursorTrail);
    this.initAnimationState("smoke", Smoke);
    this.initAnimationState("firework", Firework);
    this.initAnimationState("hyperspace", Hyperspace);
  }

  initAnimationState(
    name: string,
    Animation: new (
      ...args: ConstructorParameters<typeof AnimationBase>
    ) => AnimationBase
  ) {
    this.animations[name] = {
      animation: new Animation(this.gpu, this.vscode, this.config),
      startedAt: undefined,
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
    for (const name of ANIMATION_NAMES) {
      if (this.config.animations.includes(name)) {
        await this.startAnimation(name);
      } else {
        this.stopAnimation(name);
      }
    }
    this.clearCanvas();
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

  clearCanvas() {
    const commandEncoder = this.gpu.device.createCommandEncoder();
    commandEncoder
      .beginRenderPass({
        colorAttachments: [
          {
            view: this.gpu.context.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            storeOp: "store",
          },
        ],
      })
      .end();
    this.gpu.device.queue.submit([commandEncoder.finish()]);
  }
}
