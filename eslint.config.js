import importX from './configs/imports.js'
import unusedImports from './configs/unused-imports.js'
import style from './configs/style.js'
import defaultConfig from './configs/default.js'
import overrides from './configs/overrides.js'
import missingTranslations from './configs/missing-translations.js'

/**
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  ...defaultConfig,
  ...style,
  ...unusedImports,
  ...importX,
  ...overrides,
  ...missingTranslations
]

export default config
