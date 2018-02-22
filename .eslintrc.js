// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',    
    ecmaVersion: 2017,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  env: {
    browser: true,
  },
  extends: [
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    'standard'
  ],
  // add your custom rules here
  rules: {
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // warning on unused vars
    'no-unused-vars': 1,
    // turn off handling callback errors
    'handle-callback-err': 0,
    'operator-linebreak': 0,
    'semi': 0,
    'space-before-function-paren': 0,
    'comma-dangle': 0,
    'computed-property-spacing': 0,
  },
};
