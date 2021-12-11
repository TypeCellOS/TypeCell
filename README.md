![TypeCell Logo](./packages/editor/public/assets/logo_with_text.svg?raw=true)

Welcome to TypeCell! Let's reimagine how we can make it easier to understand, build and share knowledge.

## Running

Node.js is required to run this project. To download Node.js, visit [nodejs.org](https://nodejs.org/en/).

To run the project, open the command line in the project's root directory and enter the following commends:

    # Install all required npm modules for lerna, and bootstrap lerna packages
    npm run install-lerna
    npm run bootstrap

    # Initial build of all packages required by the main editor project
    npm run build

    # Start the editor project
    npm start

## Adding / updating packages

If you've modified any `package.json`, or pulled changes from git, use `npm run bootstrap` instead of `npm install` to install updated dependencies!

# Development

We use [Lerna](https://lerna.js.org/) to manage the monorepo with separate packages. In VS Code, it's best to open `typecell.code-workspace` to open the project as a workspace.

## Watch changes

    npm run watch

The above `npm start` executes the `react-scripts start` command of `packages/editor` and watches for changes to this main package. However, you might also be making changes to other packages in the `packages` directory. To continuously watch and compile for changes, open a new terminal and run `npm run watch`.
