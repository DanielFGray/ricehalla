import * as React from 'react'
import { Helmet } from 'react-helmet-async'
import { Switch, Route } from 'react-router-dom'
import { hot } from 'react-hot-loader/root'
import Desktops from './Desktops'
import NotFound from './NotFound'

const { APP_TITLE } = process.env

export function Layout() {
  return (
    <div className="layout">
      <Helmet
        defaultTitle={APP_TITLE}
        titleTemplate={`${APP_TITLE} | %s`}
      />
      <div className="main">
        <Switch>
          <Route path="/" exact component={Desktops} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  )
}

export default hot(Layout)
