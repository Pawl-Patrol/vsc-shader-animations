import { IEditor } from "../lib/types";

export class Editor implements IEditor {
  private _canvas?: HTMLCanvasElement;
  private mouse = { x: 500, y: 500 };

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
    this._canvas.addEventListener("click", (event) => {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
    });
  }

  public findSuitableCursorRect() {
    return new DOMRect(this.mouse.x, this.mouse.y, 20, 50);
  }
}
