// Copyright 2019-2025, University of Colorado Boulder

/**
 * An up/down cone
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

const BOTTOM_FROM_CENTER_RATIO = 0.25; // center of mass to the bottom is 1/4 of the height of the cone
const TOP_FROM_CENTER_RATIO = 0.75; // center of mass to the tip is 3/4 of the height of the cone

export type ConeOptions = StrictOmit<InstrumentedMassOptions, 'body' | 'shape' | 'volume' | 'massShape'>;

export default class Cone extends Mass {

  public readonly radiusProperty: Property<number>;
  public readonly heightProperty: Property<number>;
  public readonly isVertexUp: boolean;

  // Step information
  private stepRadius: number;
  private stepArea: number;
  private stepMaximumVolume: number;

  public constructor( engine: PhysicsEngine, radius: number, height: number, isVertexUp: boolean, providedOptions: ConeOptions ) {

    const initialVertices = Cone.getConeVertices( radius, height, isVertexUp );

    const options = optionize<ConeOptions, EmptySelfOptions, MassOptions>()( {
      body: engine.createFromVertices( initialVertices, false ),
      shape: Shape.polygon( initialVertices ),
      volume: Cone.getVolume( radius, height ),
      massShape: isVertexUp ? MassShape.CONE : MassShape.INVERTED_CONE
    }, providedOptions );

    super( engine, options );

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

    this.isVertexUp = isVertexUp;
    this.stepRadius = 0;
    this.stepArea = 0;
    this.stepMaximumVolume = 0;

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
    const vertices = Cone.getConeVertices( radius, height, this.isVertexUp );

    this.engine.updateFromVertices( this.body, vertices, false );

    this.radiusProperty.value = radius;
    this.heightProperty.value = height;

    this.shapeProperty.value = Shape.polygon( vertices );

    this.volumeProperty.value = Cone.getVolume( radius, height );

    this.forceOffsetProperty.value = new Vector3( 0, 0, 0 );
    this.massLabelOffsetProperty.value = new Vector3( 0, -this.heightProperty.value * ( this.isVertexUp ? 0.1 : 0.6 ), radius * 0.7 );
  }

  /**
   * Returns the radius from a general size scale
   */
  public static getRadiusFromRatio( widthRatio: number ): number {
    // Independent of getHeightFromRatio since these should be not tied together
    return ( MASS_MIN_SHAPES_DIMENSION + widthRatio * ( MASS_MAX_SHAPES_DIMENSION - MASS_MIN_SHAPES_DIMENSION ) ) / 2;
  }

  /**
   * Returns the height from a general size scale
   */
  public static getHeightFromRatio( heightRatio: number ): number {
    // Left independent of getRadiusFromRatio since these should be not tied together
    return ( MASS_MIN_SHAPES_DIMENSION + heightRatio * ( MASS_MAX_SHAPES_DIMENSION - MASS_MIN_SHAPES_DIMENSION ) );
  }

  /**
   * Sets the general size of the mass based on a general size scale.
   */
  public setRatios( widthRatio: number, heightRatio: number ): void {
    this.updateSize(
      Cone.getRadiusFromRatio( widthRatio ),
      Cone.getHeightFromRatio( heightRatio )
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
    this.stepBottom = yOffset - this.heightProperty.value * ( this.isVertexUp ? BOTTOM_FROM_CENTER_RATIO : TOP_FROM_CENTER_RATIO );
    this.stepTop = yOffset + this.heightProperty.value * ( this.isVertexUp ? TOP_FROM_CENTER_RATIO : BOTTOM_FROM_CENTER_RATIO );

    this.stepRadius = this.radiusProperty.value;
    this.stepArea = Math.PI * this.stepRadius * this.stepRadius;
    this.stepMaximumVolume = this.stepArea * this.heightProperty.value / 3;
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
      let ratio = ( fluidLevel - this.stepBottom ) / ( this.stepTop - this.stepBottom );
      if ( this.isVertexUp ) {
        ratio = 1 - ratio;
      }
      const radius = this.stepRadius * ratio;
      return Math.PI * radius * radius;
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

      if ( this.isVertexUp ) {
        // a = pi * ( r * ( 1 - t ) )^2 = pi * r^2 * ( 1 - t )^2 = ( pi * r^2 ) - ( pi * r^2 * t^2 )
        // v = pi * r^2 * t - 1/3 pi * r^2 * t^3 = pi * r^2 * ( t - 1/3 t^3 )
        return this.stepArea * this.heightProperty.value * ( ratio * ( 3 + ratio * ( ratio - 3 ) ) ) / 3;
      }
      else {
        // a = pi * (r*t)^2 = pi * r^2 * t^2
        // v = 1/3 pi * r^2 * t^3
        return this.stepArea * this.heightProperty.value * ratio * ratio * ratio / 3;
      }
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
   * Returns an array of vertices for the 2d physics model
   */
  private static getConeVertices( radius: number, height: number, isVertexUp: boolean ): Vector2[] {
    const vertexSign = isVertexUp ? 1 : -1;

    return [
      new Vector2( 0, TOP_FROM_CENTER_RATIO * vertexSign * height ),
      new Vector2( -vertexSign * radius, -BOTTOM_FROM_CENTER_RATIO * vertexSign * height ),
      new Vector2( vertexSign * radius, -BOTTOM_FROM_CENTER_RATIO * vertexSign * height )
    ];
  }

  /**
   * Returns the volume of a cone with the given radius and height.
   */
  private static getVolume( radius: number, height: number ): number {
    const volume = Math.PI * radius * radius * height / 3;

    // Rounding to proactively prevent infinite compounding rounding errors, like https://github.com/phetsims/density-buoyancy-common/issues/192
    return Utils.roundToInterval( volume, DensityBuoyancyCommonConstants.TOLERANCE );
  }
}

densityBuoyancyCommon.register( 'Cone', Cone );