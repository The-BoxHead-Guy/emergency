import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));
const testsDir = fileURLToPath(new URL('./tests', import.meta.url));

const sharedPack = {
  platform: 'browser' as const,
  target: 'es2022',
  sourcemap: true,
  minify: false,
  css: {
    modules: {
      generateScopedName: 'de-emergency-[local]-[hash]',
    },
  },
};

export default defineConfig({
  pack: [
    {
      ...sharedPack,
      name: 'emergency-esm',
      entry: ['src/index.ts'],
      format: ['esm', 'cjs'],
      outDir: 'dist',
      clean: true,
      dts: true,
      fixedExtension: false,
      deps: {
        neverBundle: [
          /^react($|\/)/,
          /^react-dom($|\/)/,
          'zustand',
          /^zustand\//,
          'axios',
          /^axios\//,
          'pusher-js',
        ],
      },
      css: {
        ...sharedPack.css,
        fileName: 'styles.css',
        inject: false,
      },
    },
    {
      ...sharedPack,
      name: 'emergency-iife',
      entry: { emergency: 'src/iife.ts' },
      format: ['iife'],
      globalName: 'DataEmergenciaEmergency',
      outDir: 'dist/iife',
      clean: true,
      minify: true,
      dts: false,
      outExtensions: () => ({ js: '.global.js' }),
      deps: {
        alwaysBundle: [/.*/],
      },
      css: {
        ...sharedPack.css,
        minify: true,
        inject: true,
      },
    },
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': srcDir,
      '@tests': testsDir,
    },
  },
  test: {
    name: 'emergency',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
    css: true,
    reporters: ['default'],
  },
  lint: {
    ignorePatterns: [
      'dist/**',
      'coverage/**',
      'examples/**',
      'scripts/**',
      '*.mjs',
    ],
    options: {
      denyWarnings: true,
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-extra-boolean-cast': 'error',
      'no-implicit-coercion': 'error',
      curly: ['error', 'all'],
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': 'warn',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**', './**'],
              message:
                "Relative imports are forbidden. Use the '@/…' (src) or '@tests/…' aliases instead.",
            },
          ],
        },
      ],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@stylistic/padding-line-between-statements': [
        'error',
        ...[
          'if',
          'return',
          'for',
          'while',
          'do',
          'switch',
          'try',
          'throw',
        ].flatMap((stmt) => [
          { blankLine: 'always', prev: '*', next: stmt },
          { blankLine: 'always', prev: stmt, next: '*' },
        ]),
      ],
    },
    jsPlugins: [
      {
        name: 'import-js',
        specifier: 'eslint-plugin-import',
      },
      {
        name: '@stylistic',
        specifier: '@stylistic/eslint-plugin',
      },
    ],
  },
  fmt: {
    printWidth: 80,
    tabWidth: 2,
    singleQuote: true,
    semi: true,
    singleAttributePerLine: false,
    htmlWhitespaceSensitivity: 'css',
    sortPackageJson: false,
    ignorePatterns: [
      '.github/**',
      'project.json',
      'AGENTS.md',
      'dist/**',
      'examples/**',
      'pnpm-lock.yaml',
    ],
  },
});
