import { main } from "./main.ts";
import core from "@actions/core";

try {
  main({
    version: core.getInput("version"),
    release_channels: core.getMultilineInput("release-channels"),
    stack_hook: core.getBooleanInput("stack-hook"),
    ghc: core.getInput("ghc"),
    cabal: core.getInput("cabal"),
    stack: core.getInput("stack"),
    hls: core.getInput("hls"),
  });
} catch (error) {
  core.setFailed((error as Error).message);
}
