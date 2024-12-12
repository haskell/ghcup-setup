import { main } from "./main.ts"
import core from "@actions/core";

try {
  main({
    version: core.getInput("version"),
    release_channels: core.getMultilineInput("release-channels")
  })
} catch (error) {
  core.setFailed((error as Error).message);
}
