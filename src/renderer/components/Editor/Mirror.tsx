import { countColumn, Editor as CMEditor, EditorChange } from 'codemirror';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/search/search';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/mode/overlay';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/mode/yaml-frontmatter/yaml-frontmatter';
import 'codemirror/addon/edit/continuelist';
import { Controlled as CodeMirror } from 'react-codemirror2';

import './Mirror.css';
import { AppStateProps } from 'renderer/state/reducer';

const codeMirrorOptions = {
  mode: {
    name: 'yaml-frontmatter',
    base: 'markdown',
  },
  theme: 'paper',
  indentUnit: 4,
  tabSize: 4,
  lineNumbers: false,
  lineWrapping: true,
  autofocus: true,
  extraKeys: {
    Enter: 'newlineAndIndentContinueMarkdownList',
    Tab: 'indentMore',
    'Shift-Tab': 'indentLess',
  },
};

const onEditorDidMount = (editor: CMEditor) => {
  editor.focus();

  // adapted from https://codemirror.net/demo/indentwrap.html
  const charWidth = editor.defaultCharWidth();
  const basePadding = 4;
  // matches markdown list `-`, `+`, `*`, `1.`, `1)` and blockquote `>` markers:
  // eslint-disable-next-line no-useless-escape
  const listRe = /^(([-|\+|\*|\>]|\d+[\.|\)])\s+)(.*)/;

  editor.on('renderLine', (cm, line, elt) => {
    const txt = line.text;
    const matches = txt.trim().match(listRe);
    if (matches && matches[1]) {
      const extraIndent = matches[1].length;
      const columnCount = countColumn(txt, null, cm.getOption('tabSize') || 4);
      const off = (columnCount + extraIndent) * charWidth;
      elt.style.textIndent = `-${off}px`;
      elt.style.paddingLeft = `${basePadding + off}px`;
    }
  });
  editor.refresh();

  window.ipcAPI?.on.find(() => editor.execCommand('findPersistent'));
  window.ipcAPI?.on.findNext(() => editor.execCommand('findPersistentNext'));
  window.ipcAPI?.on.findPrevious(() =>
    editor.execCommand('findPersistentPrev')
  );

  const replaceSelection = (fn: (s: string) => string) =>
    editor.replaceSelection(fn(editor.getSelection()));

  window.ipcAPI?.on.addBold(() =>
    replaceSelection((s) => ['**', s, '**'].join(''))
  );
  window.ipcAPI?.on.addItalic(() =>
    replaceSelection((s) => ['_', s, '_'].join(''))
  );
  window.ipcAPI?.on.addStrikethrough(() =>
    replaceSelection((s) => ['~~', s, '~~'].join(''))
  );
};

const Mirror = (props: AppStateProps) => {
  const { state, dispatch } = props;

  const onPaste = (ed: CMEditor) => {
    window.ipcAPI?.pasteImageToAssets(state.dir).then((filePath: string) => {
      if (filePath.includes('assets')) {
        const text = `![image](${filePath})`;
        const { anchor, head } = ed.listSelections()[0];
        ed.setSelection(anchor, head);
        ed.replaceSelection(text);
        ed.refresh();
        dispatch({ type: 'updateMd', md: ed.getValue() });
      }
      return null;
    });
  };

  const onBeforeChange = (_ed: CMEditor, _ec: EditorChange, md: string) => {
    dispatch({ type: 'updateMd', md });
  };

  return (
    <CodeMirror
      onBeforeChange={onBeforeChange}
      editorDidMount={onEditorDidMount}
      onPaste={onPaste}
      value={state.doc.md}
      autoCursor
      options={codeMirrorOptions}
    />
  );
};

export default Mirror;
