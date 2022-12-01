# Development

TypeCell is a monorepo containing several packages. In VS Code, it's best to open `typecell.code-workspace` to open the project as a workspace.

## Directory structure:

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

## Running locally

Node.js is required to run this project. To download Node.js, visit [nodejs.org](https://nodejs.org/en/).

To run the project, open the command line in the project's root directory and enter the following commands:

    # Install all required npm modules for lerna, and bootstrap lerna packages
    npm install

    # Initial build of all packages required by the main editor project
    npm run build

    # Start the main editor project
    npm start

The above `npm start` executes the `vite dev` command of `packages/editor` and watches for changes to this main package.

## Watch changes

    npm run watch

You might also be making changes to other packages in the `packages` directory. To continuously watch and compile for changes, open a new terminal and run `npm run watch`.

## Testing

The codebase is automatically tested using Vitest and Playwright. When submitting a PR or issue, ideally try to add a test case for it.
