module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    'testing-library',
    'jest'
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    // @ts-nocheck migration en cours (30 fichiers) — à repasser en error une fois terminé
    '@typescript-eslint/ban-ts-comment': 'warn',
    'react/no-unescaped-entities': 'off',
    'prefer-const': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  },
  overrides: [
    {
      // Règles testing-library et jest uniquement sur les fichiers de test
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: [
        'plugin:testing-library/react',
        'plugin:jest/recommended'
      ]
    }
  ]
} 