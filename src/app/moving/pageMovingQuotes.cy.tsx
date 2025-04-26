import React from 'react'
import MovingQuotes from './page'

describe('<MovingQuotes />', () => {
  it('renders', () => {
    // see: https://on.cypress.io/mounting-react
    cy.mount(<MovingQuotes />)
  })
})