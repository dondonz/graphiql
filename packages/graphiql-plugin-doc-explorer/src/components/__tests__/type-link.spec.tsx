import { fireEvent, render } from '@testing-library/react';
import { GraphQLNonNull, GraphQLList, GraphQLString } from 'graphql';
import { ExplorerContext } from '../../context';
import { TypeLink } from '../type-link';
import { mockExplorerContextValue, unwrapType } from './test-utils';

const nonNullType = new GraphQLNonNull(GraphQLString);
const listType = new GraphQLList(GraphQLString);

const TypeLinkWithContext: typeof TypeLink = props => {
  return (
    <ExplorerContext.Provider
      value={mockExplorerContextValue({
        name: unwrapType(props.type).name,
        def: unwrapType(props.type),
      })}
    >
      <TypeLink {...props} />
      {/* Print the top of the current nav stack for test assertions */}
      <ExplorerContext.Consumer>
        {context => (
          <span data-testid="nav-stack">
            {JSON.stringify(
              context!.explorerNavStack[context!.explorerNavStack.length + 1],
            )}
          </span>
        )}
      </ExplorerContext.Consumer>
    </ExplorerContext.Provider>
  );
};

describe('TypeLink', () => {
  it('should render a string', () => {
    const { container } = render(<TypeLinkWithContext type={GraphQLString} />);
    expect(container).toHaveTextContent('String');
    expect(container.querySelectorAll('a')).toHaveLength(1);
  });
  it('should render a non-null type', () => {
    const { container } = render(<TypeLinkWithContext type={nonNullType} />);
    expect(container).toHaveTextContent('String!');
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });
  it('should render a list type', () => {
    const { container } = render(<TypeLinkWithContext type={listType} />);
    expect(container).toHaveTextContent('[String]');
    expect(container.querySelectorAll('span')).toHaveLength(1);
  });
  it('should push to the nav stack on click', () => {
    const { container, getByTestId } = render(
      <TypeLinkWithContext type={listType} />,
    );
    fireEvent.click(container.querySelector('a')!);
    expect(getByTestId('nav-stack')).toHaveTextContent('');
  });
  it('should re-render on type change', () => {
    const { container, rerender } = render(
      <TypeLinkWithContext type={listType} />,
    );
    expect(container).toHaveTextContent('[String]');
    rerender(<TypeLinkWithContext type={GraphQLString} />);
    expect(container).toHaveTextContent('String');
  });
});
