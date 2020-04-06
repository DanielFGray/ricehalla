import { useMemo } from 'react'
import { ApolloError } from 'apollo-client'
import {
  DesktopListDocument,
  DesktopCreateMutationVariables,
  // DesktopUpdateMutationVariables,
  Desktop,
  DesktopOrder,
  useDesktopListQuery,
  useDesktopCreateMutation,
  // useDesktopUpdateMutation,
  // useDesktopDeleteMutation,
  useDesktopCreatedSubscription,
  // useDesktopUpdatedSubscription,
  // useDesktopDeletedSubscription,
} from '../../generated-types'

export default function useDesktops() {
  const { data, refetch, error: errorQuery } = useDesktopListQuery({
    variables: {
      order: DesktopOrder.CreatedAt,
      offset: 0,
      limit: 100,
    },
  })
  const [_createDesktop, { error: errorCreate }] = useDesktopCreateMutation()
  // const [_updateDesktop, { error: errorUpdate }] = useDesktopUpdateMutation()
  // const [_deleteDesktop, { error: errorDelete }] = useDesktopDeleteMutation()

  function createDesktop({ description, title, urls }: DesktopCreateMutationVariables) {
    return _createDesktop({
      variables: { description, title, urls },
      optimisticResponse: {
        __typename: 'Mutation',
        DesktopCreate: {
          __typename: 'Desktop',
          id: null,
          description,
          title,
          urls,
        },
      },
      update: (proxy, result) => {
        const created = result.data?.DesktopCreate
        const cache = proxy.readQuery<{ DesktopList: Desktop[] }>({ query: DesktopListDocument })
        if (! (created && cache)) return
        const DesktopList = [created, ...(cache?.DesktopList ?? [])]
        proxy.writeQuery({
          query: DesktopListDocument,
          data: { DesktopList },
        })
      },
    })
  }

  // function updateDesktop({ id, description, title, urls }: DesktopUpdateMutationVariables) {
  //   return _updateDesktop({
  //     variables: { id, description, title, urls },
  //     optimisticResponse: {
  //       __typename: 'Mutation',
  //       DesktopUpdate: {
  //         __typename: 'Desktop',
  //         id,
  //         description,
  //         urls,
  //         title,
  //       },
  //     },
  //     update: (proxy, result) => {
  //       const cache = proxy.readQuery({ query: DesktopListDocument })
  //       const idx = cache.DesktopList.findIndex(e => e.id === id)
  //       if (idx < 0) return
  //       const DesktopList = [
  //         ...cache.Desktop.slice(0, idx),
  //         result.data.DesktopUpdate,
  //         ...cache.Desktop.slice(idx + 1),
  //       ]
  //       proxy.writeQuery({
  //         query: DesktopListDocument,
  //         data: { DesktopList },
  //       })
  //     },
  //   })
  // }

  // function deleteDesktop(id: number) {
  //   return _deleteDesktop({
  //     variables: { id },
  //     update: proxy => {
  //       const cache = proxy.readQuery({ query: DesktopListDocument })
  //       const idx = cache.DesktopList.findIndex(e => e.id === id)
  //       if (idx < 0) return
  //       const DesktopList = cache.Desktop.slice(0, idx).concat(cache.Desktop.slice(idx + 1))
  //       proxy.writeQuery({
  //         query: DesktopListDocument,
  //         data: { DesktopList },
  //       })
  //     },
  //   })
  // }

  const { error: errorCreate$ } = useDesktopCreatedSubscription({
    onSubscriptionData: ({ client, subscriptionData }) => {
      const created = subscriptionData.data?.DesktopCreated
      if (! created) return
      const cache = client.readQuery<{ DesktopList: Desktop[] }>({ query: DesktopListDocument })
      const idx = cache.DesktopList.findIndex(e => e.id === created)
      if (idx < 0) return
      const DesktopList = [...cache.DesktopList.slice(0, idx), ...cache.DesktopList.slice(idx + 1)]
      client.writeQuery({
        query: DesktopListDocument,
        data: { DesktopList },
      })
    },
  })

  // const { error: errorUpdate$ } = useDesktopUpdatedSubscription({
  //   onSubscriptionData: ({ client, subscriptionData }) => {
  //     const updated = subscriptionData.data?.DesktopUpdated
  //     const cache = client.readQuery({ query: DesktopListDocument })
  //     if (! (cache && updated)) return
  //     const idx = cache.DesktopList.findIndex(e => e.id === updated.id)
  //     if (idx < 0) return
  //     const DesktopList = [
  //       ...cache.DesktopList.slice(0, idx),
  //       subscriptionData.data.DesktopUpdated,
  //       ...cache.DesktopList.slice(idx + 1),
  //     ]
  //     client.writeQuery({
  //       query: DesktopListDocument,
  //       data: { DesktopList },
  //     })
  //   },
  // })

  // const { error: errorDelete$ } = useDesktopDeletedSubscription({
  //   onSubscriptionData: ({ client, subscriptionData }) => {
  //     const deleted = subscriptionData.data?.DesktopDeleted
  //     const cache = client.readQuery({ query: DesktopListDocument })
  //     if (! (deleted && cache)) return
  //     const idx = cache.DesktopList.findIndex(e => e.id === deleted)
  //     if (idx < 0) return
  //     const DesktopList = [...cache.DesktopList.slice(0, idx), ...cache.DesktopList.slice(idx + 1)]
  //     client.writeQuery({
  //       query: DesktopListDocument,
  //       data: { DesktopList },
  //     })
  //   },
  // })

  const errors = useMemo(
    () => [
      errorQuery,
      errorCreate,
      // errorUpdate,
      // errorDelete,
      errorCreate$,
      // errorDelete$,
      // errorUpdate$,
    ].reduce((p: undefined | ApolloError[], c: undefined | ApolloError) => {
      if (! c) return p
      if (p) return p.push(c), p
      return [c]
    }, undefined),
    [errorCreate, errorQuery, errorCreate$],
  )

  const listDesktops = data.DesktopList.slice(0).sort((a, b) => b.updated_at - a.updated_at)

  return {
    listDesktops,
    createDesktop,
    // updateDesktop,
    // deleteDesktop,
    errors,
    reload: () => refetch(),
  }
}
