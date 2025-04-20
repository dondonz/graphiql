import React from 'react';
import type { SchemaReference } from 'codemirror-graphql/utils/SchemaReference';

import { useExtensionsEditor } from '../extensions-editor';
import { CommonEditorProps } from '../types';

import '../style/codemirror.css';
import '../style/fold.css';
import '../style/lint.css';
import '../style/hint.css';
import '../style/editor.css';
import { clsx } from 'clsx';

export type ExtensionsEditorProps = CommonEditorProps & {
  /**
   * Makes the editor read-only.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Invoked when a reference to the GraphQL schema (type or field) is clicked
   * as part of the editor or one of its tooltips.
   * @param reference The reference that has been clicked.
   */
  onClickReference?: (reference: SchemaReference) => void;
  /**
   * Invoked when the contents of the extensions editor change.
   * @param value The new contents of the editor.
   */
  onEdit?: (value: string) => void;
  /**
   * If the editor should be hidden.
   * @default false
   */
  isHidden?: boolean;
};

/**
 * The extensions editor with full syntax highlighting for JSON.
 */
export function ExtensionsEditor({
  editorTheme,
  isHidden,
  keyMap,
  onClickReference,
  onEdit,
  readOnly,
}: ExtensionsEditorProps) {
  const ref = useExtensionsEditor({
    editorTheme,
    keyMap,
    onClickReference,
    onEdit,
    readOnly,
  });

  return (
    <div className={clsx('graphiql-editor', isHidden && 'hidden')} ref={ref} />
  );
}
