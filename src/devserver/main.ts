import { AnimationController } from "../lib/gpu/controller";
import { getVscodeContext } from "./context";

await AnimationController.run(getVscodeContext());
