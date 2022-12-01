# Development

We use [Lerna](https://lerna.js.org/) to manage the monorepo with separate packages. In VS Code, it's best to open `typecell.code-workspace` to open the project as a workspace.

## Running

Node.js is required to run this project. To download Node.js, visit [nodejs.org](https://nodejs.org/en/).

To run the project, open the command line in the project's root directory and enter the following commands:

    # Install all required npm modules for lerna, and bootstrap lerna packages
    npm install

    # Initial build of all packages required by the main editor project
    npm run build

    # Start the main editor project
    npm start

## Watch changes

    npm run watch

The above `npm start` executes the `vite dev` command of `packages/editor` and watches for changes to this main package. However, you might also be making changes to other packages in the `packages` directory. To continuously watch and compile for changes, open a new terminal and run `npm run watch`.
