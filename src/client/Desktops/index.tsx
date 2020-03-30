import React from 'react'
import { Helmet } from 'react-helmet-async'
import Item, { Form } from './Item'
import useDesktops from './useDesktops'
import Stringify from '../Stringify'

export default function Desktop() {
  const {
    listDesktops,
    createDesktop,
    errors,
  } = useDesktops()

  return (
    <>
      <Helmet>
        <title>Home</title>
      </Helmet>
      <h3>Home</h3>
      <Form
        submit={createDesktop}
        preview
        actions={state => (
          <>
            <button
              type="submit"
              onClick={e => {
                e.preventDefault()
                createDesktop(state)
              }}
            >
              Submit
            </button>
          </>
        )}
      />
      {errors && <div>{Stringify(errors)}</div>}
      {listDesktops && (
        <>
          <div className="desktopList">
            {listDesktops.map(x => (<Item key={x.id} data={x} />))}
          </div>
        </>
      )}
    </>
  )
}
