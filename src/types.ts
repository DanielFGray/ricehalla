import type Koa from 'koa'
import type { DatabaseTransactionConnectionType } from 'slonik'

export interface KoaState extends Koa.DefaultState {
  connection: DatabaseTransactionConnectionType
}
export interface KoaContext extends Koa.ParameterizedContext {
  session: { id: string }
}
export type KoaApp = Koa<KoaState, KoaContext>
