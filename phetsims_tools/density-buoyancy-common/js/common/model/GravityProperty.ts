// Copyright 2024-2025, University of Colorado Boulder

/**
 * GravityProperty adds a more domain-specific name for the value property. It is analogous to MaterialProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DynamicProperty from '../../../../axon/js/DynamicProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import PickRequired from '../../../../phet-core/js/types/PickRequired.js';
import { PhetioObjectOptions } from '../../../../tandem/js/PhetioObject.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import Gravity from './Gravity.js';
import MappedWrappedProperty, { MappedWrappedPropertyOptions } from './MappedWrappedProperty.js';

type GravityPropertyOptions = MappedWrappedPropertyOptions<Gravity> & PickRequired<PhetioObjectOptions, 'tandem'>;

export default class GravityProperty extends MappedWrappedProperty<Gravity> {

  // Takes the value of the currently selected Gravity instance
  public readonly gravityValueProperty: TReadOnlyProperty<number>;

  public readonly customGravity: Gravity;

  public constructor( gravity: Gravity, customGravity: Gravity, availableValues: Gravity[], providedOptions: GravityPropertyOptions ) {
    super( gravity, customGravity, availableValues, providedOptions );

    this.gravityValueProperty = new DynamicProperty<number, number, Gravity>( this, {
      bidirectional: false,
      derive: value => value.valueProperty
    } );
    this.customGravity = this.customValue;
  }
}
densityBuoyancyCommon.register( 'GravityProperty', GravityProperty );