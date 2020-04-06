import type { GraphQLSchema } from 'graphql'
import type { StaticRouterContext } from 'react-router'
// import path from 'path'
import React from 'react'
import { renderToStringWithData } from '@apollo/react-ssr'
// import { ChunkExtractor } from '@loadable/server'
import { StaticRouter } from 'react-router'
import { HelmetProvider } from 'react-helmet-async'
import { ApolloProvider } from '@apollo/react-hooks'
import { ApolloClient } from 'apollo-client'
import { SchemaLink } from 'apollo-link-schema'
import { onError } from 'apollo-link-error'
import { ApolloLink } from 'apollo-link'
import { InMemoryCache } from 'apollo-cache-inmemory'
import Layout from './client/Layout'
import Html from './Html'
import { KoaContext } from './types'

const { NODE_ENV, APP_BASE } = process.env

function getAssets(ctx: KoaContext) {
  const list: string[] = Object.values(
    NODE_ENV === 'production'
      ? ctx.state.manifest
      : ctx.state.webpackStats?.toJson().assetsByChunkName.main,
  )
  return list.reduce(
    (p: { [key: string]: string[] }, x) => {
      if (x.endsWith('.css')) {
        p.styles.push(x)
      } else if (x.endsWith('.js')) {
        p.scripts.push(x)
      }
      return p
    },
    { styles: [], scripts: [] },
  )
}

// const nodeStats = path.resolve(
//   __dirname,
//   '../dist/loadable-node-stats.json',
// )

export default function SSR({ schema }: { schema: GraphQLSchema }) {
  return async (ctx: KoaContext) => {
    const client = new ApolloClient({
      ssrMode: true,
      link: ApolloLink.from([
        onError(({ networkError, graphQLErrors }) => {
          if (graphQLErrors) {
            console.error(...graphQLErrors)
          }
          if (networkError) {
            console.error(networkError)
          }
        }),
        new SchemaLink({ schema }),
      ]),
      cache: new InMemoryCache(),
    })
    const { styles, scripts } = getAssets(ctx)

    // const stats = ctx.state.webpackStats.toJson({
    //   hash: true,
    //   publicPath: true,
    //   assets: true,
    //   chunks: false,
    //   modules: false,
    //   source: false,
    //   errorDetails: false,
    //   timings: false,
    // })

    // const nodeExtractor = new ChunkExtractor({ statsFile: nodeStats })
    // const { default: ExtractedJsx } = nodeExtractor.requireEntrypoint()

    // const webExtractor = new ChunkExtractor({ stats })

    const routerCtx: StaticRouterContext = {}
    const helmetCtx = {}

    const App = (
      <ApolloProvider client={client}>
        <StaticRouter
          basename={APP_BASE}
          location={ctx.url}
          context={routerCtx}
        >
          <HelmetProvider context={helmetCtx}>
            <Layout />
          </HelmetProvider>
        </StaticRouter>
      </ApolloProvider>
    )

    // const html = await renderToStringWithData(webExtractor.collectChunks(App))
    const html = await renderToStringWithData(App)
    const { helmet } = helmetCtx
    const data = { __INIT_DATA: client.extract() }

    if (routerCtx.statusCode) {
      ctx.status = routerCtx.statusCode
    }
    if (routerCtx.url) {
      ctx.redirect(routerCtx.url)
      return
    }
    ctx.body = Html({
      data,
      html,
      helmet,
      // extractor: webExtractor,
      scripts,
      styles,
    })
  }
}

if (module.hot) {
  console.info('server side HMR')
}
