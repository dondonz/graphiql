/**
 * This example commands.ts shows you how to create various custom commands and
 * overwrite existing commands.
 *
 * For more comprehensive examples of custom commands, please read more here:
 * https://on.cypress.io/custom-commands
 */

/// <reference types="cypress" />

type Op = {
  query: string;
  variables?: Record<string, any>;
  variablesString?: string;
  headersString?: string;
  response?: Record<string, any>;
};
declare namespace Cypress {
  type MockResult =
    | { data: any }
    | { data: any; hasNext?: boolean }
    | { error: any[] }
    | { errors: any[] };

  interface Chainable {
    /**
     * Custom command to select a DOM element by `data-cy` attribute.
     * @example cy.dataCy('greeting')
     */
    dataCy(value: string): Chainable<Element>;

    clickExecuteQuery(): Chainable<Element>;

    visitWithOp(op: Op): Chainable<Element>;

    clickPrettify(): Chainable<Element>;

    assertHasValues(op: Op): Chainable<Element>;

    assertQueryResult(expectedResult: MockResult): Chainable<Element>;

    assertLinterMarkWithMessage(
      text: string,
      severity: 'error' | 'warning',
      message?: string,
    ): Chainable<Element>;
  }
}

// @ts-expect-error -- fixme
Cypress.Commands.add('dataCy', value => {
  return cy.get(`[data-cy="${value}"]`);
});

// @ts-expect-error -- fixme
Cypress.Commands.add('clickExecuteQuery', () => {
  // Check CodeMirror was initialized
  cy.get('.graphiql-query-editor .CodeMirror-scroll').should('exist');
  return cy.get('.graphiql-execute-button').click();
});

// @ts-expect-error -- fixme
Cypress.Commands.add('clickPrettify', () => {
  // Check CodeMirror was initialized
  cy.get('.graphiql-query-editor .CodeMirror-scroll').should('exist');
  return cy.get('[aria-label="Prettify query (Shift-Ctrl-P)"]').click();
});

// @ts-expect-error -- fixme
Cypress.Commands.add('visitWithOp', ({ query, variables, variablesString }) => {
  let url = `/?query=${encodeURIComponent(query)}`;
  if (variables || variablesString) {
    url += `&variables=${encodeURIComponent(
      // @ts-expect-error -- fixme
      JSON.stringify(variables, null, 2) || variablesString,
    )}`;
  }
  return cy.visit(url);
});

Cypress.Commands.add(
  'assertHasValues',
  ({ query, variables, variablesString, headersString, response }: Op) => {
    cy.get('.graphiql-query-editor').should(element => {
      expect(normalize(element.get(0).innerText)).to.equal(
        codeWithLineNumbers(query),
      );
    });
    if (variables !== undefined) {
      cy.contains('Variables').click();
      cy.get('.graphiql-editor-tool .graphiql-editor')
        .eq(0)
        .should(element => {
          expect(normalize(element.get(0).innerText)).to.equal(
            codeWithLineNumbers(JSON.stringify(variables, null, 2)),
          );
        });
    }
    if (variablesString !== undefined) {
      cy.contains('Variables').click();
      cy.get('.graphiql-editor-tool .graphiql-editor')
        .eq(0)
        .should(element => {
          expect(normalize(element.get(0).innerText)).to.equal(
            codeWithLineNumbers(variablesString),
          );
        });
    }
    if (headersString !== undefined) {
      cy.contains('Headers').click();
      cy.get('.graphiql-editor-tool .graphiql-editor')
        .eq(1)
        .should(element => {
          expect(normalize(element.get(0).innerText)).to.equal(
            codeWithLineNumbers(headersString),
          );
        });
    }
    if (response !== undefined) {
      cy.get('.result-window').should(element => {
        expect(normalizeWhitespace(element.get(0).innerText)).to.equal(
          JSON.stringify(response, null, 2),
        );
      });
    }
  },
);

Cypress.Commands.add('assertQueryResult', expectedResult => {
  cy.get('section.result-window').should(element => {
    expect(normalizeWhitespace(element.get(0).innerText)).to.equal(
      JSON.stringify(expectedResult, null, 2),
    );
  });
});

function codeWithLineNumbers(code: string): string {
  return code
    .split('\n')
    .map((line, i) => `${i + 1}\n${line}`)
    .join('\n');
}

function normalize(str: string): string {
  return str.replaceAll('​', '');
}

function normalizeWhitespace(str: string): string {
  return str.replaceAll('\xA0', ' ');
}

Cypress.Commands.add(
  'assertLinterMarkWithMessage',
  (text, severity, message) => {
    cy.contains(text)
      .should('have.class', 'CodeMirror-lint-mark')
      .and('have.class', `CodeMirror-lint-mark-${severity}`);
    if (message) {
      cy.contains(text).trigger('mouseover');
      cy.contains(message);
    }
  },
);
