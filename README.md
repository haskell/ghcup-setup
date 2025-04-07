# GHCup action

A simple github action to install `ghcup` binary on any system and
add it to `PATH`.

## Usage

See [action.yml](action.yml)

### Minimal

```yml
on: [push]
name: build
jobs:
  runhaskell:
    name: Hello World
    runs-on: ubuntu-latest # or macOS-latest, or windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: haskell/ghcup-setup@v1
      - run: |
          ghcup install ghc --set latest
          runhaskell Hello.hs
```

### Matrix testing with prereleases

```yml
on: [push]
name: build
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        ghc: ['8.6.5', '8.8.4', 'latest-prerelease']
        cabal: ['2.4.1.0', '3.0.0.0']
        os: [ubuntu-latest, macOS-latest, windows-latest]
        exclude:
          - ghc: 8.8.4
            cabal: 2.4.1.0
    name: Haskell GHC ${{ matrix.ghc }} sample
    steps:
      - uses: actions/checkout@v4
      - uses: haskell/ghcup-setup@v1
        with:
          ghc: ${{ matrix.ghc }}
          cabal: ${{ matrix.cabal }}
          config: |
            # don't cache metadata files based on last access time
            meta-cache: 0
            # see https://github.com/haskell/ghcup-hs/blob/master/data/config.yaml
            # for full documentation
            url-source:
              - GHCupURL
              - prereleases
      - run: |
          runhaskell Hello.hs
```

## Inputs

| Name             | Description                                                     | Type       | Default    |
|------------------|-----------------------------------------------------------------|------------|------------|
| version          | GHCup version to install                                        | `string`   | `latest`   |
| ghc              | GHC version to install                                          | `string `  | `undefined`|
| cabal            | cabal-install version to install                                | `string `  | `undefined`|
| stack            | Stack version to install                                        | `string `  | `undefined`|
| hls              | HLS version to install                                          | `string `  | `undefined`|
| config           | Set ghcup config                                                | `string[]` | `{"meta-cache": 0 }`       |
| stack-hook       | Install the GHCup stack hook (GHCs are installed through ghcup) | `boolean`  | `false`    |

## Outputs

| Name     | Description                    | Type     |
|----------|--------------------------------|----------|
| path     | Path to the installed GHCup    | `string` |
| version  | Version of the installed GHCup | `string` |
| basedir  | Base directory of GHCup        | `string` |
| bindir   | Binary directory of GHCup      | `string` |
| cachedir | Cache directory of GHCup       | `string` |
| logsdir  | Log directory of GHCup         | `string` |
| confdir  | Config directory of GHCup      | `string` |
