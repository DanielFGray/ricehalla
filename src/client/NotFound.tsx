import * as React from 'react'
import { Helmet } from 'react-helmet-async'

export default function NotFound({ location, ...props }) {
  if (props.staticContext) {
    // eslint-disable-next-line no-param-reassign
    props.staticContext.statusCode = 404
  }
  return (
    <p>
      <Helmet>
        <title>Not Found</title>
      </Helmet>
      {`${location.pathname} does not exist`}
    </p>
  )
}
