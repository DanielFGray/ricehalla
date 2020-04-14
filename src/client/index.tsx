import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ApolloProvider } from '@apollo/react-hooks'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { onError } from 'apollo-link-error'
import './style.css'
import Layout from './Layout'

const { MOUNT } = process.env

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: ApolloLink.from([
    onError(({ networkError, graphQLErrors }) => {
      if (graphQLErrors) {
        console.error(...graphQLErrors)
      }
      if (networkError) {
        console.error(networkError)
      }
    }),
    new HttpLink({
      credentials: 'same-origin',
      uri: '/graphql',
    }),
  ]),
})

const Init = (
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <Router>
        <HelmetProvider>
          <Layout />
        </HelmetProvider>
      </Router>
    </ApolloProvider>
  </React.StrictMode>
)

ReactDOM.render(Init, document.getElementById(MOUNT))
