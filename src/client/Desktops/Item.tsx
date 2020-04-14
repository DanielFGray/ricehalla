import React, { useReducer, useState, Reducer } from 'react'
// import loadable from '@loadable/component'
import { SimpleImg as Img } from 'react-simple-img'
import marked from 'marked'

import Stringify from '../Stringify'
import { Desktop, DesktopPartsFragment } from '../../generated-types'

/* const Marked = loadable.lib(() => import('marked'))
 <Marked fallback={<div className="description">{data.description}</div>}>
  {({ default: marked }: { default: typeof import('marked') }) => (
    <div
      className="description"
      dangerouslySetInnerHTML={{ __html: marked(data.description) }}
    />
  )}
</Marked> */

type FormState = Pick<Desktop, 'title' | 'description' | 'urls'>

const formReducer: Reducer<
  FormState,
  | {
      type: 'fieldChange'
      field: 'urls'
      payload: string[]
    }
  | {
      type: 'fieldChange'
      field: 'title' | 'description'
      payload: string
    }
> = (state, action) => {
  switch (action.type) {
  case 'fieldChange':
    return { ...state, [action.field]: action.payload }
  default:
    return state
  }
}

export function Form({
  data,
  actions,
  submit,
  cancelled,
  preview = false,
}: {
  data?: FormState
  submit: (s: FormState) => void
  cancelled?: () => void
  actions: (s: FormState) => JSX.Element
  preview?: boolean
}) {
  const initState = {
    title: data?.title ?? '',
    description: data?.description ?? '',
    urls: data?.urls ?? [],
  }
  const [state, dispatch] = useReducer(formReducer, initState)

  const badUrls = state.urls.filter(x => x && ! /^https?:\/\/\S+\.\S+$/.test(x))

  return (
    <form
      className="desktopCreator"
      onSubmit={e => {
        e.preventDefault()
        submit(state)
      }}
    >
      <div className="title">
        <input
          type="text"
          placeholder="title"
          value={state.title}
          onChange={e => dispatch({ type: 'fieldChange', field: 'title', payload: e.currentTarget.value })}
          onKeyDown={e => {
            if (cancelled && e.keyCode === 27) cancelled()
          }}
        />
      </div>
      <div className="urls">
        <input
          type="text"
          placeholder="urls"
          value={state.urls.join(' ')}
          onChange={e => dispatch({
            type: 'fieldChange',
            field: 'urls',
            payload: e.currentTarget.value.split(/\s+/),
          })}
          onKeyDown={e => {
            if (cancelled && e.keyCode === 27) cancelled()
          }}
        />
        {badUrls.length > 0
          && badUrls.map(e => (
            <div key={e}>
              bad url:
              {e}
            </div>
          ))}
      </div>
      <textarea
        className="description"
        placeholder="description"
        value={state.description ?? ''}
        onChange={e => dispatch({ type: 'fieldChange', field: 'description', payload: e.currentTarget.value })}
        onKeyDown={e => {
          if (cancelled && e.keyCode === 27) cancelled()
        }}
      />
      {actions(state)}
      {preview && (
        <div className="preview">
          <Item data={state} />
        </div>
      )}
    </form>
  )
}

export default function Item({
  data,
  desktopUpdate,
  desktopDelete,
  editable = false,
}: {
  data: DesktopPartsFragment
  desktopUpdate?: (d: DesktopPartsFragment) => Promise<void>
  desktopDelete?: ({ id }: { id: number }) => Promise<void>
  editable?: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const doneEdit = (update: DesktopPartsFragment) => (e?: any) => {
    if (e) e.preventDefault()
    if (desktopUpdate) {
      desktopUpdate(update)
    }
    setExpanded(false)
  }

  const cancelEdit = (e?: any) => {
    if (e) e.preventDefault()
    setExpanded(false)
  }

  const handleDelete = () => {
    if (desktopDelete){
      desktopDelete({ id: data.id })
    }
  }

  if (expanded) {
    return (
      <Form
        submit={doneEdit}
        cancelled={cancelEdit}
        data={data}
        actions={state => (
          <>
            <button type="submit" onClick={doneEdit(state)}>
              Update
            </button>
            <button type="button" onClick={handleDelete}>
              Delete
            </button>
            <button type="button" onClick={cancelEdit}>
              Cancel
            </button>
          </>
        )}
      />
    )
  }

  return (
    <div className="desktopView">
      <ul className="gallery">
        {data.urls.slice(100).map(url => (
          <li key={url}>
            <a href={url}>
              <Img src={url} config={{ logConsoleError: true }} />
            </a>
          </li>
        ))}
      </ul>
      <div className="title">{data.title}</div>
      {data.description && (
        <div
          className="description"
          dangerouslySetInnerHTML={{ __html: marked(data.description) }}
        />
      )}
      {editable && (
        <button type="button" name="edit" className="edit" onClick={() => setExpanded(true)}>
          edit
        </button>
      )}
    </div>
  )
}
