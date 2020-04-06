const fetch = require('isomorphic-unfetch')

/** type {(knex: import('knex')) => Promise<void>} */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex
    .withSchema('app_public')
    .from('desktops')
    .del()
  const res = await fetch('https://ricedb.api.revthefox.co.uk/')
  const users = (await res.json())
    .map(x => ({
      urls: x.dtops && x.dtops.filter(u => u.startsWith('http')).map(u => u.replace(/\s.*$/)),
      title: x.nick,
      description:
        `${[
          (x.dotfiles
            && `# dotfiles:\n${x.dotfiles
              .filter(d => d.startsWith('http'))
              .map(d => `* ${d}\n`)
              .join('')}`.trim())
            || '',
          (x.distros && `# distros:\n${x.distros.map(d => `* ${d}\n`).join('')}`) || '',
        ]
          .filter(Boolean)
          .join('\n\n')}`.trim() || null,
    }))
    .filter(x => x && x.urls && x.urls.length)
  return Promise.all(
    users.map(x => knex
      .withSchema('app_public')
      .from('desktops')
      .insert(x)
      .then(e => (console.log(e), e))),
  )
}
