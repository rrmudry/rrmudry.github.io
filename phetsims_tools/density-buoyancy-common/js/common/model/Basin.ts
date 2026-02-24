// Copyright 2020-2025, University of Colorado Boulder

/**
 * Represents a basin that a fluid can reside in at a specific level. This is used for the pool and fluid in the boat.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Property from '../../../../axon/js/Property.js';
import { findRoot } from '../../../../dot/js/util/findRoot.js';
import Range from '../../../../dot/js/Range.js';
import optionize from '../../../../phet-core/js/optionize.js';
import { PhetioObjectOptions } from '../../../../tandem/js/PhetioObject.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import InterpolatedProperty from './InterpolatedProperty.js';
import Mass from './Mass.js';

export type BasinOptions = {
  initialVolume?: number;
  initialY?: number;
} & Pick<PhetioObjectOptions, 'tandem'>;

export default abstract class Basin {

  // In m^3, the volume of fluid contained in this basin
  public readonly fluidVolumeProperty: Property<number>;

  // The y coordinate of the fluid level (absolute in the model, NOT relative to anything)
  public readonly fluidYInterpolatedProperty: InterpolatedProperty<number>;

  // The bottom and top of the basin's area of containment (absolute model coordinates), set during physics engine steps.
  public stepBottom: number;
  public stepTop: number;

  // The masses contained in this basin, set during the physics engine steps.
  public stepMasses: Mass[];

  // A basin that may be contained in this one (boat basin in the pool) NOTE: only one guaranteed
  public childBasin: Basin | null;

  protected constructor( providedOptions?: BasinOptions ) {

    const options = optionize<BasinOptions>()( {
      initialVolume: 0,
      initialY: 0,
      tandem: Tandem.REQUIRED
    }, providedOptions );

    const tandem = options.tandem;

    const fluidTandem = tandem.createTandem( 'fluid' );

    this.fluidVolumeProperty = new NumberProperty( options.initialVolume, {
      tandem: fluidTandem.createTandem( 'volumeProperty' ),
      phetioFeatured: true,
      phetioReadOnly: true,
      range: new Range( 0, Number.POSITIVE_INFINITY ),
      phetioDocumentation: 'The volume of fluid contained in the basin',
      units: 'm^3'
    } );

    this.fluidYInterpolatedProperty = new InterpolatedProperty( options.initialY, {
      interpolate: InterpolatedProperty.interpolateNumber,
      phetioOuterType: InterpolatedProperty.InterpolatedPropertyIO,
      phetioValueType: NumberIO,
      tandem: fluidTandem.createTandem( 'yInterpolatedProperty' ),
      phetioHighFrequency: true,
      phetioReadOnly: true,
      phetioDocumentation: 'The y-value of the fluid in model coordinates (where 0 is the top of the pool)'
    } );

    this.stepBottom = 0;
    this.stepTop = 0;
    this.stepMasses = [];
    this.childBasin = null;
  }

  /**
   * Returns whether a given mass is inside this basin (e.g. if filled with fluid, would it be displacing any
   * fluid).
   */
  public abstract isMassInside( mass: Mass ): boolean;

  /**
   * Returns the maximum area that could be contained with fluid at a given y value.
   */
  protected abstract getMaximumArea( y: number ): number;

  /**
   * Returns the maximum volume that could be contained with fluid up to a given y value.
   */
  protected abstract getMaximumVolume( y: number ): number;

  /**
   * Returns the filled area in the basin (i.e. things that aren't air or fluid) at the given y value
   */
  public getDisplacedArea( y: number ): number {
    let area = 0;
    this.stepMasses.forEach( mass => {
      area += mass.getDisplacedArea( y );
      assert && assert( !isNaN( area ) );
    } );

    // Don't double-count things, since we're counting the full displacement of the child basin's container
    if ( this.childBasin ) {
      area -= this.childBasin.getDisplacedArea( y );
    }

    return area;
  }

  /**
   * Returns the filled volume in the basin (i.e. things that aren't air or fluid) that is below the given y value.
   */
  public getDisplacedVolume( y: number ): number {
    let volume = 0;
    this.stepMasses.forEach( mass => {

      // Don't count volume that is above the basin's top
      volume += mass.getDisplacedVolume( Math.min( y, this.stepTop ) );
      assert && assert( !isNaN( volume ) );
    } );

    assert && assert( this !== this.childBasin );

    // Don't double-count things, since we're counting the full displacement of the child basin's container
    if ( this.childBasin ) {
      volume -= this.childBasin.getDisplacedVolume( Math.min( y, this.childBasin.stepTop ) );
    }

    return volume;
  }

  /**
   * Returns the empty area in the basin (i.e. air, that isn't a solid object) at the given y value.
   */
  private getEmptyArea( y: number ): number {
    return this.getMaximumArea( y ) - this.getDisplacedArea( y );
  }

  /**
   * Returns the empty volume in the basin (i.e. air, that isn't a solid object) that is below the given y value.
   */
  public getEmptyVolume( y: number ): number {
    const emptyVolume = this.getMaximumVolume( y ) - this.getDisplacedVolume( y );

    // p2 can sometimes incorrectly assigns the stepMasses, so we need to be tolerant here if the displacedVolume exceeds the maximum
    return Math.max( 0, emptyVolume );
  }

  /**
   * Computes the fluid's y coordinate, given the current volume
   */
  public computeY(): void {
    const fluidVolume = this.fluidVolumeProperty.value;
    if ( fluidVolume === 0 ) {
      this.fluidYInterpolatedProperty.setNextValue( this.stepBottom );
      return;
    }

    const emptyVolume = this.getEmptyVolume( this.stepTop );
    if ( emptyVolume === fluidVolume ) {
      this.fluidYInterpolatedProperty.setNextValue( this.stepTop );
      return;
    }

    // Due to shapes used, there is no analytical solution.
    this.fluidYInterpolatedProperty.setNextValue( findRoot(
      this.stepBottom,
      this.stepTop,
      DensityBuoyancyCommonConstants.TOLERANCE,

      // We're finding the root (zero), so that's where the empty volume equals the fluid volume
      yTest => this.getEmptyVolume( yTest ) - fluidVolume,

      // The derivative (change of volume) happens to be the area at that section
      yTest => this.getEmptyArea( yTest )
    ) );
  }

  /**
   * Resets to an initial state.
   */
  public reset(): void {
    this.fluidVolumeProperty.reset();
    this.fluidYInterpolatedProperty.reset();
  }
}

densityBuoyancyCommon.register( 'Basin', Basin );