# ✨ Vscode Shader Animations

Adds nonsense shader animations to your VSCode editor.

## 🎬 Demo

### Cursor transitions

![Demo](./demo/cursor-transition.gif)

### Cursor trail

![Demo](./demo/cursor-trail.gif)

### Smoke

![Demo](./demo/smoke.gif)

### Hyperspace

Takes you to a random file in your workspace.

![Demo](./demo/hyperspace.gif)

## ⚠️ Warning

This extension modifies the vscode files directly. Use at your own risk. May break on updates.

## 📦 Installation

1. Install the extension using `Install from VSIX` in the extensions tab or using the command line:

```bash
   code --install-extension vscode-shader-animations.vsix
```

2. The extension needs permissions to modify the vscode files.

- On Windows, run vscode as administrator.
- On Mac/Linux, you can run `sudo chown -R $(whoami) "$(which code)"`

3. Open the command palette (Ctrl+Shift+P or Cmd+Shift+P) and run `Toggle Shader Animations` to enable the extension.

4. Reload the window according to the prompt.

## 💡 Tips

- To disable cursor blinking, set `"editor.cursorBlinking": "solid"` in your `settings.json`.

- The vscode cursor can be customized using the following settings:

```json
"workbench.colorCustomizations": {
    "editorCursor.background": "#ffffff7c",
    "editorCursor.foreground": "#ffffff7c",
    "editor.selectionBackground": "#ffffff7c"
}
```

## ⚙️ Configuration

![configuration](./demo/configuration.png)

## 🛠️ How it works

1. The extension finds the `workbench.html` file, which is responsible for rendering the editor and injects a custom script into it.
2. Both the script and the extension communicate via websockets.
3. The script renderes a canvas element on top of the editor.
4. Using the WebGPU API, the canvas is rendered with a custom shader.
