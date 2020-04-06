import { createPool } from 'slonik'
const { VISITOR_CONNECTION, OWNER_CONNECTION } = process.env

export const ownerPool = createPool(OWNER_CONNECTION)
export const visitorPool = createPool(VISITOR_CONNECTION)
