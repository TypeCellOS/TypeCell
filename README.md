<p align="center">
  <a href="https://www.typecell.org">
    <img alt="TypeCell" src="./packages/editor/src/assets/logo_with_text.svg?raw=true" width="300" />
  </a>
</p>

<p align="center">
Welcome to TypeCell! An open source live programming environment. Together, we want to make it a lot easier to build software, and ultimately to understand, build and share knowledge.
</p>

<p align="center">
<a href="https://discord.gg/aDQxXezfNj"><img alt="Discord" src="https://img.shields.io/badge/Chat on discord%20-%237289DA.svg?&style=for-the-badge&logo=discord&logoColor=white"/></a> <a href="https://matrix.to/#/#typecell-space:matrix.org"><img alt="Matrix" src="https://img.shields.io/badge/Chat on matrix%20-%23000.svg?&style=for-the-badge&logo=matrix&logoColor=white"/></a>
</p>

<p align="center">
  <a href="https://www.typecell.org">
    <img alt="TypeCell demo" src="./packages/editor/src/app/main/components/startscreen/assets/intro.gif?raw=true" width="600" />
  </a>
</p>

# Features

- Open Source, cell-based notebook environment
- Same, powerful editing experience as VS Code
- Full TypeScript support! (no weird custom language constructs)
- Reactive Runtime, cells automatically re-evaluate when their dependencies update ([learn more](https://www.typecell.org/docs/manual/3.%20Reactive%20variables.md))
- Import NPM packages + types just by writing an `import` statement
- Support for real-time collaboration (using [Yjs](https://github.com/yjs/yjs))
- Runs on top of [Matrix](https://www.matrix.org) using [Matrix-CRDT](https://github.com/yousefed/matrix-crdt).

[Try the Tutorial to get started!](https://www.typecell.org/docs/interactive-introduction.md)

# Documentation 📖

## Tutorial

Complete the tutorial to get familiar with TypeCell:

» [Interactive introduction](https://www.typecell.org/docs/interactive-introduction.md)

## Manual

We've written about the main functionality of TypeCell in the [manual](https://www.typecell.org/docs/manual):

- [Notebooks and cells](https://www.typecell.org/docs/manual/1.%20Notebooks%20and%20cells.md)
- [TypeScript and exports](https://www.typecell.org/docs/manual/2.%20TypeScript%20and%20exports.md)
- [Reactive variables](https://www.typecell.org/docs/manual/3.%20Reactive%20variables.md)
- [Working with user input](https://www.typecell.org/docs/manual/4.%20Inputs.md)
- [Imports & NPM](https://www.typecell.org/docs/manual/5.%20Imports%20and%20NPM.md)
- [Collaboration](https://www.typecell.org/docs/manual/6.%20Collaboration.md)

## Demos

Another good way to learn is to check out some notebooks from our community:

» [View demo notebooks](/docs/demos.md)

# Feedback 🙋‍♂️🙋‍♀️

We'd love to hear your thoughts and see your experiments, so [come and say hi on Discord](https://discord.gg/TcJ9TRC3SV) or [Matrix](https://matrix.to/#/#typecell-space:matrix.org).

# Contributing 🙌

See [CONTRIBUTING.md](CONTRIBUTING.md) for more info and guidance on how to run the project (TLDR: just use `npm start`).

TypeCell is organised as a monorepo containing several packages. Directory structure:

```
typecell
├── packages
│   ├── common          - Utility functions shared across the codebase
│   ├── editor          - The main React application
│   ├── engine          - The live-code execution engine
│   ├── packager        - Tool to bundle TypeCell notebook apps (WIP)
│   └── parsers         - Helpers to convert to / from TypeCell notebooks
├── patches             - patch-package patches
└── test-util           - Server and data for unit tests
```

The codebase is automatically tested using Vitest and Playwright.

# Credits ❤️

We build on top of some really great technologies:

- [Monaco](https://github.com/microsoft/monaco-editor): the open source editor that also powers VS Code
- [Yjs](https://github.com/yjs/yjs): CRDT for multi-user collaboration
- [MobX](https://mobx.js.org/): for our Reactive Runtime
- [Matrix](https://www.matrix.org): the backend of TypeCell.org is a single Matrix instance, using [Matrix-CRDT](https://github.com/yousefed/matrix-crdt) to store and collaborate on "documents as chat rooms"
- [ESM.sh](https://www.esm.sh/): for dynamic ESM imports from NPM
- [Typescript](https://www.typescriptlang.org/): for our compiler and language toolkit

TypeCell is proudly sponsored by the renowned [NLNet foundation](https://nlnet.nl/foundation/) who are on a mission to support an open internet, and protect the privacy and security of internet users. Check them out!

<a href="https://nlnet.nl"><img src="https://nlnet.nl/image/logos/NGIAssure_tag.svg" alt="NLNet" width="100"></a>
