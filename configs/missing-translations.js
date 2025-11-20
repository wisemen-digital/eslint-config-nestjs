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
