import importX from './configs/imports.js'
import unusedImports from './configs/unused-imports.js'
import style from './configs/style.js'
import defaultConfig from './configs/default.js'
import overrides from './configs/overrides.js'

export default [
  ...defaultConfig,
  ...style,
  ...unusedImports,
  ...importX,
  ...overrides
]
