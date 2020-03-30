/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'

function replacer(k: string, v: any) {
  if (typeof v === 'function') return '[function]'
  return v
}

export default function Stringify(props: any) {
  if (typeof props === 'string') return <pre>{props}</pre>
  return (
    <pre>
      {JSON.stringify(props, replacer, 2)}
    </pre>
  )
}
