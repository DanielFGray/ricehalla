/* eslint-disable import/no-extraneous-dependencies,global-require */
module.exports = {
  plugins: [
    require('postcss-preset-env')({
      stage: 0,
      browsers: 'last 2 versions',
    }),
    require('tailwindcss'),
    require('@fullhuman/postcss-purgecss')({
      content: ['./src/client/*.css', './src/client/*.jsx', './src/client/*.js'],
    }),
  ],
}
