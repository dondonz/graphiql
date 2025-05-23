import type {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLNamedType,
} from 'graphql';
import {
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isNamedType,
  isObjectType,
  isScalarType,
  isUnionType,
} from 'graphql';
import { FC, ReactNode, useEffect, useState } from 'react';
import {
  useSchemaContext,
  createContextHook,
  createNullableContext,
} from '@graphiql/react';

export type ExplorerFieldDef =
  | GraphQLField<unknown, unknown>
  | GraphQLInputField
  | GraphQLArgument;

export type ExplorerNavStackItem = {
  /**
   * The name of the item.
   */
  name: string;
  /**
   * The definition object of the item, this can be a named type, a field, an
   * input field or an argument.
   */
  def?: GraphQLNamedType | ExplorerFieldDef;
};

// There's always at least one item in the nav stack
export type ExplorerNavStack = [
  ExplorerNavStackItem,
  ...ExplorerNavStackItem[],
];

const initialNavStackItem: ExplorerNavStackItem = { name: 'Docs' };

export type ExplorerContextType = {
  /**
   * A stack of navigation items. The last item in the list is the current one.
   * This list always contains at least one item.
   */
  explorerNavStack: ExplorerNavStack;
  /**
   * Push an item to the navigation stack.
   * @param item The item that should be pushed to the stack.
   */
  push(item: ExplorerNavStackItem): void;
  /**
   * Pop the last item from the navigation stack.
   */
  pop(): void;
  /**
   * Reset the navigation stack to its initial state, this will remove all but
   * the initial stack item.
   */
  reset(): void;
};

export const ExplorerContext =
  createNullableContext<ExplorerContextType>('ExplorerContext');

export const ExplorerContextProvider: FC<{
  children: ReactNode;
}> = props => {
  const { schema, validationErrors, schemaReference } = useSchemaContext({
    nonNull: true,
    caller: ExplorerContextProvider,
  });

  const [navStack, setNavStack] = useState<ExplorerNavStack>([
    initialNavStackItem,
  ]);

  const push = // eslint-disable-line react-hooks/exhaustive-deps -- false positive, variable is optimized by react-compiler, no need to wrap with useCallback
    (item: ExplorerNavStackItem) => {
      setNavStack(currentState => {
        const lastItem = currentState.at(-1)!;
        return lastItem.def === item.def
          ? // Avoid pushing duplicate items
            currentState
          : [...currentState, item];
      });
    };

  const pop = () => {
    setNavStack(currentState =>
      currentState.length > 1
        ? (currentState.slice(0, -1) as ExplorerNavStack)
        : currentState,
    );
  };

  const reset = () => {
    setNavStack(currentState =>
      currentState.length === 1 ? currentState : [initialNavStackItem],
    );
  };

  useEffect(() => {
    if (!schemaReference) {
      return;
    }
    switch (schemaReference.kind) {
      case 'Type': {
        push({ name: schemaReference.type.name, def: schemaReference.type });
        break;
      }
      case 'Field': {
        push({ name: schemaReference.field.name, def: schemaReference.field });
        break;
      }
      case 'Argument': {
        if (schemaReference.field) {
          push({
            name: schemaReference.field.name,
            def: schemaReference.field,
          });
        }
        break;
      }
      case 'EnumValue': {
        if (schemaReference.type) {
          push({ name: schemaReference.type.name, def: schemaReference.type });
        }
        break;
      }
    }
  }, [schemaReference, push]);

  useEffect(() => {
    // Whenever the schema changes, we must revalidate/replace the nav stack.
    if (schema == null || validationErrors.length > 0) {
      reset();
    } else {
      // Replace the nav stack with an updated version using the new schema
      setNavStack(oldNavStack => {
        if (oldNavStack.length === 1) {
          return oldNavStack;
        }
        const newNavStack: ExplorerNavStack = [initialNavStackItem];
        let lastEntity:
          | GraphQLNamedType
          | GraphQLField<unknown, unknown>
          | null = null;
        for (const item of oldNavStack) {
          if (item === initialNavStackItem) {
            // No need to copy the initial item
            continue;
          }
          if (item.def) {
            // If item.def isn't a named type, it must be a field, inputField, or argument
            if (isNamedType(item.def)) {
              // The type needs to be replaced with the new schema type of the same name
              const newType = schema.getType(item.def.name);
              if (newType) {
                newNavStack.push({
                  name: item.name,
                  def: newType,
                });
                lastEntity = newType;
              } else {
                // This type no longer exists; the stack cannot be built beyond here
                break;
              }
            } else if (lastEntity === null) {
              // We can't have a sub-entity if we have no entity; stop rebuilding the nav stack
              break;
            } else if (
              isObjectType(lastEntity) ||
              isInputObjectType(lastEntity)
            ) {
              // item.def must be a Field / input field; replace with the new field of the same name
              const field = lastEntity.getFields()[item.name];
              if (field) {
                newNavStack.push({
                  name: item.name,
                  def: field,
                });
              } else {
                // This field no longer exists; the stack cannot be built beyond here
                break;
              }
            } else if (
              isScalarType(lastEntity) ||
              isEnumType(lastEntity) ||
              isInterfaceType(lastEntity) ||
              isUnionType(lastEntity)
            ) {
              // These don't (currently) have non-type sub-entries; something has gone wrong.
              // Handle gracefully by discontinuing rebuilding the stack.
              break;
            } else {
              // lastEntity must be a field (because it's not a named type)
              const field: GraphQLField<unknown, unknown> = lastEntity;
              // Thus item.def must be an argument, so find the same named argument in the new schema
              if (field.args.some(a => a.name === item.name)) {
                newNavStack.push({
                  name: item.name,
                  def: field,
                });
              } else {
                // This argument no longer exists; the stack cannot be built beyond here
                break;
              }
            }
          } else {
            lastEntity = null;
            newNavStack.push(item);
          }
        }
        return newNavStack;
      });
    }
  }, [schema, validationErrors]);

  const value: ExplorerContextType = {
    explorerNavStack: navStack,
    push,
    pop,
    reset,
  };

  return (
    <ExplorerContext.Provider value={value}>
      {props.children}
    </ExplorerContext.Provider>
  );
};

export const useExplorerContext = createContextHook(ExplorerContext);
