module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  projects: [
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/client/**/__tests__/**/*.{ts,tsx}', '<rootDir>/src/client/**/*.{test,spec}.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['@swc/jest', {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: true,
            },
            transform: {
              react: {
                runtime: 'automatic',
              },
            },
          },
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^react-native$': 'react-native-web',
      },
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/server/**/__tests__/**/*.{ts,tsx}', '<rootDir>/src/server/**/*.{test,spec}.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/src/server/__tests__/jest.setup.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['@swc/jest', {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: false,
            },
          },
        }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(uuid)/)'
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^uuid$': '<rootDir>/node_modules/uuid/dist/index.js',
      },

    },
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': 'react-native-web',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/server/__tests__/**/*',
    '!src/server/**/*.test.{ts,tsx}',
    '!src/server/**/*.spec.{ts,tsx}',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
};