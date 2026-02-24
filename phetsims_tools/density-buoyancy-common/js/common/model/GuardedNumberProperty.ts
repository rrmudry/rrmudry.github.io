// Copyright 2024, University of Colorado Boulder

/**
 * For PhET-iO, GuardedNumberProperty is a NumberProperty that has a custom validation function that can be used to
 * provide more specific validation error messages.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import NumberProperty, { NumberPropertyOptions } from '../../../../axon/js/NumberProperty.js';
import optionize from '../../../../phet-core/js/optionize.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

type SelfOptions = { getPhetioSpecificValidationError: ( value: number ) => string | null };

export type GuardedNumberPropertyOptions = NumberPropertyOptions & SelfOptions;

export class GuardedNumberProperty extends NumberProperty {

  // Property validation logic is run for every value set, so it cannot be used in cases where we only want validation
  // for setting the value during a PhET-iO API call.
  protected readonly getPhetioSpecificValidationError: ( number: number ) => string | null;

  public constructor( value: number, providedOptions: GuardedNumberPropertyOptions ) {
    const options = optionize<GuardedNumberPropertyOptions, SelfOptions, NumberPropertyOptions>()( {}, providedOptions );
    super( value, options );

    this.getPhetioSpecificValidationError = options.getPhetioSpecificValidationError;
  }

  public override getValidationError( value: number ): string | null {

    // Fails early on the first error encountered, so check the superclass validation first
    return super.getValidationError( value ) || this.getPhetioSpecificValidationError( value );
  }
}

densityBuoyancyCommon.register( 'GuardedNumberProperty', GuardedNumberProperty );