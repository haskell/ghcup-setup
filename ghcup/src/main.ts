import * as path from 'path';
import * as fs from 'fs';
import os from 'os';
import { chmod } from 'fs/promises';

import tc from '@actions/tool-cache';
import core, { platform } from '@actions/core';
import exec from '@actions/exec';

const ext = platform.isWindows ? ".exe" : "";

type Architecture = typeof platform.arch;
type GHCupArch = 'aarch64' | 'armv7' | 'i386' | 'x86_64';

const ghcup_arch_map: Map<Architecture, GHCupArch> = new Map([
  ['arm64', 'aarch64'],
  ['arm', 'armv7'],
  ['ia32', 'i386'],
  ['x64', 'x86_64']
]);

type Platform = typeof platform.platform;
type GHCupOS = 'apple-darwin' | 'linux' | 'mingw64' | 'portbld-freebsd';

const ghcup_os_map: Map<Platform, GHCupOS> = new Map([
  ['darwin', 'apple-darwin'],
  ['linux', 'linux'],
  ['win32', 'mingw64'],
  ['freebsd', 'portbld-freebsd']
]);

const hook_url: string = 'https://www.haskell.org/ghcup/sh/hooks/stack/ghc-install.sh';

function ghcup_url(version: string, arch: GHCupArch, gos: GHCupOS): string {
  if (version == 'latest') {
    return `https://downloads.haskell.org/ghcup/${arch}-${gos}-ghcup${ext}`;
  } else {
    return `https://downloads.haskell.org/ghcup/${version}/${arch}-${gos}-ghcup-${version}${ext}`;
  }
}

async function ghcup(version: string) {
  const ghcupDirectory = tc.find('ghcup', version)
  if (ghcupDirectory) {
    return ghcupDirectory
  } else {

    const arch = ghcup_arch_map.get(platform.arch);
    if (arch == undefined) {
      throw `GHCup does not support architecture ${platform.arch}`;
    }

    const gos = ghcup_os_map.get(platform.platform);
    if (gos == undefined) {
      throw `GHCup does not support platform ${platform.platform}`;
    }

    const url = ghcup_url(version, arch, gos);

    const tempDirectory = process.env['RUNNER_TEMP'] || '';
    const ghcupExeName = `ghcup${ext}`;
    const dest = path.join(tempDirectory, ghcupExeName);

    const ghcupPath = await tc.downloadTool(url, dest);

    if (!(platform.isWindows)) {
      await chmod(ghcupPath, "0765");
    }

    const ghcupDir = await tc.cacheFile(ghcupPath, ghcupExeName, "ghcup", version);
    core.addPath(ghcupDir);
    return path.join(ghcupDir, ghcupExeName);
  }
}

function getStackRoot() {
  const stackXdg = process.env['STACK_XDG'];

  const defaultStackRoot = (() => { if (platform.isWindows) {
	const appdata = process.env['APPDATA'] || '';
    return stackXdg ? path.join(process.env['XDG_DATA_HOME'] ?? appdata, 'stack') : path.join(appdata, 'stack');
  } else {
	const hdir = os.homedir();
    return stackXdg ? path.join(process.env['XDG_DATA_HOME'] ?? path.join(hdir, '.local', 'share'),'stack') : path.join(hdir, '.stack');
  }
  })()
    return process.env['STACK_ROOT'] ?? defaultStackRoot;
}

async function installStackHook() {
  const stack_root = getStackRoot();
  const hook_dest = path.join(stack_root, 'hooks', 'ghc-install.sh')
  fs.rmSync(hook_dest, {
    force: true,
  });
  // we do not cache, it isn't versioned
  const hookPath = await tc.downloadTool(hook_url, hook_dest);
  if (!(platform.isWindows)) {
    await chmod(hook_dest, "0765");
  }
  core.debug(`stack ghcup hook is at ${hookPath}`);
}

export function parseYAMLBoolean(name: string, val: string): boolean {
  const trueValue = ['true', 'True', 'TRUE'];
  const falseValue = ['false', 'False', 'FALSE'];
  if (trueValue.includes(val)) return true;
  if (falseValue.includes(val)) return false;
  throw new TypeError(
    `Action input "${name}" does not meet YAML 1.2 "Core Schema" specification: \n` +
      `Supported boolean values: \`true | True | TRUE | false | False | FALSE\``
  );
}

export type Opts = {
  version: string,
  release_channels: string[],
  stack_hook: boolean
}

export async function main(opts: Opts) {
  const ghcupPath = await ghcup(opts.version);
  core.debug(`ghcup is at ${ghcupPath}`);

  var { stdout } = await exec.getExecOutput(ghcupPath, ["--numeric-version"]);
  const effective_version = stdout.trim();
  core.setOutput("version", effective_version);
  core.setOutput("path", ghcupPath);

  var { stdout } = await exec.getExecOutput(ghcupPath, ["whereis", "bindir"]);
  const bindir = stdout.trim();
  core.debug(`ghcup bindir is ${bindir}`);
  core.addPath(bindir);

  if (platform.isWindows) {
	  const ghcup_msys2 = process.env['GHCUP_MSYS2'] ?? 'C:\\msys64';
	  core.exportVariable('GHCUP_MSYS2', ghcup_msys2);
      core.debug(`GHCUP_MSYS2 is ${ghcup_msys2}`);
  }

  if (opts.stack_hook) {
	  installStackHook()
  }

  await exec.exec(ghcupPath, [
    'config', 'set', 'url-source', JSON.stringify(opts.release_channels)
  ]);
}

