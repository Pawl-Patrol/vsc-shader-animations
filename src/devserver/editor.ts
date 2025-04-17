import { IEditor } from "../lib/types";

export class Editor implements IEditor {
  private _canvas?: HTMLCanvasElement;

  public get canvas() {
    if (!this._canvas) {
      throw new Error("Canvas not connected");
    }
    return this._canvas;
  }

  public async connect() {
    this._canvas = document.getElementsByTagName("canvas")[0];
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    addEventListener("resize", resize);
    resize();
  }

  public findSuitableCursorRect() {
    return new DOMRect(800, 400, 400, 50);
  }
}
