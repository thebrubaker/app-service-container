const path = require('path')

module.exports = {
  rootDir: path.resolve(__dirname, '../'),
  moduleFileExtensions: [
    'js',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/babel-jest',
  },
  coverageDirectory: '<rootDir>/test/coverage',
  collectCoverageFrom: [
    'src/**/*.{js}',
    '!**/node_modules/**'
  ]
}
