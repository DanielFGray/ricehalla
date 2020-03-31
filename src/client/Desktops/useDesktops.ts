import { useEffect } from 'react'
import { ApolloError } from 'apollo-client'
import {
  useDesktopListQuery,
  useDesktopCreateMutation,
  // useDesktopUpdateMutation,
  // useDesktopDeleteMutation,
  useDesktopCreatedSubscription,
  useDesktopUpdatedSubscription,
  useDesktopDeletedSubscription,
  DesktopListDocument,
  DesktopCreateMutationVariables,
  // DesktopUpdateMutationVariables,
} from '../../generated-types'

export default function useDesktops() {
  const { data, refetch, error: errorQuery } = useDesktopListQuery()
  const [CreateDesktop, { error: errorCreate }] = useDesktopCreateMutation()
  // const [UpdateDesktop, { error: errorUpdate }] = useDesktopUpdateMutation()
  // const [DeleteDesktop, { error: errorDel }] = useDesktopDeleteMutation()

  const createDesktop = ({ description, title, urls }: DesktopCreateMutationVariables) => CreateDesktop({
    variables: { description, title, urls },
    optimisticResponse: {
      __typename: 'Mutation',
      DesktopCreate: {
        __typename: 'Desktop',
        description,
        title,
        urls,
      },
    },
    update: (proxy, result) => {
      const created = result.data.DesktopCreate
      const cache = proxy.readQuery({ query: DesktopListDocument })
      // const exists = cache.Desktop.findIndex(e => e.id === created.id)
      // if (exists > -1) return
      const DesktopList = [created, ...cache.Desktop]
      proxy.writeQuery({
        query: DesktopListDocument,
        data: { DesktopList },
      })
    },
  })

  const { error: creSubErr } = useDesktopCreatedSubscription({
    onSubscriptionData: ({ client, subscriptionData }) => {
      const created = subscriptionData.data?.DesktopCreated
      if (! created) return
      const cache = client.readQuery({ query: DesktopListDocument })
      const idx = cache.Desktop.findIndex(e => e.id === created)
      if (idx < 0) return
      const DesktopList = [...cache.Desktop.slice(0, idx), ...cache.Desktop.slice(idx + 1)]
      client.writeQuery({
        query: DesktopListDocument,
        data: { DesktopList },
      })
    },
  })

  // const { error: delSubErr } = useDesktopDeletedSubscription({
  //   onSubscriptionData: ({ client, subscriptionData }) => {
  //     const deleted = subscriptionData.data?.DesktopDeleted
  //     if (!deleted) return
  //     const cache = client.readQuery({ query: DesktopListDocument })
  //     const idx = cache.Desktop.findIndex(e => e.id === deleted)
  //     if (idx < 0) return
  //     const DesktopList = [...cache.Desktop.slice(0, idx), ...cache.Desktop.slice(idx + 1)]
  //     client.writeQuery({
  //       query: DesktopListDocument,
  //       data: { DesktopList },
  //     })
  //   },
  // })

  // const { error: updSubErr } = useDesktopUpdatedSubscription({
  //   onSubscriptionData: ({ client, subscriptionData }) => {
  //     const updated = subscriptionData.data?.DesktopUpdated
  //     if (!updated) return
  //     const cache = client.readQuery({ query: DesktopListDocument })
  //     const idx = cache.Desktop.findIndex(e => e.id === updated.id)
  //     if (idx < 0) return
  //     const DesktopList = [
  //       ...cache.Desktop.slice(0, idx),
  //       subscriptionData.data.DesktopUpdated,
  //       ...cache.Desktop.slice(idx + 1),
  //     ]
  //     client.writeQuery({
  //       query: DesktopListDocument,
  //       data: { DesktopList },
  //     })
  //   },
  // })

  const errors = [
    errorQuery,
    errorCreate,
    // errorUpdate,
    // errorDel,
    creSubErr,
    // delSubErr,
    // updSubErr,
  ].reduce((p: undefined | ApolloError[], c: undefined | ApolloError) => {
    if (! c) return p
    if (p) return p.concat(c)
    return [c]
  }, undefined)

  const listDesktops = data?.Desktop.slice(0).sort((a, b) => b.updated_at - a.updated_at)

  // const updateDesktop = ({ id, description, title, urls }: DesktopUpdateMutationVariables) =>
  //   UpdateDesktop({
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
  //       const idx = cache.Desktop.findIndex(e => e.id === id)
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

  // const deleteDesktop = (id: number) => DeleteDesktop({
  //   variables: { id },
  //   update: proxy => {
  //     const cache = proxy.readQuery({ query: DesktopListDocument })
  //     const idx = cache.Desktop.findIndex(e => e.id === id)
  //     if (idx < 0) return
  //     const DesktopList = [
  //       ...cache.Desktop.slice(0, idx),
  //       ...cache.Desktop.slice(idx + 1),
  //     ]
  //     proxy.writeQuery({
  //       query: DesktopListDocument,
  //       data: { DesktopList },
  //     })
  //   },
  // })

  return {
    listDesktops,
    createDesktop,
    // updateDesktop,
    // deleteDesktop,
    errors,
    reload: () => {
      refetch()
    },
  }
}
