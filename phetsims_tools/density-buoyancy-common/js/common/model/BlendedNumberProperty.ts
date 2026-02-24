// Copyright 2024, University of Colorado Boulder

/**
 * A Property that blends a number property between the old and new value based on the distance between them.
 *
 * Please see BlendedVector2Property to see the vector implementation of this concept.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../../../axon/js/Property.js';
import Utils from '../../../../dot/js/Utils.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

export default class BlendedNumberProperty extends Property<number> {

  public step( newValue: number ): void {
    const oldValue = this.value;

    // choose the blendAmount based on the distance between values
    // This adds a hysteresis effect to the readout, which reduces flickering inherent to the model.
    const MIN_BLEND = 0.1; // When close, blend with the old value more
    const MAX_BLEND = 1; // When far apart, take the new value completely
    const blendAmount = Utils.clamp( Utils.linear( 0, 1, MIN_BLEND, MAX_BLEND, Math.abs( newValue - oldValue ) ), MIN_BLEND, MAX_BLEND );

    // blend
    this.value = blendAmount * newValue + ( 1 - blendAmount ) * oldValue;
  }
}

densityBuoyancyCommon.register( 'BlendedNumberProperty', BlendedNumberProperty );