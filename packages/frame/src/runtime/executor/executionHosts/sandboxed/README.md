# Iframe sandbox architecture

The actual end-user code that users can enter in TypeCell code cells, gets executed in an iframe that runs on a different domain.

## Why?

End-user code should not be able to access the TypeCell application javascript. Otherwise, it could delete / create / modify Notebooks by the user without the user's permission. Or for example, steal authentication cookies and send them to a third party using `fetch`.

## Architecture

`NotebookRenderer` calls `SandboxedExecutionHost.renderContainer()`. This creates an Iframe where the end-user code is evaluated and the outputs are rendered.

`NotebookRenderer` calls `SandboxedExecutionHost.renderOutput()` whereever the output of cells should be rendered. `SandboxedExecutionHost` renders a so-called `OutputShadow` div in the location. This div is used for two reasons:

- We keep track of it's location (x,y position), so that in the Iframe, we know at which location we need to render the cell output
- We update its dimensions with the actual dimensions of the output. This is done so that the rest of the document flows accordingly (i.e.: other cells / content below the cell are moved down when the output gets larger).

## Bridge

We use PostMessage communication to communicate between the Host and the Iframe. This is done using the [Penpal](https://github.com/Aaronius/penpal) library.

The interfaces are:

- [IframeBridgeMethods](./iframesandbox/IframeBridgeMethods.ts): methods the host can call on the iframe
- [HostBridgeMethods](./HostBridgeMethods.ts): methods the iframe can call on the host

The main data that's being communicated across the bridge:

- The host sends javascript code of the code cells (code models) to the iframe
- The host sends the position of code cell outputs (OutputShadow (x, y) positions) to the iframe
- The iframe sends dimensions of rendered output to the host (so that it can change the dimensions of OutputShadow)
- When the user mouse-outs an Output, the iframe sends a mouseleave event to the host. The host then re-acquires mouse pointer events by setting pointerEvents:none on the iframe.

## Files

- [iframesandbox](./iframesandbox) directory contains the files that are used in the iframe

## Modules

An extra complexity is when client code imports a TypeCell module (e.g.: `import * as nb from "@user/notebook"`). The iframe signals this required module import to the Host, upon which the host starts watching and compiling the notebook. It then sends the compiled javascript code back to the iframe across the bridge.
