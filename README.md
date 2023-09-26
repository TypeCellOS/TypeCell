<p align="center">
  <a href="https://www.typecell.org">
    <img alt="TypeCell" src="./packages/editor/src/assets/logo_with_text.svg?raw=true" width="300" />
  </a>
</p>

<p align="center">
Welcome to TypeCell, where Notion meets Jupyter Notebooks - all open source. TypeCell is a fresh take on what documents and software can look like. Together, we want to make it a lot easier to build software, and ultimately to understand, build and share knowledge.
</p>

<p align="center">
<a href="https://discord.gg/aDQxXezfNj"><img alt="Discord" src="https://img.shields.io/badge/Chat on discord%20-%237289DA.svg?&style=for-the-badge&logo=discord&logoColor=white"/></a>
</p>

<p align="center">
  <a href="https://www.typecell.org">
    <img alt="TypeCell demo" src="./packages/editor/src/app/main/components/startscreen/assets/intro.gif?raw=true" width="600" />
  </a>
</p>

# Features

- Open Source Notion-style workspaces and documents (powered by [BlockNote](https://www.blocknotejs.org))
- [Local-First](https://www.inkandswitch.com/local-first/) architecture built using [Yjs](https://github.com/yjs/yjs), with support for live multi-user collaboration
- Code Blocks for a live, as-you-type coding experience enabling [End-User Programming](https://www.inkandswitch.com/end-user-programming/)
- Same, powerful editing experience as VS Code
- Full TypeScript and React support! (no weird custom language constructs)
- The Reactive Runtime makes sure code blocks automatically re-evaluate when their dependencies update ([learn more](https://www.typecell.org/docs/manual/3.%20Reactive%20variables.md))
- Import NPM packages + types just by writing a regular `import` statement

» [Create your free workspace to get started!](https://www.typecell.org/)

# Documentation 📖

Read the docs and complete the interactive tutorial to get familiar with TypeCell:

» [Check out the docs and Live Coding Tutorial](https://www.typecell.org/docs/)

# Feedback 🙋‍♂️🙋‍♀️

We'd love to hear your thoughts and see your experiments, so [come and say hi on Discord](https://discord.gg/TcJ9TRC3SV).

# Contributing 🙌

See [CONTRIBUTING.md](CONTRIBUTING.md) for more info and guidance on how to run the project (TLDR: just use `npm start`).

TypeCell is organised as a monorepo containing several packages. Directory structure:

```
typecell
├── packages
│   ├── editor        - The main React application
│   ├── engine        - The live-code execution engine and Reactive Runtime
│   ├── frame         - sandboxed iframe where end-user code evaluates
│   ├── packager      - Tool to bundle TypeCell notebook apps (WIP)
│   ├── parsers       - Helpers to convert to / from TypeCell documents
│   ├── server        - HocusPocus + Supabase server for storing documents
│   ├── shared        - TypeCell specific models shared across the codebase
│   ├── shared-test   - Helper functions shared across the codebase for unit tests
│   ├── util          - Generic helper functions
│   └── y-penpal      - yjs transport for crossdomain / crossframe communication
├── patches           - patch-package patches
└── test-util         - Data for unit tests
```

The codebase is automatically tested using Vitest and Playwright.

# Credits ❤️

We build on top of some really great technologies:

- [Monaco](https://github.com/microsoft/monaco-editor): the open source editor that also powers VS Code
- [Yjs](https://github.com/yjs/yjs): CRDT for multi-user collaboration
- [MobX](https://mobx.js.org/): for our Reactive Runtime
- [ESM.sh](https://www.esm.sh/): for dynamic ESM imports from NPM
- [Typescript](https://www.typescriptlang.org/): for our compiler and language toolkit

TypeCell is proudly sponsored by the renowned [NLNet foundation](https://nlnet.nl/foundation/) who are on a mission to support an open internet, and protect the privacy and security of internet users. Check them out!

<a href="https://nlnet.nl"><img src="https://nlnet.nl/image/logos/NGIAssure_tag.svg" alt="NLNet" width="100"></a>
