exports.down = knex => knex.schema
  .dropTableIfExists('desktops')

exports.up = async knex => {
  await knex.schema.createTable('desktops', t => {
    t.increments('id').primary()
    t.text('title')
    t.specificType('urls', 'text[]')
    t.text('description')
    t.timestamps(true, true)
  })
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_desktops_updated_at
    BEFORE UPDATE ON desktops
    FOR EACH ROW
    EXECUTE PROCEDURE update_modified_column();
  `)
}
