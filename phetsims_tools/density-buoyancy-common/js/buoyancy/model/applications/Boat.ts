// Copyright 2019-2025, University of Colorado Boulder

/**
 * A boat (Mass) that can contain some fluid inside.  Boats exist for the lifetime of the sim and do not need to be
 * disposed.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Multilink from '../../../../../axon/js/Multilink.js';
import NumberProperty from '../../../../../axon/js/NumberProperty.js';
import { TReadOnlyProperty } from '../../../../../axon/js/TReadOnlyProperty.js';
import Range from '../../../../../dot/js/Range.js';
import Utils from '../../../../../dot/js/Utils.js';
import Vector2 from '../../../../../dot/js/Vector2.js';
import Vector3 from '../../../../../dot/js/Vector3.js';
import Shape from '../../../../../kite/js/Shape.js';
import optionize, { EmptySelfOptions } from '../../../../../phet-core/js/optionize.js';
import StrictOmit from '../../../../../phet-core/js/types/StrictOmit.js';
import DensityBuoyancyCommonConstants, { toLiters } from '../../../common/DensityBuoyancyCommonConstants.js';
import { MassShape } from '../../../common/model/MassShape.js';
import Material from '../../../common/model/Material.js';
import MaterialProperty from '../../../common/model/MaterialProperty.js';
import PhysicsEngine from '../../../common/model/PhysicsEngine.js';
import Pool from '../../../common/model/Pool.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../../DensityBuoyancyCommonStrings.js';
import ApplicationsMass, { ApplicationsMassOptions } from './ApplicationsMass.js';
import BoatBasin from './BoatBasin.js';
import BoatDesign from './BoatDesign.js';

export type BoatOptions = StrictOmit<ApplicationsMassOptions,
  'body' | 'shape' | 'volume' | 'material' | 'massShape' | 'availableMassMaterials'>;

export default class Boat extends ApplicationsMass {

  // The volume that the boat can hold inside it.
  public readonly fluidMaterialProperty: MaterialProperty;

  // The volume of the mass's capacity AND itself, the boat hull plus how much the boat can hold.
  public readonly maxVolumeDisplacedProperty: NumberProperty;

  // The interior that can contain fluid
  public readonly basin: BoatBasin;

  // Amount of volume contained in the basin
  private stepInternalVolume = 0;

  // How to multiply our one-liter boat shape up to the model coordinates, since the boat changes size based on its
  // volume. This is much preferred to trying to redraw the shape to a different size.
  public stepMultiplier = 0;

  // Whether the boat is fully submerged
  public isFullySubmerged = false;

  // In the physics update step, keep track of the boat vertical acceleration and velocity in mks.
  public verticalVelocity = 0;
  public verticalAcceleration = 0;

  public constructor( engine: PhysicsEngine, blockWidthProperty: TReadOnlyProperty<number>, fluidMaterialProperty: MaterialProperty, providedOptions: BoatOptions ) {

    const boatIntersectionVertices = BoatDesign.getIntersectionVertices( blockWidthProperty.value / 2, toLiters( ApplicationsMass.DEFAULT_DISPLACEMENT_VOLUME ) );
    const volume = BoatDesign.ONE_LITER_HULL_VOLUME * toLiters( ApplicationsMass.DEFAULT_DISPLACEMENT_VOLUME );

    const options = optionize<BoatOptions, EmptySelfOptions, ApplicationsMassOptions>()( {
      body: engine.createFromVertices( boatIntersectionVertices, true ),
      shape: Shape.polygon( boatIntersectionVertices ),
      volume: volume,
      massShape: MassShape.BLOCK,
      material: Material.BOAT_HULL,
      availableMassMaterials: [ Material.BOAT_HULL ],

      accessibleName: DensityBuoyancyCommonStrings.boatStringProperty,

      volumePropertyOptions: {
        phetioDocumentation: 'Volume of the boat hull.'
      }
    }, providedOptions );

    super( engine, options );

    this.maxVolumeDisplacedProperty = new NumberProperty( ApplicationsMass.DEFAULT_DISPLACEMENT_VOLUME, {
      tandem: options.tandem.createTandem( 'maxVolumeDisplacedProperty' ),
      phetioDocumentation: 'The total volume of the boat, including its capacity and hull.',
      range: new Range( 0.005, 0.03 ),
      units: 'm^3',
      phetioFeatured: true
    } );

    // Update the shape when the block width or displacement changes
    Multilink.multilink( [ blockWidthProperty, this.maxVolumeDisplacedProperty ], ( blockWidth, displacementVolume ) => {

      // Exit early if the displacement volume is zero, as no updates are needed in this case.
      if ( displacementVolume === 0 ) {
        return;
      }

      // Determine the outline of the submerged part of the object, important for calculating buoyancy and shape.
      const vertices = BoatDesign.getIntersectionVertices( blockWidth / 2, toLiters( displacementVolume ) );

      const volume = BoatDesign.ONE_LITER_HULL_VOLUME * toLiters( displacementVolume );

      // Update the physics engine with the new vertices, altering the object's shape in the simulation.
      engine.updateFromVertices( this.body, vertices, true );

      // Update the shape property with a new polygon created from the calculated vertices.
      // This value changes very rarely and only takes 0-1ms to compute (seen on macbook air m1), so it is OK to run it here.
      this.shapeProperty.value = Shape.polygon( vertices );

      // Calculate the bounds of the current shape and set the mass label offset vector.
      // Mass label on the bottom left of the boat, top because the shape is flipped.
      const bounds = this.shapeProperty.value.getBounds();
      this.massLabelOffsetVector3.setXYZ( bounds.left, bounds.top, 0 );

      // Rounding to proactively prevent infinite compounding rounding errors, like https://github.com/phetsims/density-buoyancy-common/issues/192
      this.volumeProperty.value = Utils.roundToInterval( volume, DensityBuoyancyCommonConstants.TOLERANCE );

      // Update the body's offset property based on the centroid of the polygon vertices,
      // with the centroid negated to properly align the object in the simulation space.
      this.bodyOffsetProperty.value = Utils.centroidOfPolygon( vertices ).negated();

      this.writeData();
    } );

    this.fluidMaterialProperty = fluidMaterialProperty;

    this.basin = new BoatBasin( this, options.tandem );

    Multilink.multilink( [ this.fluidMaterialProperty, this.basin.fluidVolumeProperty ], ( material, volume ) => {
      this.containedMassProperty.value = material.density * volume;
    } );

    const bounds = this.shapeProperty.value.getBounds();
    this.forceOffsetProperty.value = Vector3.from( new Vector2( 0.375 * bounds.left, 0 ) );
  }

  /**
   * Steps forward in time.
   */
  public override step( dt: number, interpolationRatio: number ): void {
    super.step( dt, interpolationRatio );

    this.basin.fluidYInterpolatedProperty.setRatio( interpolationRatio );
  }

  /**
   * Called after the engine-physics-model step once before doing other operations (like computing buoyant forces,
   * displacement, etc.) so that it can set high-performance flags used for this purpose.
   *
   * Type-specific values are likely to be set, but this should set at least stepX/stepBottom/stepTop
   */
  public override updateStepInformation(): void {
    super.updateStepInformation();

    const xOffset = this.stepMatrix.m02();
    const yOffset = this.stepMatrix.m12();

    const displacedVolume = this.maxVolumeDisplacedProperty.value;
    this.stepMultiplier = Math.pow( displacedVolume / 0.001, 1 / 3 );
    this.stepInternalVolume = BoatDesign.ONE_LITER_INTERNAL_VOLUMES[ BoatDesign.ONE_LITER_INTERNAL_VOLUMES.length - 1 ] * this.stepMultiplier * this.stepMultiplier * this.stepMultiplier;

    this.stepX = xOffset;
    this.stepBottom = yOffset + this.stepMultiplier * BoatDesign.ONE_LITER_BOUNDS.minY;
    this.stepTop = yOffset + this.stepMultiplier * BoatDesign.ONE_LITER_BOUNDS.maxY;

    this.basin.stepTop = this.stepTop;
    this.basin.stepBottom = yOffset + this.stepMultiplier * BoatDesign.ONE_LITER_INTERIOR_BOTTOM;

    assert && assert( !isNaN( this.stepTop ), 'stepTop should not be NaN' );
    assert && assert( !isNaN( this.basin.stepTop ), 'basin.stepTop should not be NaN' );
  }

  /**
   * Returns the fraction of the mass that is submerged in a fluid at a given level. From 0 to 1.
   */
  public override updateSubmergedMassFraction( gravityMagnitude: number, fluidDensity: number ): void {
    assert && assert( gravityMagnitude > 0, 'gravityMagnitude should be positive' );

    if ( !this.isFullySubmerged ) {
      const buoyancy = this.buoyancyForceInterpolatedProperty.currentValue;
      const volume = this.volumeProperty.value + this.stepInternalVolume;
      const submergedFraction = 100 * buoyancy.magnitude / ( volume * gravityMagnitude * fluidDensity );
      const range = this.percentSubmergedProperty.range;
      this.percentSubmergedProperty.value = range.constrainValue( submergedFraction );
    }
    else {
      this.percentSubmergedProperty.value = 100;
    }
  }

  protected override evaluatePiecewiseLinearArea( ratio: number ): number {
    return ApplicationsMass.evaluatePiecewiseLinear( BoatDesign.ONE_LITER_DISPLACED_AREAS, ratio ) * this.stepMultiplier * this.stepMultiplier;
  }

  protected override evaluatePiecewiseLinearVolume( ratio: number ): number {
    return ApplicationsMass.evaluatePiecewiseLinear( BoatDesign.ONE_LITER_DISPLACED_VOLUMES, ratio ) * this.stepMultiplier * this.stepMultiplier * this.stepMultiplier;
  }

  /**
   * Returns the internal basin area of this object up to a given y level, assuming a y value for the given fluid level.
   *
   * Assumes step information was updated.
   */
  public getBasinArea( fluidLevel: number ): number {
    const bottom = this.stepBottom;
    const top = this.stepTop;

    if ( fluidLevel <= bottom || fluidLevel >= top ) {
      return 0;
    }
    else {
      const ratio = ( fluidLevel - bottom ) / ( top - bottom );

      return ApplicationsMass.evaluatePiecewiseLinear( BoatDesign.ONE_LITER_INTERNAL_AREAS, ratio ) * this.stepMultiplier * this.stepMultiplier;
    }
  }

  /**
   * Returns the displaced volume of this object up to a given y level, assuming a y value for the given fluid level.
   *
   * Assumes step information was updated.
   */
  public getBasinVolume( fluidLevel: number ): number {
    const bottom = this.stepBottom;
    const top = this.stepTop;

    if ( fluidLevel <= bottom ) {
      return 0;
    }
    else if ( fluidLevel >= top ) {
      return this.stepInternalVolume;
    }
    else {
      const ratio = ( fluidLevel - bottom ) / ( top - bottom );

      return ApplicationsMass.evaluatePiecewiseLinear( BoatDesign.ONE_LITER_INTERNAL_VOLUMES, ratio ) * this.stepMultiplier * this.stepMultiplier * this.stepMultiplier;
    }
  }

  /**
   * Resets values to their original state
   */
  public override reset( resetInternalVisibleProperty = true ): void {
    this.maxVolumeDisplacedProperty.reset();

    this.basin.reset();
    this.verticalVelocity = 0;
    this.verticalAcceleration = 0;

    super.reset( resetInternalVisibleProperty );
  }

  public updateVerticalMotion( pool: Pool, dt: number ): void {

    // This runs after this.updateFluid() in the post step function, so we have the new proposed value for the fluid height.
    // THEN we check to see if the boat is submerged underneath it.
    this.isFullySubmerged = this.stepTop < pool.fluidYInterpolatedProperty.currentValue - DensityBuoyancyCommonConstants.TOLERANCE;

    const nextBoatVerticalVelocity = PhysicsEngine.bodyGetVelocity( this.body ).y;
    this.verticalAcceleration = ( nextBoatVerticalVelocity - this.verticalVelocity ) / dt;
    this.verticalVelocity = nextBoatVerticalVelocity;
  }
}

densityBuoyancyCommon.register( 'Boat', Boat );