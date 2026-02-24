// Copyright 2019-2025, University of Colorado Boulder

/**
 * A cylinder laying on its side (the caps are on the left/right)
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import NumberProperty from '../../../../../axon/js/NumberProperty.js';
import Property from '../../../../../axon/js/Property.js';
import Bounds3 from '../../../../../dot/js/Bounds3.js';
import Range from '../../../../../dot/js/Range.js';
import Utils from '../../../../../dot/js/Utils.js';
import Vector3 from '../../../../../dot/js/Vector3.js';
import Shape from '../../../../../kite/js/Shape.js';
import optionize, { EmptySelfOptions } from '../../../../../phet-core/js/optionize.js';
import StrictOmit from '../../../../../phet-core/js/types/StrictOmit.js';
import DensityBuoyancyCommonConstants from '../../../common/DensityBuoyancyCommonConstants.js';
import Mass, { InstrumentedMassOptions, MASS_MAX_SHAPES_DIMENSION, MASS_MIN_SHAPES_DIMENSION, MassOptions } from '../../../common/model/Mass.js';
import { MassShape } from '../../../common/model/MassShape.js';
import PhysicsEngine from '../../../common/model/PhysicsEngine.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';

export type HorizontalCylinderOptions = StrictOmit<InstrumentedMassOptions, 'body' | 'shape' | 'volume' | 'massShape'>;

export default class HorizontalCylinder extends Mass {

  public readonly radiusProperty: Property<number>;
  public readonly lengthProperty: Property<number>;

  // Step information
  private stepRadius: number;
  private stepMaximumVolume: number;
  private stepMaximumArea: number;

  public constructor( engine: PhysicsEngine, radius: number, length: number, providedOptions: HorizontalCylinderOptions ) {
    const options = optionize<HorizontalCylinderOptions, EmptySelfOptions, MassOptions>()( {
      body: engine.createBox( length, radius * 2 ),
      shape: HorizontalCylinder.getHorizontalCylinderShape( radius, length ),
      volume: HorizontalCylinder.getVolume( radius, length ),
      massShape: MassShape.HORIZONTAL_CYLINDER
    }, providedOptions );

    super( engine, options );

    this.radiusProperty = new NumberProperty( radius, {
      tandem: options.tandem.createTandem( 'radiusProperty' ),
      range: new Range( 0, Number.POSITIVE_INFINITY ),
      phetioReadOnly: true
    } );
    this.lengthProperty = new NumberProperty( length, {
      tandem: options.tandem.createTandem( 'lengthProperty' ),
      range: new Range( 0, Number.POSITIVE_INFINITY )
    } );

    this.stepRadius = 0;
    this.stepMaximumVolume = 0;
    this.stepMaximumArea = 0;

    this.updateSize( radius, length );
  }

  /**
   * Updates the size of the cone.
   */
  private updateSize( radius: number, length: number ): void {
    this.engine.updateBox( this.body, length, radius * 2 );

    this.radiusProperty.value = radius;
    this.lengthProperty.value = length;

    this.shapeProperty.value = HorizontalCylinder.getHorizontalCylinderShape( radius, length );

    this.volumeProperty.value = HorizontalCylinder.getVolume( radius, length );

    this.forceOffsetProperty.value = new Vector3( 0, 0, radius );
    this.massLabelOffsetProperty.value = new Vector3( 0, -radius * 0.5, radius * 0.7 );
  }

  protected override getLocalBounds(): Bounds3 {
    const bounds2 = this.shapeProperty.value.bounds;
    return new Bounds3( bounds2.minX, bounds2.minY, -this.radiusProperty.value, bounds2.maxX, bounds2.maxY, this.radiusProperty.value );
  }

  /**
   * Returns the radius from a general size scale
   */
  public static getRadiusFromRatio( heightRatio: number ): number {
    return ( MASS_MIN_SHAPES_DIMENSION + heightRatio * ( MASS_MAX_SHAPES_DIMENSION - MASS_MIN_SHAPES_DIMENSION ) ) / 2;
  }

  /**
   * Returns the length from a general size scale
   */
  public static getLengthFromRatio( widthRatio: number ): number {
    return ( MASS_MIN_SHAPES_DIMENSION + widthRatio * ( MASS_MAX_SHAPES_DIMENSION - MASS_MIN_SHAPES_DIMENSION ) );
  }

  /**
   * Sets the general size of the mass based on a general size scale.
   */
  public setRatios( widthRatio: number, heightRatio: number ): void {
    this.updateSize(
      HorizontalCylinder.getRadiusFromRatio( heightRatio ),
      HorizontalCylinder.getLengthFromRatio( widthRatio )
    );
  }

  /**
   * Called after an engine-physics-model step once before doing other operations (like computing buoyant forces,
   * displacement, etc.) so that it can set high-performance flags used for this purpose.
   *
   * Type-specific values are likely to be set, but this should set at least stepX/stepBottom/stepTop
   */
  public override updateStepInformation(): void {
    super.updateStepInformation();

    const xOffset = this.stepMatrix.m02();
    const yOffset = this.stepMatrix.m12();

    this.stepX = xOffset;
    this.stepBottom = yOffset - this.radiusProperty.value;
    this.stepTop = yOffset + this.radiusProperty.value;

    this.stepRadius = this.radiusProperty.value;
    this.stepMaximumArea = 2 * this.stepRadius * this.lengthProperty.value;
    this.stepMaximumVolume = Math.PI * this.stepRadius * this.stepRadius * this.lengthProperty.value;
  }

  /**
   * Returns the cumulative displaced volume of this object up to a given y level.
   *
   * Assumes step information was updated.
   */
  public getDisplacedArea( fluidLevel: number ): number {
    if ( fluidLevel < this.stepBottom || fluidLevel > this.stepTop ) {
      return 0;
    }
    else {
      const ratio = ( fluidLevel - this.stepBottom ) / ( this.stepTop - this.stepBottom );

      return this.stepMaximumArea * 2 * Math.sqrt( ratio - ratio * ratio );
    }
  }

  /**
   * Returns the displaced volume of this object up to a given y level, assuming a y value for the given fluid level.
   *
   * Assumes step information was updated.
   */
  public getDisplacedVolume( fluidLevel: number ): number {
    if ( fluidLevel <= this.stepBottom ) {
      return 0;
    }
    else if ( fluidLevel >= this.stepTop ) {
      return this.stepMaximumVolume;
    }
    else {
      const ratio = ( fluidLevel - this.stepBottom ) / ( this.stepTop - this.stepBottom );
      const f = 2 * ratio - 1;

      // Computed with Mathematica
      return this.stepMaximumVolume * ( 2 * Math.sqrt( ratio - ratio * ratio ) * f + Math.acos( -f ) ) / Math.PI;
    }
  }

  /**
   * Resets things to their original values.
   */
  public override reset(): void {
    this.radiusProperty.reset();
    this.lengthProperty.reset();
    this.updateSize( this.radiusProperty.value, this.lengthProperty.value );

    super.reset();
  }

  /**
   * Returns a horizontal cylinder shape for a given radius/length.
   */
  private static getHorizontalCylinderShape( radius: number, length: number ): Shape {
    return Shape.rect( -length / 2, -radius, length, 2 * radius );
  }

  /**
   * Returns the volume of a horizontal cylinder with the given radius and length.
   */
  private static getVolume( radius: number, length: number ): number {
    const value = Math.PI * radius * radius * length;

    // Rounding to proactively prevent infinite compounding rounding errors, like https://github.com/phetsims/density-buoyancy-common/issues/192
    return Utils.roundToInterval( value, DensityBuoyancyCommonConstants.TOLERANCE );
  }
}

densityBuoyancyCommon.register( 'HorizontalCylinder', HorizontalCylinder );