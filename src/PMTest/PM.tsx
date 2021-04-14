import React from 'react';

import '../App.css';
import { EditorContent, useEditor } from '@tiptap/react';
import { defaultExtensions } from '@tiptap/starter-kit';
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import TCDocument from '../store/TCDocument';
import TypeCellNode from './TypeCellNode';

const ydoc = new Y.Doc()
const provider = new WebrtcProvider('example-document', ydoc)

// const provider2 = new WebrtcProvider('example-document2', ydoc)

const docRoot = ydoc.getXmlFragment("cells");

ydoc.on('update', (update: any) => {
  // Y.applyUpdate(doc2, update)
  console.log(ydoc.toJSON())
})

function App() {

  const editor = useEditor({
    onViewUpdate: ({ editor }) => {
      console.log(editor.getJSON())
    },
    extensions: [...defaultExtensions(),


    CollaborationCursor.configure({
      provider: provider,
      user: { name: 'Cyndi Lauper', color: '#f783ac' },

    }),
    Collaboration.configure({
      fragment: docRoot,
    }),
      TypeCellNode
    ],
    content: '<p>Hello World! 🌎️</p><react-component></react-component>',
  })


  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default App;
// (window as any).x = new TCDocument("test", "document");