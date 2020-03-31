import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ApolloProvider } from '@apollo/react-hooks'
import { ApolloClient } from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { WebSocketLink } from 'apollo-link-ws'
// import { loadableReady } from '@loadable/component'
import Layout from './Layout'

/* import 'normalize.css' */
import './style.css'

const { APP_URL, APP_BASE, MOUNT } = process.env

export default function main() {
  console.log('firing main')

  const cache = new InMemoryCache()
  try {
    const initData = window.__INIT_DATA // eslint-disable-line no-underscore-dangle
    if (initData) {
      cache.restore(initData)
    }
  } catch (e) { console.error('unable to load cache', e) }

  const apolloClient = new ApolloClient({
    cache,
    link: ApolloLink.from([
      // new WebSocketLink({
      //   uri: `ws://${APP_URL}/subscriptions`,
      //   options: {
      //     reconnect: true,
      //   },
      // }),
      new HttpLink({
        credentials: 'same-origin',
        uri: '/graphql',
      }),
    ]),
  })

  const Init = (
    <ApolloProvider client={apolloClient}>
      <Router basename={APP_BASE}>
        <HelmetProvider>
          <Layout />
        </HelmetProvider>
      </Router>
    </ApolloProvider>
  )

  // loadableReady(() => {
  const el = document.getElementById(MOUNT)
  if (! el) throw new Error(`could not find render element with id ${MOUNT}`)
    ReactDOM.hydrate(<App />, Init)
  // })
}

if (document) {
  document.addEventListener('DOMContentLoaded', main)
}
