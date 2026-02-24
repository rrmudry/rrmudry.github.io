// Copyright 2019-2025, University of Colorado Boulder

/**
 * An adjustable Ellipsoid.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Property from '../../../../../axon/js/Property.js';
import Bounds3 from '../../../../../dot/js/Bounds3.js';
import Utils from '../../../../../dot/js/Utils.js';
import Vector2 from '../../../../../dot/js/Vector2.js';
import Vector3 from '../../../../../dot/js/Vector3.js';
import Shape from '../../../../../kite/js/Shape.js';
import optionize, { EmptySelfOptions } from '../../../../../phet-core/js/optionize.js';
import StrictOmit from '../../../../../phet-core/js/types/StrictOmit.js';
import WithOptional from '../../../../../phet-core/js/types/WithOptional.js';
import DensityBuoyancyCommonConstants from '../../../common/DensityBuoyancyCommonConstants.js';
import Mass, { InstrumentedMassOptions, MASS_MAX_SHAPES_DIMENSION, MASS_MIN_SHAPES_DIMENSION, MassOptions } from '../../../common/model/Mass.js';
import { MassShape } from '../../../common/model/MassShape.js';
import PhysicsEngine from '../../../common/model/PhysicsEngine.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';

type SelfOptions = EmptySelfOptions;

// Promote required attributes to optional
type OptionalAttributes = 'body' | 'shape' | 'massShape' | 'volume';

export type EllipsoidOptions = SelfOptions &
  StrictOmit<InstrumentedMassOptions, OptionalAttributes> &
  WithOptional<InstrumentedMassOptions, OptionalAttributes>;

export default class Ellipsoid extends Mass {

  public readonly sizeProperty: Property<Bounds3>;

  // Step information
  private stepMaximumArea: number;
  private stepMaximumVolume: number;

  public constructor( engine: PhysicsEngine, size: Bounds3, providedOptions: EllipsoidOptions ) {
    const options = optionize<StrictOmit<EllipsoidOptions, OptionalAttributes>, SelfOptions, MassOptions>()( {
      body: engine.createFromVertices( Ellipsoid.getEllipsoidVertices( size.width, size.height ), false ),
      shape: Ellipsoid.getEllipsoidShape( size.width, size.height ),
      volume: Ellipsoid.getVolume( size ),
      massShape: MassShape.ELLIPSOID
    }, providedOptions );

    super( engine, options );

    this.sizeProperty = new Property( size, {
      valueType: Bounds3,
      tandem: options.tandem.createTandem( 'sizeProperty' ),
      phetioDocumentation: 'For internal use only.',
      phetioValueType: Bounds3.Bounds3IO,
      units: 'm'
    } );

    this.stepMaximumArea = 0;
    this.stepMaximumVolume = 0;

    this.updateSize( size );
  }

  protected override getLocalBounds(): Bounds3 {
    return this.sizeProperty.value;
  }

  /**
   * Updates the size of the ellipsoid.
   */
  protected updateSize( size: Bounds3 ): void {
    this.engine.updateFromVertices( this.body, Ellipsoid.getEllipsoidVertices( size.width, size.height ), false );
    this.sizeProperty.value = size;
    this.shapeProperty.value = Ellipsoid.getEllipsoidShape( size.width, size.height );

    this.volumeProperty.value = Ellipsoid.getVolume( size );

    this.forceOffsetProperty.value = new Vector3( 0, 0, size.maxZ );
    this.massLabelOffsetProperty.value = new Vector3( 0, size.minY * 0.5, size.maxZ * 0.7 );
  }

  /**
   * Returns the general size of the mass based on a general size scale.
   */
  public static getSizeFromRatios( widthRatio: number, heightRatio: number ): Bounds3 {
    const x = ( MASS_MIN_SHAPES_DIMENSION + widthRatio * ( MASS_MAX_SHAPES_DIMENSION - MASS_MIN_SHAPES_DIMENSION ) ) / 2;
    const y = ( MASS_MIN_SHAPES_DIMENSION + heightRatio * ( MASS_MAX_SHAPES_DIMENSION - MASS_MIN_SHAPES_DIMENSION ) ) / 2;
    return new Bounds3( -x, -y, -x, x, y, x );
  }

  /**
   * Sets the general size of the mass based on a general size scale.
   */
  public setRatios( widthRatio: number, heightRatio: number ): void {
    this.updateSize( Ellipsoid.getSizeFromRatios( widthRatio, heightRatio ) );
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

    const size = this.sizeProperty.value;

    this.stepX = xOffset;
    this.stepBottom = yOffset + size.minY;
    this.stepTop = yOffset + size.maxY;

    const a = this.sizeProperty.value.width / 2;
    const b = this.sizeProperty.value.height / 2;
    const c = this.sizeProperty.value.depth / 2;
    this.stepMaximumArea = 4 * Math.PI * a * c; // 4 * pi * a * c
    this.stepMaximumVolume = this.stepMaximumArea * b / 3; // 4/3 * pi * a * b * c
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

      return this.stepMaximumArea * ( ratio - ratio * ratio ); // 4 * pi * a * c * ( t - t^2 )
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

      return this.stepMaximumVolume * ratio * ratio * ( 3 - 2 * ratio ); // 4/3 * pi * a * b * c * t^2 * ( 3 - 2t )
    }
  }

  /**
   * Resets things to their original values.
   */
  public override reset(): void {
    this.sizeProperty.reset();
    this.updateSize( this.sizeProperty.value );

    super.reset();
  }

  /**
   * Returns an ellipsoid shape
   */
  private static getEllipsoidShape( width: number, height: number ): Shape {
    return Shape.ellipse( 0, 0, width / 2, height / 2, 0 );
  }

  /**
   * Returns vertices for an ellipsoid
   */
  private static getEllipsoidVertices( width: number, height: number ): Vector2[] {
    const segments = 80;
    const vertices = [];
    for ( let i = 0; i < segments; i++ ) {
      const theta = i / segments * 2 * Math.PI;

      if ( Math.abs( theta - Math.PI / 2 ) < DensityBuoyancyCommonConstants.TOLERANCE || Math.abs( theta - 3 * Math.PI / 2 ) < DensityBuoyancyCommonConstants.TOLERANCE ) {

        // At 90 degrees and 270 degrees (top and bottom of the ellipsoid), we do not want to have single point because
        // with the center of mass of the ellipsoid, it "leans" to the right.
      }
      else {
        vertices.push( new Vector2( Math.cos( theta ) * width / 2, Math.sin( theta ) * height / 2 ) );
      }
    }
    return vertices;
  }

  /**
   * Returns the volume of an ellipsoid with the given axis-aligned bounding box.
   */
  protected static getVolume( size: Bounds3 ): number {
    const value = Math.PI * size.volume / 6;

    // Rounding to proactively prevent infinite compounding rounding errors, like https://github.com/phetsims/density-buoyancy-common/issues/192
    return Utils.roundToInterval( value, DensityBuoyancyCommonConstants.TOLERANCE );
  }
}

densityBuoyancyCommon.register( 'Ellipsoid', Ellipsoid );