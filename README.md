# Vscode Cursor Animations

Adds fancy cursor/selection animations to your VSCode editor. It works by creating an overlay canvas which is being rendered to using WebGPU.

## Demo

![Demo](./demo/2025-04-09-181753.gif)

## Installation

1. Install the extension

```bash
   code --install-extension vscode-cursor-animations.vsix
```

2. The extension needs permissions to modify the vscode files.

- On Windows, run vscode as administrator.
- On Mac/Linux, you can run `sudo chown -R $(whoami) "$(which code)"`

3. Open the command palette (Ctrl+Shift+P or Cmd+Shift+P) and run `Toggle Cursor Animations` to enable the extension.

4. Reload the window according to the prompt.

## Tips

- To disable cursor blinking, set `"editor.cursorBlinking": "solid"` in your `settings.json`.

- The vscode cursor can be customized using the following settings:

```json
"workbench.colorCustomizations": {
    "editorCursor.background": "#ffffff7c",
    "editorCursor.foreground": "#ffffff7c",
    "editor.selectionBackground": "#ffffff7c"
}
```

## Configuration

Currently the following options are available to control the animations:

- `vsc-cursor-animations.velocity`: The speed of the animation in pixels per second. Default is `1.45`.
- `vsc-cursor-animations.opacity`: Opacity of the overlay. Default is `0.65`.
- `vsc-cursor-animations.backgroundImageUrl`: URL of a background image, which will be used as the background of the overlay. Default is `null`.
