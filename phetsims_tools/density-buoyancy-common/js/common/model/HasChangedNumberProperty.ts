// Copyright 2024, University of Colorado Boulder

/**
 * NumberProperty that composes an additional Property that monitors if that Property's value has changed or not.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import NumberProperty, { NumberPropertyOptions } from '../../../../axon/js/NumberProperty.js';
import Property from '../../../../axon/js/Property.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

export default class HasChangedNumberProperty extends NumberProperty {

  // Has the value changed? Will stay true even if set 0->1->0 when 0 is the initial value. True until reset.
  public readonly hasChangedProperty: Property<boolean>;

  public constructor( initialValue: number, options: NumberPropertyOptions ) {
    super( initialValue, options );
    this.hasChangedProperty = new BooleanProperty( false, {
      tandem: options.tandem?.createTandem( 'hasChangedProperty' ),
      phetioDocumentation: 'For internal use only',
      phetioReadOnly: true
    } );
    this.lazyLink( () => { this.hasChangedProperty.value = true; } );
  }

  public override reset(): void {
    super.reset();

    // Reset after the potential value change in the super call
    this.hasChangedProperty.reset();
  }

  public override dispose(): void {
    this.hasChangedProperty.dispose();
    super.dispose();
  }
}

densityBuoyancyCommon.register( 'HasChangedNumberProperty', HasChangedNumberProperty );