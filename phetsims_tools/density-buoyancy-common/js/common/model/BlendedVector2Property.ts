// Copyright 2024, University of Colorado Boulder

/**
 * A Property that blends a Vector2 Property between the old and new value based on the distance between them.
 *
 * Please see BlendedNumberProperty to see the number implementation of this concept.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../../../axon/js/Property.js';
import Utils from '../../../../dot/js/Utils.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

export default class BlendedVector2Property extends Property<Vector2> {

  public step( newValue: Vector2 ): void {
    const oldValue = this.value;

    // choose the blendAmount based on the distance between values
    // This adds a hysteresis effect to the readout, which reduces flickering inherent to the model.
    const MIN_BLEND = 0.1; // When close, blend with the old value more
    const MAX_BLEND = 0.7; // When far apart, take more of the new value. NOTE: this was manually tuned to be different than BlendedNumberProperty.MAX_BLEND

    const blendAmount = Utils.clamp(
      Utils.linear( 0, 1, MIN_BLEND, MAX_BLEND, newValue.minus( oldValue ).magnitude ),
      MIN_BLEND, MAX_BLEND );

    // blend
    this.value = oldValue.blend( newValue, blendAmount );
  }
}

densityBuoyancyCommon.register( 'BlendedVector2Property', BlendedVector2Property );