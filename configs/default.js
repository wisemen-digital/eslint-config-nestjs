import globals from 'globals'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat()

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}']
  },
  {
    languageOptions: { globals: globals.node }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.config({
    parserOptions: {
      project: true
    },
    rules: {
      '@typescript-eslint/strict-boolean-expressions': 'error'
    }
  }),
  {
    rules: {
      'no-undef': 'error',
      'no-console': 'warn',
      'curly': [
        'error', 'multi-line'
      ],
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'class', format: ['PascalCase'] }
      ],
      'nonblock-statement-body-position': [
        'error', 'beside'
      ]
    }
  }
]
