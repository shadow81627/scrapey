module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'prettier',
    'prettier/@typescript-eslint',
    // 'plugin:@typescript-eslint/recommended',
    // 'plugin:prettier/recommended',
  ],
  plugins: [
    //
    '@typescript-eslint',
    'prettier',
  ],
};
