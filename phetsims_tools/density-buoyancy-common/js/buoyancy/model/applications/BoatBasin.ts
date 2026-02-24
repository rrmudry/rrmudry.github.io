// Copyright 2020-2025, University of Colorado Boulder

/**
 * Represents the basin of the interior of the boat where fluid can reside at a specific level.
 *
 * Additional class responsibilities include:
 * - Whether a mass (like an object) is inside the basin.
 * - The maximum area and volume that can be filled with fluid at a given height.
 *
 *  The `BoatBasin` exists for the lifetime of the simulation and does not need to be disposed.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Vector2 from '../../../../../dot/js/Vector2.js';
import Shape from '../../../../../kite/js/Shape.js';
import Tandem from '../../../../../tandem/js/Tandem.js';
import DensityBuoyancyCommonConstants from '../../../common/DensityBuoyancyCommonConstants.js';
import Basin from '../../../common/model/Basin.js';
import Mass from '../../../common/model/Mass.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import Boat from './Boat.js';
import BoatDesign from './BoatDesign.js';

export default class BoatBasin extends Basin {

  // Used for intersection
  public readonly oneLiterShape = Shape.polygon( BoatDesign.getBasinOneLiterVertices() );

  public constructor( private readonly boat: Boat, tandem: Tandem ) {
    super( {
      initialVolume: 0,
      initialY: 0,
      tandem: tandem
    } );
  }

  /**
   * Returns whether a given mass is inside this basin (e.g. if filled with fluid, would it be displacing any liquid).
   * See Pool.isMassInside
   */
  public isMassInside( mass: Mass ): boolean {
    if ( mass === this.boat || mass.stepBottom >= this.stepTop || mass.stepTop <= this.stepBottom - DensityBuoyancyCommonConstants.SLIP ) {
      return false;
    }
    const stepMiddle = ( mass.stepTop + mass.stepBottom ) / 2;
    return this.oneLiterShapeContainsPoint( new Vector2( mass.stepX, mass.stepBottom ) ) ||
           this.oneLiterShapeContainsPoint( new Vector2( mass.stepX, stepMiddle ) );
  }

  /**
   * Factored out way to take a point in absolute model coordinates, and determine if it is contained in the boat. This
   * accounts for "slip", which occurs when two objects overlap a bit due to physics stiffness modeling.
   */
  private oneLiterShapeContainsPoint( point: Vector2 ): boolean {
    const oneLiterPoint = point.minus( this.boat.matrix.translation ).timesScalar( 1 / this.boat.stepMultiplier );

    // Check both a point slightly below AND the actual point.
    const slippedPoint = oneLiterPoint.plusXY( 0, DensityBuoyancyCommonConstants.SLIP );
    return ( this.oneLiterShape.bounds.containsPoint( oneLiterPoint ) || this.oneLiterShape.bounds.containsPoint( slippedPoint ) ) &&
           ( this.oneLiterShape.containsPoint( oneLiterPoint ) || this.oneLiterShape.containsPoint( slippedPoint ) );
  }

  /**
   * Returns the maximum area that could be contained with fluid at a given y value.
   */
  protected getMaximumArea( y: number ): number {
    return this.boat.getBasinArea( y );
  }

  /**
   * Returns the maximum volume that could be contained with fluid up to a given y value.
   */
  public getMaximumVolume( y: number ): number {
    return this.boat.getBasinVolume( y );
  }
}

densityBuoyancyCommon.register( 'BoatBasin', BoatBasin );