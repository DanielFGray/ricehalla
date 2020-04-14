import * as React from 'react'
import { Helmet } from 'react-helmet-async'
import { Switch, Route } from 'react-router-dom'
import Desktops from './Desktops'
import NotFound from './NotFound'
import SignUp from './User/SignUp'
import SignIn from './User/SignIn'

const { APP_TITLE } = process.env

export default function Layout() {
  return (
    <div className="layout">
      <Helmet
        defaultTitle={APP_TITLE}
        titleTemplate={`${APP_TITLE} | %s`}
      />
      <div className="main">
        <nav>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/signup">Sign Up</a>
            </li>
            <li>
              <a href="/signin">Sign In</a>
            </li>
          </ul>
        </nav>
        <Switch>
          <Route path="/signin" exact component={SignIn} />
          <Route path="/signup" exact component={SignUp} />
          <Route path="/" exact component={Desktops} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  )
}
