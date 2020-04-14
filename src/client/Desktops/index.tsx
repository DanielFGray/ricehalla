import React from 'react'
import { Helmet } from 'react-helmet-async'
import Item, { Form } from './Item'
import useDesktops from './useDesktops'
import Stringify from '../Stringify'

export default function Desktop() {
  const {
    listDesktops,
    createDesktop,
    // updateDesktop,
    // deleteDesktop,
    errors,
  } = useDesktops()

  return (
    <div className="desktops">
      <Helmet>
        <title>Home</title>
      </Helmet>
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
      {errors && <div className="error">{Stringify(errors)}</div>}
      {listDesktops && (
        <div className="desktopList">
          {listDesktops.map(
            x => x && (
              <Item
                key={x.id}
                data={x}
                // deleteDesktop={() => deleteDesktop({ id: x.id })}
                // updateDesktop={updateDesktop}
              />
            ),
          )}
        </div>
      )}
    </div>
  )
}
