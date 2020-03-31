const fetch = require('isomorphic-unfetch')

exports.seed
/**
 * @param {(arg0: string) => { (): any; new (): any; del: { (): any; new (): any; }; insert: { (arg0: any): any; new (): any; }; }} knex
 */ = async function (knex) {
  // Deletes ALL existing entries
    await knex('desktops').del()
    const res = await fetch('https://ricedb.api.revthefox.co.uk/')
    const users = (await res.json())
      .filter(x => x.dtops && x.dtops.length)
      .map(({ nick, dtops, dotfiles, distros }) => ({
        title: nick,
        urls: dtops.filter(x => x.startsWith('http')).map(x => x.replace(/\s.*$/)),
        description:
        `${dotfiles
          && `# dotfiles:\n${dotfiles
            .filter(x => x.startsWith('http'))
            .map(d => `* ${d}\n`)
            .join('')}`.trim() || ''}${distros
          && `\n# distros:\n${distros.map(d => `* ${d}\n`).join('')}` || ''}`.trim() || null,
      }))
    return knex('desktops').insert(users)
  }
