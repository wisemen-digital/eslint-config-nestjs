import checkMissingTranslations from '../custom-rules/check-missing-translations.js'

export default [
 {
    plugins: {
      'custom-rules': {
        rules: {
          'check-missing-translations': checkMissingTranslations
        }
      }
    },
    rules: {
      'custom-rules/check-missing-translations': 'error'
    }
  },
]
