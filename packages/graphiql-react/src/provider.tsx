import type { ComponentPropsWithoutRef, FC } from 'react';
import { EditorContextProvider } from './editor';
import { ExecutionContextProvider } from './execution';
import { PluginContextProvider } from './plugin';
import { SchemaContextProvider } from './schema';
import { StorageContextProvider } from './storage';

type GraphiQLProviderProps =
  //
  ComponentPropsWithoutRef<typeof EditorContextProvider> &
    ComponentPropsWithoutRef<typeof ExecutionContextProvider> &
    ComponentPropsWithoutRef<typeof PluginContextProvider> &
    ComponentPropsWithoutRef<typeof SchemaContextProvider> &
    ComponentPropsWithoutRef<typeof StorageContextProvider>;

export const GraphiQLProvider: FC<GraphiQLProviderProps> = ({
  children,
  dangerouslyAssumeSchemaIsValid,
  defaultQuery,
  defaultHeaders,
  defaultExtensions,
  defaultTabs,
  externalFragments,
  fetcher,
  getDefaultFieldNames,
  headers,
  inputValueDeprecation,
  introspectionQueryName,
  onEditOperationName,
  onSchemaChange,
  onTabChange,
  onTogglePluginVisibility,
  operationName,
  plugins,
  referencePlugin,
  query,
  response,
  schema,
  schemaDescription,
  shouldPersistHeaders,
  storage,
  validationRules,
  variables,
  extensions,
  visiblePlugin,
}) => {
  const editorContextProps = {
    defaultQuery,
    defaultHeaders,
    defaultExtensions,
    defaultTabs,
    externalFragments,
    headers,
    onEditOperationName,
    onTabChange,
    query,
    response,
    shouldPersistHeaders,
    validationRules,
    variables,
    extensions,
  };
  const schemaContextProps = {
    dangerouslyAssumeSchemaIsValid,
    fetcher,
    inputValueDeprecation,
    introspectionQueryName,
    onSchemaChange,
    schema,
    schemaDescription,
  };
  const executionContextProps = {
    getDefaultFieldNames,
    fetcher,
    operationName,
  };
  const pluginContextProps = {
    onTogglePluginVisibility,
    plugins,
    visiblePlugin,
    referencePlugin,
  };
  return (
    <StorageContextProvider storage={storage}>
      <EditorContextProvider {...editorContextProps}>
        <SchemaContextProvider {...schemaContextProps}>
          <ExecutionContextProvider {...executionContextProps}>
            <PluginContextProvider {...pluginContextProps}>
              {children}
            </PluginContextProvider>
          </ExecutionContextProvider>
        </SchemaContextProvider>
      </EditorContextProvider>
    </StorageContextProvider>
  );
};
