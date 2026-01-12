/* eslint-disable @stylistic/max-len */
/**
 * ESLint rule to verify that TypeScript property types match @ApiProperty decorator options
 *
 * Checks:
 * - If type includes `null`, @ApiProperty must have `nullable: true`
 * - If type includes `undefined`, @ApiProperty must have `required: false`
 * - If @ApiProperty has `nullable: true`, type must include `null`
 * - If @ApiProperty has `required: false`, type must include `undefined` or property must have a default value
 *
 * Applies to classes ending with: Response, Command, Query
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure @ApiProperty decorator options match TypeScript property types',
      category: 'Possible Errors',
      recommended: true
    },
    messages: {
      missingNullable: 'Property type includes null but @ApiProperty is missing `nullable: true`',
      missingRequired: 'Property type includes undefined but @ApiProperty is missing `required: false`',
      unnecessaryNullable: '@ApiProperty has `nullable: true` but property type does not include null',
      unnecessaryRequired: '@ApiProperty has `required: false` but property type does not include undefined',
      missingBothNullableRequired: 'Property type includes null and undefined but @ApiProperty is missing both `nullable: true` and `required: false`',
      unnecessaryBothNullableRequired: '@ApiProperty has both `nullable: true` and `required: false` but property type does not include both null and undefined'
    },
    schema: []
  },

  create (context) {
    /**
     * Check if a class name matches the patterns we care about
     */
    function isTargetClass (className) {
      if (!className) return false

      return className.endsWith('Response')
        || className.endsWith('Command')
        || className.endsWith('Query')
        || className.endsWith('Event')
    }

    /**
     * Parse TypeScript type annotation to check for null and undefined
     */
    function parseTypeAnnotation (typeAnnotation) {
      if (!typeAnnotation) return { hasNull: false, hasUndefined: false }

      const result = { hasNull: false, hasUndefined: false }

      function traverse (node) {
        if (!node) return

        // Handle union types (e.g., string | null | undefined)
        if (node.type === 'TSUnionType') {
          for (const type of node.types) {
            traverse(type)
          }
        } else if (node.type === 'TSNullKeyword') {
          result.hasNull = true
        } else if (node.type === 'TSUndefinedKeyword') {
          result.hasUndefined = true
        }
      }

      traverse(typeAnnotation)

      return result
    }

    /**
     * Extract @ApiProperty decorator options
     */
    function getApiPropertyOptions (decorators) {
      if (!decorators) {
        return null
      }

      for (const decorator of decorators) {
        if (decorator.expression.type === 'CallExpression') {
          const callee = decorator.expression.callee

          // Check if it's @ApiProperty or any decorator ending with ApiProperty
          const isApiProperty = callee.type === 'Identifier'
            && (callee.name === 'ApiProperty' || callee.name.endsWith('ApiProperty'))

          if (isApiProperty && decorator.expression.arguments.length > 0) {
            const options = decorator.expression.arguments[0]

            if (options.type === 'ObjectExpression') {
              const result = { nullable: false, required: true }

              for (const prop of options.properties) {
                if (prop.type === 'Property' && prop.key.type === 'Identifier') {
                  if (prop.key.name === 'nullable' && prop.value.type === 'Literal') {
                    result.nullable = prop.value.value === true
                  }
                  if (prop.key.name === 'required' && prop.value.type === 'Literal') {
                    result.required = prop.value.value !== false
                  }
                }
              }

              return result
            }
          }
        }
      }

      return null
    }

    /**
     * Check a class property for type/decorator consistency
     */
    function checkPropertyDefinition (node) {
      // Only check properties with @ApiProperty decorator
      const apiPropertyOptions = getApiPropertyOptions(node.decorators)

      if (!apiPropertyOptions) {
        return
      }

      // Parse the TypeScript type annotation
      const typeInfo = parseTypeAnnotation(node.typeAnnotation?.typeAnnotation)

      const { hasNull, hasUndefined } = typeInfo
      const { nullable, required } = apiPropertyOptions

      // Check if property uses optional syntax (?:) which implicitly adds undefined
      const typeHasUndefined = hasUndefined || node.optional === true

      // Check if property has a default value (initializer)
      const hasDefaultValue = node.value != null

      // Check all four combinations for comprehensive validation
      const needsNullable = hasNull
      const hasNullable = nullable
      const needsRequired = typeHasUndefined
      const hasRequired = !required

      // Check if both null and undefined are needed/present
      if (needsNullable && needsRequired) {
        if (!hasNullable || !hasRequired) {
          context.report({ node, messageId: 'missingBothNullableRequired' })
        }
      } else if (hasNullable && hasRequired) {
        // When checking if required: false is unnecessary, allow it if there's a default value
        if (!needsNullable || (!needsRequired && !hasDefaultValue)) {
          context.report({ node, messageId: 'unnecessaryBothNullableRequired' })
        }
      } else {
        // Check nullable separately
        if (needsNullable && !hasNullable) {
          context.report({ node, messageId: 'missingNullable' })
        } else if (!needsNullable && hasNullable) {
          context.report({ node, messageId: 'unnecessaryNullable' })
        }

        // Check required separately
        if (needsRequired && !hasRequired) {
          context.report({ node, messageId: 'missingRequired' })
        } else if (!needsRequired && hasRequired && !hasDefaultValue) {
          // Only report unnecessaryRequired if there's no default value
          context.report({ node, messageId: 'unnecessaryRequired' })
        }
      }
    }

    return {
      ClassDeclaration (node) {
        const className = node.id?.name

        if (!isTargetClass(className)) {
          return
        }

        for (const member of node.body.body) {
          if (member.type === 'PropertyDefinition') {
            checkPropertyDefinition(member, className)
          }
        }
      }
    }
  }
}
