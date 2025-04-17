import { IEditor } from "../lib/types";

export class Editor implements IEditor {
  private _canvas?: HTMLCanvasElement;
  private _element?: HTMLElement;

  public get canvas() {
    if (!this._canvas) {
      throw new Error("Canvas not connected");
    }
    return this._canvas;
  }

  public get element() {
    if (!this._element) {
      throw new Error("Editor not connected");
    }
    return this._element;
  }

  public async connect() {
    const getElement = () =>
      document.querySelector<HTMLElement>(".part.editor");
    this._element = await new Promise<HTMLElement>((resolve) => {
      const element = getElement();
      if (element) {
        resolve(element);
      }
      const observer = new MutationObserver(() => {
        const element = getElement();
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    this._canvas = appendCanvas(this.element);
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

    return null;
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
}

function appendCanvas(parent: HTMLElement) {
  const canvas = document.createElement("canvas");

  canvas.style.pointerEvents = "none";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "9999";

  const resize = () => {
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  };

  new ResizeObserver(resize).observe(parent);
  resize();

  return parent.appendChild(canvas);
}
