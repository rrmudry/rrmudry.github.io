// Copyright 2024, University of Colorado Boulder

/**
 * ESLint configuration for density-buoyancy-common.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import simEslintConfig from '../perennial-alias/js/eslint/config/sim.eslint.config.mjs';

export default [
  ...simEslintConfig,
  {
    languageOptions: {
      globals: {
        p2: 'readonly',
        THREE: 'readonly'
      }
    }
  },
  {
    files: [ '**/*.ts' ],
    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': false,
          'ts-ignore': true,
          'ts-check': true,
          'ts-nocheck': true
        }
      ]
    }
  }
];