# 🌐 TypeCell

Welcome to TypeCell! Let's reimagine how we can make it easier to understand, build and share knowledge.

## Running

Node.js is required to run this project. To download Node.js, visit [nodejs.org](https://nodejs.org/en/).

To run the project, open the command line in the project's root directory and enter the following commends:

    # Install all required npm modules, and bootstrap lerna packages
    npm install
    npm bootstrap

    # Initial build of all packages required by the main editor project
    npm run build

    # Start the editor project
    npm start

## Adding / updating packages

If you've modified any `package.json`, or pulled changes from git, use `npm run bootstrap` instead of `npm install` to install updated dependencies!

# Watch changes

    npm run watch

The above `npm start` executes the `react-scripts start` command of `packages/editor`. However, you might also be making changes to other packages in the `packages` directory. To continuously watch and compile for changes, open a terminal and run `npm run watch`.
