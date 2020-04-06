require('dotenv/config')
const { setupSlonikMigrator } = require('@slonik/migrator')
const { createPool } = require('slonik')

const { OWNER_CONNECTION } = process.env
const slonik = createPool(OWNER_CONNECTION)

const migrator = setupSlonikMigrator({
  migrationsPath: `${__dirname}/migrations`,
  slonik,
  mainModule: module,
})

module.exports = { slonik, migrator }
