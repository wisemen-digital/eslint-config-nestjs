import checkApiPropertyTypes from '../custom-rules/check-api-property-types.js'

export default [
 {
    plugins: {
      'custom-rules': {
        rules: {
          'check-api-property-types': checkApiPropertyTypes
        }
      }
    },
    rules: {
      'custom-rules/check-api-property-types': 'error'
    }
  },
]
