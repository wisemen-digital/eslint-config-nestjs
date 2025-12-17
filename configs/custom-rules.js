import checkMissingTranslations from '../custom-rules/check-missing-translations.js'
import checkApiPropertyTypes from '../custom-rules/check-api-property-types.js'
import checkColumnTypes from '../custom-rules/check-column-types.js'

export default [
  {
    plugins: {
      'custom-rules': {
        rules: {
          'check-missing-translations': checkMissingTranslations,
          'check-api-property-types': checkApiPropertyTypes,
          'check-column-types': checkColumnTypes
        }
      }
    },
    rules: {
      'custom-rules/check-missing-translations': 'error',
      'custom-rules/check-api-property-types': 'error',
      'custom-rules/check-column-types': 'error'
    }
  },
]
