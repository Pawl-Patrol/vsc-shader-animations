import { VscodeContext } from "../lib/types";
import { Bridge } from "./bridge";
import { Editor } from "./editor";

export function getVscodeContext(): VscodeContext {
  return {
    editor: new Editor(),
    bridge: new Bridge(),
  };
}
