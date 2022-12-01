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

## Contributing 🙌

See [CONTRIBUTING.md](CONTRIBUTING.md).

TypeCell is organised as a monorepo containing several packages. Directory structure:

```
blocknote
├── docs                - Docs / samples (see https://www.typecell.org/docs/)
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

TypeCell is proudly sponsored by the renowned [NLNet foundation](https://nlnet.nl/foundation/) who are on a mission to support an open internet, and protect the privacy and security of internet users. Check them out!

<a href="https://nlnet.nl"><img src="https://nlnet.nl/image/logos/NGIAssure_tag.svg" alt="NLNet" width="100"></a>
