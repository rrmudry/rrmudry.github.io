// Copyright 2019-2025, University of Colorado Boulder

/**
 * A cylinder laying on its end (the caps are on the top and bottom)
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import NumberProperty from '../../../../../axon/js/NumberProperty.js';
import Property from '../../../../../axon/js/Property.js';
import Bounds3 from '../../../../../dot/js/Bounds3.js';
import Range from '../../../../../dot/js/Range.js';
import Utils from '../../../../../dot/js/Utils.js';
import Vector2 from '../../../../../dot/js/Vector2.js';
import Vector3 from '../../../../../dot/js/Vector3.js';
import Shape from '../../../../../kite/js/Shape.js';
import optionize, { EmptySelfOptions } from '../../../../../phet-core/js/optionize.js';
import StrictOmit from '../../../../../phet-core/js/types/StrictOmit.js';
import DensityBuoyancyCommonConstants from '../../../common/DensityBuoyancyCommonConstants.js';
import Mass, { InstrumentedMassOptions, MASS_MAX_SHAPES_DIMENSION, MASS_MIN_SHAPES_DIMENSION, MassOptions } from '../../../common/model/Mass.js';
import { MassShape } from '../../../common/model/MassShape.js';
import PhysicsEngine from '../../../common/model/PhysicsEngine.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';

export type VerticalCylinderOptions = StrictOmit<InstrumentedMassOptions, 'body' | 'shape' | 'volume' | 'massShape'>;

export default class VerticalCylinder extends Mass {

  public readonly radiusProperty: Property<number>;
  public readonly heightProperty: Property<number>;

  // Step information
  private stepRadius: number;
  private stepHeight: number;
  private stepArea: number;
  private stepMaximumVolume: number;

  public constructor( engine: PhysicsEngine, radius: number, height: number, providedOptions: VerticalCylinderOptions ) {
    const options = optionize<VerticalCylinderOptions, EmptySelfOptions, MassOptions>()( {
      body: engine.createBox( 2 * radius, height ),
      shape: VerticalCylinder.getVerticalCylinderShape( radius, height ),
      volume: VerticalCylinder.getVolume( radius, height ),
      massShape: MassShape.VERTICAL_CYLINDER
    }, providedOptions );

    super( engine, options );

    // {Property.<number>}
    this.radiusProperty = new NumberProperty( radius, {
      tandem: options.tandem.createTandem( 'radiusProperty' ),
      range: new Range( 0, Number.POSITIVE_INFINITY ),
      phetioReadOnly: true
    } );
    this.heightProperty = new NumberProperty( height, {
      tandem: options.tandem.createTandem( 'heightProperty' ),
      range: new Range( 0, Number.POSITIVE_INFINITY ),
      phetioReadOnly: true
    } );

    this.stepRadius = 0;
    this.stepHeight = 0;
    this.stepArea = 0;
    this.stepMaximumVolume = 0;

    this.massLabelOffsetOrientationProperty.value = new Vector2( 0, -1 );

    this.updateSize( radius, height );
  }

  protected override getLocalBounds(): Bounds3 {
    const bounds2 = this.shapeProperty.value.bounds;
    return new Bounds3( bounds2.minX, bounds2.minY, -this.radiusProperty.value, bounds2.maxX, bounds2.maxY, this.radiusProperty.value );
  }

  /**
   * Updates the size of the cone.
   */
  private updateSize( radius: number, height: number ): void {
    this.engine.updateBox( this.body, 2 * radius, height );

    this.radiusProperty.value = radius;
    this.heightProperty.value = height;

    this.shapeProperty.value = VerticalCylinder.getVerticalCylinderShape( radius, height );

    this.volumeProperty.value = VerticalCylinder.getVolume( radius, height );

    this.forceOffsetProperty.value = new Vector3( 0, 0, radius );
    this.massLabelOffsetProperty.value = new Vector3( 0, -height / 2, radius );
  }

  /**
   * Returns the radius from a general size scale
   */
  public static getRadiusFromRatio( widthRatio: number ): number {
    return ( MASS_MIN_SHAPES_DIMENSION + widthRatio * ( MASS_MAX_SHAPES_DIMENSION - MASS_MIN_SHAPES_DIMENSION ) ) / 2;
  }

  /**
   * Returns the height from a general size scale
   */
  public static getHeightFromRatio( heightRatio: number ): number {
    return ( MASS_MIN_SHAPES_DIMENSION + heightRatio * ( MASS_MAX_SHAPES_DIMENSION - MASS_MIN_SHAPES_DIMENSION ) );
  }

  /**
   * Sets the general size of the mass based on a general size scale.
   */
  public setRatios( widthRatio: number, heightRatio: number ): void {
    this.updateSize(
      VerticalCylinder.getRadiusFromRatio( widthRatio ),
      VerticalCylinder.getHeightFromRatio( heightRatio )
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
    this.stepBottom = yOffset - this.heightProperty.value / 2;
    this.stepTop = yOffset + this.heightProperty.value / 2;

    this.stepRadius = this.radiusProperty.value;
    this.stepHeight = this.heightProperty.value;
    this.stepArea = Math.PI * this.stepRadius * this.stepRadius;
    this.stepMaximumVolume = this.stepArea * this.heightProperty.value;
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
      return this.stepArea;
    }
  }

  /**
   * Returns the displaced volume of this object up to a given y level, assuming a y value for the given fluid level.
   *
   * Assumes step information was updated.
   */
  public getDisplacedVolume( fluidLevel: number ): number {
    const bottom = this.stepBottom;
    const top = this.stepTop;

    if ( fluidLevel <= bottom ) {
      return 0;
    }
    else if ( fluidLevel >= top ) {
      return this.stepMaximumVolume;
    }
    else {

      // Similar to cube because the stepMaximumVolume encompasses the cross sectional area which is circular.
      return this.stepMaximumVolume * ( fluidLevel - bottom ) / ( top - bottom );
    }
  }

  /**
   * Resets things to their original values.
   */
  public override reset(): void {
    this.radiusProperty.reset();
    this.heightProperty.reset();
    this.updateSize( this.radiusProperty.value, this.heightProperty.value );

    super.reset();
  }

  /**
   * Returns a vertical cylinder shape for a given radius/height.
   */
  private static getVerticalCylinderShape( radius: number, height: number ): Shape {
    return Shape.rect( -radius, -height / 2, 2 * radius, height );
  }

  /**
   * Returns the volume of a vertical cylinder with the given radius and height.
   */
  private static getVolume( radius: number, height: number ): number {
    const value = Math.PI * radius * radius * height;

    // Rounding to proactively prevent infinite compounding rounding errors, like https://github.com/phetsims/density-buoyancy-common/issues/192
    return Utils.roundToInterval( value, DensityBuoyancyCommonConstants.TOLERANCE );
  }
}

densityBuoyancyCommon.register( 'VerticalCylinder', VerticalCylinder );