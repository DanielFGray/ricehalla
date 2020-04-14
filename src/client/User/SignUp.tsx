import React from 'react'
import { Helmet } from 'react-helmet-async'

export default function SignUp() {
  return (
    <div className="signup">
      <Helmet>
        <title>Sign Up</title>
      </Helmet>
      <form>
        <h1>Sign Up</h1>
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
        <div className="confirmpassword">
          <label htmlFor="confirmpassword">confirm password</label>
          {': '}
          <input id="confirmpassword" type="password" />
        </div>
      </form>
    </div>
  )
}
