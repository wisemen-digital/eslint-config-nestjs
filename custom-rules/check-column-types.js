/**
 * ESLint rule to verify that TypeScript property types match @Column decorator options
 *
 * Checks:
 * - If type includes `null`, @Column must have `nullable: true`
 * - If @Column has `nullable: true`, type must include `null`
 * - If @Column has a `default` value, type must be wrapped in `Default<>`
 * - If @Column has no `default` value, type must not be wrapped in `Default<>`
 *
 * Applies to classes ending with: Column
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure @Column decorator options match TypeScript property types',
      category: 'Possible Errors',
      recommended: true
    },
    messages: {
      missingNullable: 'Property type includes null but @Column is missing `nullable: true`',
      unnecessaryNullable: '@Column has `nullable: true` but property type does not include null',
      missingDefault: '@Column has a `default` value but property type is not wrapped in Default',
      unnecessaryDefault: 'Property type is wrapped in Default but @Column has no `default` value'
    },
    schema: []
  },

  create(context) {
    /**
     * Parse TypeScript type annotation to check for null and undefined
     */
    function parseTypeAnnotation(typeAnnotation) {
      if (!typeAnnotation) return { hasNull: false, isWrappedInDefault: false }

      const result = { hasNull: false, isWrappedInDefault: false }

      if (
        typeAnnotation.type === 'TSTypeReference'
        && typeAnnotation.typeName.type === 'Identifier'
        && typeAnnotation.typeName.name === 'Default'
      ) {
        result.isWrappedInDefault = true
      }

      function traverse(node) {
        if (!node) return

        // Handle union types (e.g., string | null | undefined)
        if (node.type === 'TSUnionType') {
          for (const type of node.types) {
            traverse(type)
          }
        } else if (node.type === 'TSNullKeyword') {
          result.hasNull = true
        }
      }

      traverse(typeAnnotation)

      return result
    }

    function isUndefinedExpression(node) {
      if (!node) {
        return true
      }

      if (node.type === 'Identifier' && node.name === 'undefined') {
        return true
      }

      return node.type === 'UnaryExpression' && node.operator === 'void'
    }

    /**
     * Extract @Column decorator options
     */
    function getColumnOptions(decorators) {
      if (!decorators) {
        return null
      }

      for (const decorator of decorators) {
        if (decorator.expression.type === 'CallExpression') {
          const callee = decorator.expression.callee

          // Check if it's @Column or any decorator ending with Column
          const isColumn = callee.type === 'Identifier'
            && (callee.name === 'Column' || callee.name.endsWith('Column'))
            && callee.name !== 'JoinColumn'
            && callee.name !== 'DeleteDateColumn'

          if (isColumn && decorator.expression.arguments.length > 0) {
            const options = decorator.expression.arguments[0]

            if (options.type === 'ObjectExpression') {
              const result = { nullable: false, hasDefault: false }

              for (const prop of options.properties) {
                if (prop.type !== 'Property') {
                  continue
                }

                const keyName = prop.key.type === 'Identifier'
                  ? prop.key.name
                  : prop.key.type === 'Literal'
                    ? prop.key.value
                    : null

                if (keyName === 'nullable' && prop.value.type === 'Literal') {
                  result.nullable = prop.value.value === true
                }

                if (keyName === 'default' && !isUndefinedExpression(prop.value)) {
                  result.hasDefault = true
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
    function checkPropertyDefinition(node) {
      // Only check properties with @Column decorator
      const columnOptions = getColumnOptions(node.decorators)

      if (!columnOptions) {
        return
      }

      // Parse the TypeScript type annotation
      const typeInfo = parseTypeAnnotation(node.typeAnnotation?.typeAnnotation)

      const { hasNull, isWrappedInDefault } = typeInfo
      const { nullable, hasDefault } = columnOptions

      // Check all four combinations for comprehensive validation
      const needsNullable = hasNull
      const hasNullable = nullable

      // Check nullable separately
      if (needsNullable && !hasNullable) {
        context.report({ node, messageId: 'missingNullable' })
      } else if (!needsNullable && hasNullable) {
        context.report({ node, messageId: 'unnecessaryNullable' })
      }

      if (hasDefault && !isWrappedInDefault) {
        context.report({ node, messageId: 'missingDefault' })
      } else if (!hasDefault && isWrappedInDefault) {
        context.report({ node, messageId: 'unnecessaryDefault' })
      }
    }

    return {
      ClassDeclaration(node) {
        const className = node.id?.name

        for (const member of node.body.body) {
          if (member.type === 'PropertyDefinition') {
            checkPropertyDefinition(member, className)
          }
        }
      }
    }
  }
}
