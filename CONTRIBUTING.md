# Development

TypeCell is a monorepo containing several packages.

## Directory structure:

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
│   └── util          - Generic helper functions
├── patches           - patch-package patches
└── test-util         - Data for unit tests
```

## Running locally

Node.js is required to run this project. To download Node.js, visit [nodejs.org](https://nodejs.org/en/).

To run the project, open the command line in the project's root directory and enter the following commands:

    # Install all required npm modules
    npm install

    # Initial build of all packages required by the main editor project
    npm run build

    # Start the local server
    npm run start:server

    # Start the main editor project
    npm start

The above `npm start` executes the `vite dev` command of `packages/editor` and watches for changes to this main package.

## Watch changes

    npm run watch

You might also be making changes to other packages in the `packages` directory. To continuously watch and compile for changes, open a new terminal and run `npm run watch`.

## Testing

The codebase is automatically tested using Vitest and Playwright. When submitting a PR or issue, ideally try to add a test case for it.
