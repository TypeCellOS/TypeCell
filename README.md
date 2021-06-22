# 🌐 TypeCell

Welcome to TypeCell! Let's reimagine how we can make it easier to understand, build and share knowledge.

## Getting started
Node.js is required to run this project. To download Node.js, visit [nodejs.org](https://nodejs.org/en/).

To run the project, open the command line in the project's root directory and enter the following commends:

    npm install
    npm start

## Rich-text editor file structure
The TypeCell editor is built using [TipTap](https://www.tiptap.dev/), a WYSIWYG rich-text editor library, which in turn
is built on [ProseMirror](https://prosemirror.net/), another rich-text editor library. All files which extend the functionality of the editor can be 
found under the `src/documentRenderers/richtext/` directory.

Directories are referenced using their relative paths, with the root directory being `src/documentRenderers/`. This 
means that, for example, `src/documentRenderers/richtext/` is referred to as just `richtext/`.

###richtext/
All files found within the core `richtext/` directory are necessary for the rich-text editor to be rendered and provide
basic functionality, i.e., allow the user to write text. The only files in this directory are `RichTextRenderer.tsx`
and its corresponding `RichTextRenderer.css` style sheet, used for styling the editor.

`RichTextRenderer.tsx` is a fairly simple file, yet it has an important purpose. Firstly, it initializes the TipTap
editor instance in which the user can write text. It also loads extensions for it that were either created by the
team or come standard with TipTap. Finally, RichTextRenderer.tsx renders said editor. It is important to
note, however, that this file does not contain logic for any features of the editor that go beyond writing text.
This is contained within the sub-directories of `richtext/`.

###richtext/extensions/
Each folder in the `richtext/extensions/` directory has an extension which is used to implement a single,
specific feature, and most can be loaded by any TipTap editor instance while still functioning independently.
The directories that are found below.

`/extensions/autoid` is an extension which assigns a unique ID to each block in the editor. Each time a change
is made to the document, the plugin searches for any blocks that have a null ID and assigns them a unique
new one. The purpose of this is to be able to delete/duplicate/etc. specific blocks based on their IDs, or to
track changes made to them over time.

`/extensions/blocktypes` changes the underlying structure of each TipTap node type into what is considered
a block. This simply means that a React component is added to each node, which includes a drag handle
on the side that also triggers a menu on-click. As well as this, the directory contains all styling
information for blocks, and the logic for drag/drop which is implemented using the [ReactDnD library](https://react-dnd.github.io/react-dnd/about).

`/extensions/comments` provides the user the ability to add a comment/annotation to any piece of text. This
is done using custom TipTap marks which are given unique IDs that correspond to a comment with the same
ID. This feature is one of few that do not work in isolation, as the button used to create a comment is contained
in the inline menu.

`/extensions/marks` is used to store various custom marks which can either be employed by the user or by
other extensions, such as the comments extension.

`/extensions/mentions` creates a custom "mention" node type which is inline and can refer to given user.
Writing an "@" character prompts the user with a list of people they can mention.

`/extensions/slashcommand` contains all logic regarding the menu that is triggered upon writing the "/" (slash)
character. This menu allows the user to change the type of the currently selected block or create a new one
with the specified type. The types of blocks that can be created include paragraphs, headings, lists, and many
more.

`/extensions/table` holds all code necessary for the user to create and edit tables within the editor. Tables have
their own, separate inline menu with different functions that are specific to tables such as inserting/removing
rows and columns. This is also a feature that is somewhat reliant on another, as tables may only be created
via the slash menu.

`/extensions/trailingnode` is an extension that is simply used for ensuring that there is a blank paragraph
at the end of each document. The purpose of this extension is to make navigating the document slightly more
intuitive when using the mouse.

`/extensions/typecellnode` is arguably the most complex extension that TypeCell uses. This is where the
work of the client (which makes TypeCell a unique project), fuses with our work on the rich-text editor. The
extension creates a custom TipTap node type in which the user can not only write code, but execute it in
real-time. Much of the code base that the client had set-up prior to our involvement in the project is for this
real-time code execution, however this is outside of the scope of our project.

###richtext/menus/
The `richtext/menus/` directory stores code for the rendering of various menus that can be accessed from within
the editor. There are 3 different menus that a user can access inside the editor, and descriptions of these are
found below.

**Inline Menu** \
The inline menu is used to apply different marks to text such as bold or italic, and to add comments. It appears
when a piece of text is highlighted. The logic for this menu is relatively straightforward, as TipTap has both
commands to set/toggle marks as standard, and an extension to create and render the menu.

**Side Menu** \
The side menu currently allows users to delete a block, but actions such as hiding, duplicating or changing
block background could be implemented as well. This menu appears when clicking the drag handle next to a
block. It differs from the inline menu as it lists actions that affect the entire block, rather than a selection of
text inside it. The side menu also differs from the inline menu as it uses a custom implementation of [Tippy.js](https://atomiks.github.io/tippyjs/)
instead of using it from TipTap.

**Table Menu** \
The table menu is used for editing the cells of tables in a document. It can only be accessed by clicking within a
table and functions in much the same way as the inline menu. However, instead of text styling options, the table
menu allows the user to manipulate cells, namely adding/removing adjacent rows/columns and adding/removing
selected rows/columns. Like the inline menu, the table menu uses default TipTap extensions and commands
for rendering and logic.

###richtext/prosemirrorPlugins/
The `richtext/prosemirrorPlugins/` directory holds pure ProseMirror plugins. To understand what this
means, this subsection will also discuss the differences in how TipTap and ProseMirror extend their editor’s
functionalities.

TipTap extensions work in such a way, that basic functionality of the editor is very easy to change. However,
TipTap itself isn’t powerful enough for us to be able to implement all the features outlined in the requirements.
Therefore, more complex extensions are created using ProseMirror. ProseMirror plugins are similar to TipTap
extensions but are much more powerful at the expense of being more complex. It is possible to create a ProseMirror plugin within a TipTap extension, or create a ProseMirror plugin without using TipTap at all. Most of
the features implemented by the team use the former approach, with the only downside to this being they can
only be used in a TipTap editor, while the latter approach creates plugins that may be used in both bare-bones
ProseMirror editors and TipTap editors.

The `richtext/prosemirrorPlugins/` directory makes this distinction clear as it contains ProseMirror plugins,
while features in `richtext/extensions/` are built using TipTap extensions, often with ProseMirror plugins
within them. The only feature in this directory is the suggestions plugin. This is used to create a drop-down
menu when certain characters are input inside the editor. It is used by the slash commands and mentions
extensions, allowing the user to see the various options and select one. The reason that this feature isn’t in the
`richtext/menus/` directory is because the logic behind it is quite extensive and goes beyond just rendering the
drop-down menu and handling what the buttons do.

###richtext/utils/
The final directory within `richtext/` is `richtext/util/`, and it is also the least important. Found here are
files containing miscellaneous functions which may be useful for a variety of features. These functions are very
general and only two currently exist - one for checking if a TipTap node is a list, and the other for ensuring
compatibility with React. Despite not having much content, it is still useful to have this directory as it helps
prevent code duplication across extensions