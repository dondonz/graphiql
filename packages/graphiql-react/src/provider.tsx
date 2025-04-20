import { EditorContextProvider, EditorContextProviderProps } from './editor';
import {
  ExecutionContextProvider,
  ExecutionContextProviderProps,
} from './execution';
import {
  ExplorerContextProvider,
  ExplorerContextProviderProps,
} from './explorer/context';
import { HistoryContextProvider, HistoryContextProviderProps } from './history';
import { PluginContextProvider, PluginContextProviderProps } from './plugin';
import { SchemaContextProvider, SchemaContextProviderProps } from './schema';
import { StorageContextProvider, StorageContextProviderProps } from './storage';

export type GraphiQLProviderProps = EditorContextProviderProps &
  ExecutionContextProviderProps &
  ExplorerContextProviderProps &
  HistoryContextProviderProps &
  PluginContextProviderProps &
  SchemaContextProviderProps &
  StorageContextProviderProps;

export function GraphiQLProvider({
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
  maxHistoryLength,
  onEditOperationName,
  onSchemaChange,
  onTabChange,
  onTogglePluginVisibility,
  operationName,
  plugins,
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
}: GraphiQLProviderProps) {
  return (
    <StorageContextProvider storage={storage}>
      <HistoryContextProvider maxHistoryLength={maxHistoryLength}>
        <EditorContextProvider
          defaultQuery={defaultQuery}
          defaultHeaders={defaultHeaders}
          defaultExtensions={defaultExtensions}
          defaultTabs={defaultTabs}
          externalFragments={externalFragments}
          headers={headers}
          onEditOperationName={onEditOperationName}
          onTabChange={onTabChange}
          query={query}
          response={response}
          shouldPersistHeaders={shouldPersistHeaders}
          validationRules={validationRules}
          variables={variables}
          extensions={extensions}
        >
          <SchemaContextProvider
            dangerouslyAssumeSchemaIsValid={dangerouslyAssumeSchemaIsValid}
            fetcher={fetcher}
            inputValueDeprecation={inputValueDeprecation}
            introspectionQueryName={introspectionQueryName}
            onSchemaChange={onSchemaChange}
            schema={schema}
            schemaDescription={schemaDescription}
          >
            <ExecutionContextProvider
              getDefaultFieldNames={getDefaultFieldNames}
              fetcher={fetcher}
              operationName={operationName}
            >
              <ExplorerContextProvider>
                <PluginContextProvider
                  onTogglePluginVisibility={onTogglePluginVisibility}
                  plugins={plugins}
                  visiblePlugin={visiblePlugin}
                >
                  {children}
                </PluginContextProvider>
              </ExplorerContextProvider>
            </ExecutionContextProvider>
          </SchemaContextProvider>
        </EditorContextProvider>
      </HistoryContextProvider>
    </StorageContextProvider>
  );
}
