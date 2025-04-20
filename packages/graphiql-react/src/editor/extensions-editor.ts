import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';
import { useEffect, useRef } from 'react';

import { useExecutionContext } from '../execution';
import {
  commonKeys,
  DEFAULT_EDITOR_THEME,
  DEFAULT_KEY_MAP,
  importCodeMirror,
} from './common';
import { useEditorContext } from './context';
import {
  useChangeHandler,
  useCompletion,
  useKeyMap,
  useMergeQuery,
  usePrettifyEditors,
  useSynchronizeOption,
} from './hooks';
import { CodeMirrorType, WriteableEditorProps } from './types';

export type UseExtensionsEditorArgs = WriteableEditorProps & {
  /**
   * Invoked when a reference to the GraphQL schema (type or field) is clicked
   * as part of the editor or one of its tooltips.
   * @param reference The reference that has been clicked.
   */
  onClickReference?(reference: SchemaReference): void;
  /**
   * Invoked when the contents of the extensions editor change.
   * @param value The new contents of the editor.
   */
  onEdit?(value: string): void;
};

// To make react-compiler happy, otherwise complains about using dynamic imports in Component
function importCodeMirrorImports() {
  // We need to use dynamic imports for code splitting
  const imports = [
    import('codemirror/mode/javascript/javascript.js' as any),
    import('codemirror/addon/lint/json-lint.js' as any),
    import('codemirror/addon/edit/matchbrackets.js' as any),
  ];
  return importCodeMirror(imports);
}

// To make react-compiler happy, otherwise complains about - Hooks may not be referenced as normal values
const _useExtensionsEditor = useExtensionsEditor;

export function useExtensionsEditor(
  {
    editorTheme = DEFAULT_EDITOR_THEME,
    keyMap = DEFAULT_KEY_MAP,
    onClickReference,
    onEdit,
    readOnly = false,
  }: UseExtensionsEditorArgs = {},
  caller?: Function,
) {
  const { initialExtensions, extensionsEditor, setExtensionsEditor } =
    useEditorContext({
      nonNull: true,
      caller: caller || _useExtensionsEditor,
    });
  const executionContext = useExecutionContext();
  const merge = useMergeQuery({ caller: caller || _useExtensionsEditor });
  const prettify = usePrettifyEditors({
    caller: caller || _useExtensionsEditor,
  });
  const ref = useRef<HTMLDivElement>(null);
  const codeMirrorRef = useRef<CodeMirrorType>();

  useEffect(() => {
    let isActive = true;

    void importCodeMirrorImports().then(CodeMirror => {
      // Don't continue if the effect has already been cleaned up
      if (!isActive) {
        return;
      }

      codeMirrorRef.current = CodeMirror;

      const container = ref.current;
      if (!container) {
        return;
      }

      const newEditor = CodeMirror(container, {
        value: initialExtensions,
        lineNumbers: true,
        tabSize: 2,
        mode: { name: 'javascript', json: true },
        theme: editorTheme,
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        readOnly: readOnly ? 'nocursor' : false,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        extraKeys: commonKeys,
      });

      newEditor.on('keyup', (editorInstance, event) => {
        const { code, key, shiftKey } = event;
        const isLetter = code.startsWith('Key');
        const isNumber = !shiftKey && code.startsWith('Digit');
        if (isLetter || isNumber || key === '_' || key === '"') {
          editorInstance.execCommand('autocomplete');
        }
      });

      setExtensionsEditor(newEditor);
    });

    return () => {
      isActive = false;
    };
  }, [editorTheme, initialExtensions, readOnly, setExtensionsEditor]);

  useSynchronizeOption(extensionsEditor, 'keyMap', keyMap);

  useChangeHandler(
    extensionsEditor,
    onEdit,
    STORAGE_KEY,
    'extensions',
    _useExtensionsEditor,
  );

  useCompletion(
    extensionsEditor,
    onClickReference || null,
    _useExtensionsEditor,
  );

  useKeyMap(
    extensionsEditor,
    ['Cmd-Enter', 'Ctrl-Enter'],
    executionContext?.run,
  );
  useKeyMap(extensionsEditor, ['Shift-Ctrl-P'], prettify);
  useKeyMap(extensionsEditor, ['Shift-Ctrl-M'], merge);

  return ref;
}

export const STORAGE_KEY = 'extensions';
