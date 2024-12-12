import { main } from "./main.ts"
import core from "@actions/core";

try {
  main({
    version: core.getInput("version"),
    extra_release_channels: core.getMultilineInput("extra-release-channels")
  })
} catch (error) {
  core.setFailed((error as Error).message);
}
