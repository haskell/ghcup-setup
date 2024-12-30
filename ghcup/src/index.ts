import { main, parseYAMLBoolean } from "./main.ts"
import core from "@actions/core";

try {
  main({
    version: core.getInput("version"),
    release_channels: core.getMultilineInput("release-channels"),
    stack_hook: parseYAMLBoolean("stack-hook", core.getInput("stack-hook")),
  })
} catch (error) {
  core.setFailed((error as Error).message);
}
