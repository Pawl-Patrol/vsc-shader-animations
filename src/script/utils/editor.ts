import { sleep } from "./sleep";

export class Editor {
  public canvas: HTMLCanvasElement;

  constructor(public element: HTMLElement) {
    this.canvas = this.createCanvas();
  }

  public clearCanvas() {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    console.log("clear canvas");
  }

  public static async create() {
    while (true) {
      const editor = document.querySelector<HTMLElement>(".part.editor");
      if (editor) {
        return new Editor(editor);
      }
      await sleep(100);
    }
  }

  private createCanvas() {
    const canvas = document.createElement("canvas");

    canvas.style.pointerEvents = "none";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.zIndex = "9999";

    const resize = () => {
      canvas.width = this.element.clientWidth;
      canvas.height = this.element.clientHeight;
    };

    new ResizeObserver(resize).observe(this.element);
    resize();

    return this.element.appendChild(canvas);
  }

  private findHoveredSelection(target: HTMLElement) {
    const targetRect = target.getBoundingClientRect();
    for (const selection of this.element.getElementsByClassName(
      "selected-text"
    )) {
      const selectionRect = selection.getBoundingClientRect();
      if (selectionRect.y === targetRect.y) {
        return selectionRect;
      }
    }
    return targetRect;
  }

  public findSuitableCursorRect() {
    const { x: canvasX, y: canvasY } = this.canvas.getBoundingClientRect();

    for (const cursor of this.element.querySelectorAll<HTMLElement>(
      ".cursor"
    )) {
      if (cursor.style.visibility === "hidden") {
        continue;
      }
      const rect = this.findHoveredSelection(cursor);
      if (rect.x <= canvasX || rect.y <= canvasY) {
        continue;
      }
      const { left, right } =
        cursor.parentElement!.parentElement!.getBoundingClientRect();
      if (left > rect.right || right < rect.left) {
        continue;
      }
      if (!cursor.isConnected) {
        continue;
      }
      return rect;
    }
  }
}
