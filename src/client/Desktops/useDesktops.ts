import { useMemo } from 'react'
import { ApolloError } from 'apollo-client'
import {
  DesktopListDocument,
  UpdateDesktopMutationVariables,
  CreateDesktopMutationVariables,
  Desktop,
  DesktopsOrderBy,
  useDesktopListQuery,
  useCreateDesktopMutation,
  useUpdateDesktopMutation,
  useDeleteDesktopMutation,
} from '../../generated-types'

export default function useDesktops() {
  const { data, refetch, error: errorQuery } = useDesktopListQuery({
    variables: {
      orderBy: [DesktopsOrderBy.Natural],
      offset: 0,
      first: 100,
    },
  })
  const [_createDesktop, { error: errorCreate }] = useCreateDesktopMutation()
  const [_updateDesktop, { error: errorUpdate }] = useUpdateDesktopMutation()
  const [_deleteDesktop, { error: errorDelete }] = useDeleteDesktopMutation()

  function createDesktop({ description, title, urls }: CreateDesktopMutationVariables) {
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
        const created = result.data?.createDesktop
        const cache = proxy.readQuery<{ DesktopList: Desktop[] }>({ query: DesktopListDocument })
        if (! (created && cache)) return
        const DesktopList = [created, ...cache.DesktopList]
        proxy.writeQuery({
          query: DesktopListDocument,
          data: { DesktopList },
        })
      },
    })
  }

  function updateDesktop({ id, description, title, urls }: UpdateDesktopMutationVariables) {
    return _updateDesktop({
      variables: { id, description, title, urls },
      optimisticResponse: {
        __typename: 'Mutation',
        DesktopUpdate: {
          __typename: 'Desktop',
          id,
          description,
          urls,
          title,
        },
      },
      update: (proxy, result) => {
        const cache = proxy.readQuery({ query: DesktopListDocument })
        const idx = cache.DesktopList.findIndex(e => e.id === id)
        if (idx < 0) return
        const DesktopList = [
          ...cache.Desktop.slice(0, idx),
          result.data.DesktopUpdate,
          ...cache.Desktop.slice(idx + 1),
        ]
        proxy.writeQuery({
          query: DesktopListDocument,
          data: { DesktopList },
        })
      },
    })
  }

  function deleteDesktop({ id }: { id: number }) {
    return _deleteDesktop({
      variables: { id },
      update: proxy => {
        const cache = proxy.readQuery({ query: DesktopListDocument })
        if (!cache) return
        const idx = cache.DesktopList.findIndex(e => e.id === id)
        if (idx < 0) return
        const DesktopList = cache.Desktop.slice(0, idx).concat(cache.Desktop.slice(idx + 1))
        proxy.writeQuery({
          query: DesktopListDocument,
          data: { DesktopList },
        })
      },
    })
  }

  const errors = [
    errorUpdate,
    errorDelete,
    errorCreate,
    errorQuery,
  ].reduceRight((p: null | ApolloError[], c: undefined | ApolloError) => {
    if (! c) return p
    if (p) {
      p.push(c)
      return p
    }
    return [c]
  }, null)

  const listDesktops = data?.desktops?.nodes
    .filter(Boolean)
    .sort((a, b) => (b?.updatedAt - a?.updatedAt))

  return {
    listDesktops,
    createDesktop,
    updateDesktop,
    deleteDesktop,
    errors,
    reload: () => refetch(),
  }
}
