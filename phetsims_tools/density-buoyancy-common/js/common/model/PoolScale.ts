// Copyright 2024-2025, University of Colorado Boulder

/**
 * A special case scale which height is controlled by a slider. It also extends the invisible part of the scale
 * vertically downward to prevent objects from being dragged beneath it.
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 */

import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Property from '../../../../axon/js/Property.js';
import Range from '../../../../dot/js/Range.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Shape from '../../../../kite/js/Shape.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import GravityProperty from './GravityProperty.js';
import PhysicsEngine from './PhysicsEngine.js';
import Scale, { DisplayType, SCALE_HEIGHT, SCALE_WIDTH } from './Scale.js';

// To prevent objects from being dragged beneath the scale, we extend the invisible part of the scale vertically downward.
// This has to be big enough to cover all the way to the bottom of the pool when the scale is at its maximum height.
const SCALE_INVISIBLE_VERTICAL_EXTENSION_FACTOR = 15;

export default class PoolScale extends Scale {

  // Unitless value between 0 and 1 that represents how high the scale is above the bottom of the pool.
  // See PoolScaleHeightControl for the mapping to model coordinates.
  public readonly heightProperty: Property<number>;

  public constructor( engine: PhysicsEngine, gravityProperty: GravityProperty, tandem: Tandem ) {

    const vertices = [
      new Vector2( -SCALE_WIDTH / 2, -SCALE_HEIGHT / 2 * SCALE_INVISIBLE_VERTICAL_EXTENSION_FACTOR ),
      new Vector2( SCALE_WIDTH / 2, -SCALE_HEIGHT / 2 * SCALE_INVISIBLE_VERTICAL_EXTENSION_FACTOR ),
      new Vector2( SCALE_WIDTH / 2, SCALE_HEIGHT / 2 ),
      new Vector2( -SCALE_WIDTH / 2, SCALE_HEIGHT / 2 )
    ];
    super( engine, gravityProperty, {
      body: engine.createFromVertices( vertices, false, 'STATIC' ),
      shape: Shape.polygon( vertices ),
      displayType: DisplayType.NEWTONS,
      canMove: false, // No input listeners, but the PoolScaleHeightControl can still move it
      inputEnabledPropertyOptions: {
        phetioReadOnly: true
      },
      tandem: tandem,
      phetioDocumentation: 'A scale that can be used to measure the mass/weight of objects stacked on top. Constrained to remain in the pool.'
    } );

    this.heightProperty = new NumberProperty( DensityBuoyancyCommonConstants.POOL_SCALE_INITIAL_HEIGHT, {
      range: new Range( 0, 1 ),
      tandem: tandem.createTandem( 'heightProperty' ),
      phetioFeatured: true
    } );
  }

  public override reset(): void {
    super.reset();
    this.heightProperty.reset();

    // The model position of the pool is reset before, so even if this Property value doesn't change, we need to reposition via listeners
    // Otherwise the scale itself will be in the wrong position.
    this.heightProperty.notifyListenersStatic();
  }
}

densityBuoyancyCommon.register( 'PoolScale', PoolScale );