import { main } from "./main.ts";
import core from "@actions/core";
import YAML from "yaml";

try {
  main({
    version: core.getInput("version"),
    release_channels: core.getMultilineInput("release-channels"),
    stack_hook: core.getBooleanInput("stack-hook"),
    ghc: core.getInput("ghc"),
    cabal: core.getInput("cabal"),
    stack: core.getInput("stack"),
    hls: core.getInput("hls"),
    config: core.getInput("config")
      ? (YAML.parse(core.getInput("config")) ??
        JSON.parse(core.getInput("config")))
      : undefined,
  });
} catch (error) {
  core.setFailed((error as Error).message);
}
