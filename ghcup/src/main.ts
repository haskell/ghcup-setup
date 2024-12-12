import * as path from 'path'
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
type GHCupOS = 'apple-darwin' | 'linux' | 'mingw64';

const ghcup_os_map: Map<Platform, GHCupOS> = new Map([
  ['darwin', 'apple-darwin'],
  ['linux', 'linux'],
  ['win32', 'mingw64']
]);

function ghcup_url(version: string, arch: GHCupArch, os: GHCupOS): string {
  if (version == 'latest') {
    return `https://downloads.haskell.org/ghcup/${arch}-${os}-ghcup${ext}`;
  } else {
    return `https://downloads.haskell.org/ghcup/${version}/${arch}-${os}-ghcup-${version}${ext}`;
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

    const os = ghcup_os_map.get(platform.platform);
    if (os == undefined) {
      throw `GHCup does not support platform ${platform.platform}`;
    }

    const url = ghcup_url(version, arch, os);

    const tempDirectory = process.env['RUNNER_TEMP'] || '';
    const ghcupExeName = `ghcup${ext}`;
    const dest = path.join(tempDirectory, ghcupExeName);

    const ghcupPath = await tc.downloadTool(url, dest);

    if (platform.isLinux || platform.isMacOS) {
      await chmod(ghcupPath, "0765");
    }

    const ghcupDir = await tc.cacheFile(ghcupPath, ghcupExeName, "ghcup", version);
    core.addPath(ghcupDir);
    return path.join(ghcupDir, ghcupExeName);
  }
}

export type Opts = {
  version: string,
  extra_release_channels: string[]
}

export async function main(opts: Opts) {
  const ghcupPath = await ghcup(opts.version);
  core.debug(`ghcup is at ${ghcupPath}`);

  var { stdout } = await exec.getExecOutput(ghcupPath, ["--numeric-version"]);
  const effective_version = stdout.trim();
  core.setOutput("version", effective_version);
  core.setOutput("path", ghcupPath)

  var { stdout } = await exec.getExecOutput(ghcupPath, ["whereis", "bindir"]);
  const bindir = stdout.trim();
  core.debug(`ghcup bindir is ${bindir}`)
  core.addPath(bindir);

  for (const channel in opts.extra_release_channels) {
    await exec.exec(ghcupPath, ['config', 'add-release-channel', channel]);
  }
}
