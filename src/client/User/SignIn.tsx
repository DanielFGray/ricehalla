import React from 'react'
import { Helmet } from 'react-helmet-async'

export default function SignIn() {
  return (
    <div className="signin">
      <Helmet>
        <title>Sign In</title>
      </Helmet>
      <form>
        <h1>Sign In</h1>
        <div className="username">
          <label htmlFor="username">username</label>
          {': '}
          <input id="username" type="text" />
        </div>
        <div className="password">
          <label htmlFor="password">password</label>
          {': '}
          <input id="password" type="password" />
        </div>
      </form>
      {' '}
    </div>
  )
}
