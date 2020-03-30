/* eslint react/no-danger: off */
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ChunkExtractor } from '@loadable/server'

const { MOUNT, NODE_ENV, APP_BASE } = process.env

export default function Html({ data, html, helmet, scripts, styles, extractor }: {
  data: any // eslint-disable-line @typescript-eslint/no-explicit-any
  helmet: any // eslint-disable-line @typescript-eslint/no-explicit-any 
  html: string
  scripts?: string[]
  styles?: string[]
  extractor?: ChunkExtractor
}) {
  const Component = (
    <html lang="en" {...helmet.htmlAttributes.toString()}>
      <head>
        {helmet.title.toComponent()}
        <meta charSet="utf-8" />
        <meta httpEquiv="Content-Language" content="en" />
        {helmet.meta.toComponent()}
        {helmet.style.toComponent()}
        {helmet.link.toComponent()}
        {helmet.noscript.toComponent()}
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"
        />
        {styles && styles.map(link => (
          <link key={link} rel="stylesheet" type="text/css" href={`${APP_BASE}/${link}`} />
        ))}
        {extractor && extractor.getStyleElements()}
      </head>
      <body {...helmet.bodyAttributes.toComponent()}>
        <div
          id={MOUNT}
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />
        {data && (
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: Object.entries(data)
                .reduce((p, [k, v]) => p.concat(`window.${k}=${JSON.stringify(
                  v,
                  null,
                  NODE_ENV === 'development' ? 2 : undefined,
                )};`), ''),
            }}
          />
        )}
        {helmet.script.toComponent()}
        {extractor && extractor.getScriptElements()}
        {scripts && scripts.map(js => (
          <script
            src={`${APP_BASE}/${js}`}
            key={js}
            type="text/javascript"
          />
        ))}
      </body>
    </html>
  )
  return `<!doctype html>${renderToStaticMarkup(Component)}`
}
