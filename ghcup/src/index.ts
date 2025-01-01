import { main, getInputAsBool } from "./main.ts";
import core from "@actions/core";

try {
  main({
    version: core.getInput("version"),
    release_channels: core.getMultilineInput("release-channels"),
    stack_hook: getInputAsBool("stack-hook"),
  });
} catch (error) {
  core.setFailed((error as Error).message);
}
