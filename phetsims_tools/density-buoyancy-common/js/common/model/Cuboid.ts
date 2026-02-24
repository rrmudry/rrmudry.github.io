// Copyright 2019-2025, University of Colorado Boulder

/**
 * An axis-aligned cuboid.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Property from '../../../../axon/js/Property.js';
import Bounds3 from '../../../../dot/js/Bounds3.js';
import Matrix3 from '../../../../dot/js/Matrix3.js';
import Utils from '../../../../dot/js/Utils.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import Shape from '../../../../kite/js/Shape.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import StrictOmit from '../../../../phet-core/js/types/StrictOmit.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import Mass, { InstrumentedMassOptions, MASS_MAX_SHAPES_DIMENSION, MASS_MIN_SHAPES_DIMENSION, MassOptions } from './Mass.js';
import { MassShape } from './MassShape.js';
import PhysicsEngine from './PhysicsEngine.js';

export type CuboidOptions = StrictOmit<InstrumentedMassOptions, 'body' | 'shape' | 'volume' | 'massShape'>;

export default class Cuboid extends Mass {

  public readonly sizeProperty: Property<Bounds3>;

  // Step information
  private stepArea: number;
  private stepMaximumVolume: number;

  protected static readonly MIN_VOLUME = 0.001;
  public static readonly MAX_VOLUME = 0.01;

  public constructor( engine: PhysicsEngine, size: Bounds3, providedOptions: CuboidOptions ) {
    const options = optionize<CuboidOptions, EmptySelfOptions, MassOptions>()( {
      body: engine.createBox( size.width, size.height ),
      shape: Shape.rect( size.minX, size.minY, size.width, size.height ),
      volume: Cuboid.getVolume( size ),
      massShape: MassShape.BLOCK
    }, providedOptions );

    super( engine, options );

    this.sizeProperty = new Property( size, {
      valueType: Bounds3,
      valueComparisonStrategy: 'equalsFunction',
      tandem: options.tandem.createTandem( 'sizeProperty' ),
      phetioDocumentation: 'For internal use only.',
      phetioValueType: Bounds3.Bounds3IO,
      phetioReadOnly: true,
      units: 'm'
    } );

    this.stepArea = 0;
    this.stepMaximumVolume = 0;
    this.massLabelOffsetOrientationProperty.value = new Vector2( 1, -1 );

    this.updateSize( size );
  }

  /**
   * Updates the size of the cuboid.
   */
  public updateSize( size: Bounds3 ): void {
    // Don't update our model if it's no-volume, we'll have ourselves removed anyway
    if ( size.width && size.height ) {

      // Shift it vertically to keep the same bottom, see https://github.com/phetsims/density/issues/24
      const oldSize = this.sizeProperty.value;
      this.matrix.multiplyMatrix( Matrix3.translation( 0, ( size.height - oldSize.height ) / 2 ) );
      this.writeData();

      this.engine.updateBox( this.body, size.width, size.height );
      this.sizeProperty.value = size;
      this.shapeProperty.value = Shape.rect( size.minX, size.minY, size.width, size.height );

      this.volumeProperty.value = Cuboid.getVolume( size );

      this.forceOffsetProperty.value = new Vector3( 0, 0, size.maxZ );
      this.massLabelOffsetProperty.value = new Vector3( size.minX, size.minY, size.maxZ );

      // Calling transformedEmitter twice for safety, it was already called in writeData
      this.transformedEmitter.emit();
    }
  }

  protected override getLocalBounds(): Bounds3 {
    return this.sizeProperty.value;
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
    this.updateSize( Cuboid.getSizeFromRatios( widthRatio, heightRatio ) );
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

    this.stepArea = size.width * size.depth;
    this.stepMaximumVolume = this.stepArea * size.height;
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
      // This is identical to VerticalCylinder's getDisplacedVolume formula, see there if this needs to change.
      return this.stepMaximumVolume * ( fluidLevel - bottom ) / ( top - bottom );
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

  private static getVolume( size: Bounds3 ): number {

    // Rounding to proactively prevent infinite compounding rounding errors, like https://github.com/phetsims/density-buoyancy-common/issues/192
    // In addition, this keeps the volume in range. Before this fix, the volume range had to be expanded by TOLERANCE, see https://github.com/phetsims/density-buoyancy-common/issues/224
    return Utils.roundToInterval( size.volume, DensityBuoyancyCommonConstants.TOLERANCE );
  }
}

densityBuoyancyCommon.register( 'Cuboid', Cuboid );