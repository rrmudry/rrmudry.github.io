// Copyright 2019-2024, University of Colorado Boulder

/**
 * The core model for the Density and Buoyancy sim screens, including a pool and masses.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import createObservableArray from '../../../../axon/js/createObservableArray.js';
import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import Property from '../../../../axon/js/Property.js';
import Bounds3 from '../../../../dot/js/Bounds3.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import TModel from '../../../../joist/js/TModel.js';
import optionize from '../../../../phet-core/js/optionize.js';
import PickRequired from '../../../../phet-core/js/types/PickRequired.js';
import { PhetioObjectOptions } from '../../../../tandem/js/PhetioObject.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import IOType from '../../../../tandem/js/types/IOType.js';
import ReferenceIO from '../../../../tandem/js/types/ReferenceIO.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonQueryParameters from '../DensityBuoyancyCommonQueryParameters.js';
import Basin from './Basin.js';
import Cuboid from './Cuboid.js';
import Gravity from './Gravity.js';
import GravityProperty from './GravityProperty.js';
import InterpolatedProperty from './InterpolatedProperty.js';
import Mass from './Mass.js';
import PhysicsEngine, { PhysicsEngineBody } from './PhysicsEngine.js';
import Pool, { FluidSelectionType } from './Pool.js';
import PoolScale from './PoolScale.js';
import Scale from './Scale.js';

// constants
const BLOCK_SPACING = 0.01;
const POOL_VOLUME = 0.15;
const POOL_WIDTH = 0.9;
const POOL_DEPTH = 0.4;
const POOL_HEIGHT = POOL_VOLUME / POOL_WIDTH / POOL_DEPTH;
const GROUND_FRONT_Z = POOL_DEPTH / 2;
const POOL_BACK_Z = -POOL_DEPTH / 2;

export type DensityBuoyancyModelOptions = {
  usePoolScale?: boolean;
  fluidSelectionType?: FluidSelectionType;
  isGravityPropertyInstrumented?: boolean;
} & PickRequired<PhetioObjectOptions, 'tandem'>;

const customStringProperty = DensityBuoyancyCommonStrings.gravity.customStringProperty;

export default class DensityBuoyancyModel implements TModel {

  public readonly gravityProperty: GravityProperty;

  public readonly poolBounds: Bounds3;
  public readonly groundBounds: Bounds3;
  public readonly groundPoints: Vector2[];

  // We'll keep blocks within these bounds, to generally stay in-screen. This may be
  // adjusted by the screen based on the visibleBoundsProperty. These are sensible defaults, with the minX and minY
  // somewhat meant to be adjusted.
  public readonly invisibleBarrierBoundsProperty: Property<Bounds3>;

  public readonly pool: Pool;
  public readonly engine: PhysicsEngine;
  private readonly groundBody: PhysicsEngineBody;
  private barrierBody: PhysicsEngineBody;

  // All the masses that could be used in the given context. Sometimes availableMasses are removed on the shapes screen.
  protected readonly availableMasses = createObservableArray<Mass>();

  // A subset of the availableMasses that are currently visible. This registers them with the rendering engine.
  public readonly visibleMasses = createObservableArray<Mass>();

  public constructor( providedOptions?: DensityBuoyancyModelOptions ) {
    const options = optionize<DensityBuoyancyModelOptions>()( {
      usePoolScale: true,
      fluidSelectionType: 'justWater',
      isGravityPropertyInstrumented: false
    }, providedOptions );

    const tandem = options.tandem;

    const initialGravity = Gravity.EARTH;
    const gravityPropertyTandem = options.isGravityPropertyInstrumented ? tandem.createTandem( 'gravityProperty' ) : Tandem.OPT_OUT;

    const customGravity = new Gravity( {
      nameProperty: customStringProperty,
      tandem: gravityPropertyTandem.createTandem( 'customGravity' ),
      value: initialGravity.gravityValue,
      custom: true
    } );

    this.gravityProperty = new GravityProperty( initialGravity, customGravity, [
      Gravity.MOON,
      Gravity.EARTH,
      Gravity.JUPITER,
      customGravity,
      Gravity.PLANET_X

      // Only take the values instrumented for the current sim. See Gravity.ts for what is instrumented on each screen.
    ].filter( gravity => gravity.isPhetioInstrumented() ), {
      valueType: Gravity,
      phetioValueType: ReferenceIO( IOType.ObjectIO ),
      tandem: gravityPropertyTandem,
      phetioDocumentation: 'The acceleration due to gravity applied to all masses, (may be potentially custom or hidden from view)',
      phetioFeatured: true
    } );

    this.poolBounds = new Bounds3(
      -POOL_WIDTH / 2, -POOL_HEIGHT, POOL_BACK_Z,
      POOL_WIDTH / 2, 0, GROUND_FRONT_Z
    );
    this.groundBounds = new Bounds3(
      -10, -10, -2,
      10, 0, GROUND_FRONT_Z
    );

    this.invisibleBarrierBoundsProperty = new Property( new Bounds3(
      -0.875, -4, POOL_BACK_Z,
      0.875, 4, GROUND_FRONT_Z
    ), {
      valueComparisonStrategy: 'equalsFunction'
    } );

    // How many units the barrier extends out to
    const barrierSize = 5;

    // DerivedProperty doesn't need disposal, since everything here lives for the lifetime of the simulation
    const barrierPointsProperty = new DerivedProperty( [ this.invisibleBarrierBoundsProperty ], bounds => {
      return [
        new Vector2( bounds.maxX, bounds.minY ),
        new Vector2( bounds.maxX + barrierSize, bounds.minY ),
        new Vector2( bounds.maxX + barrierSize, bounds.maxY + barrierSize ),
        new Vector2( bounds.minX - barrierSize, bounds.maxY + barrierSize ),
        new Vector2( bounds.minX - barrierSize, bounds.minY ),
        new Vector2( bounds.minX, bounds.minY ),
        new Vector2( bounds.minX, bounds.maxY ),
        new Vector2( bounds.maxX, bounds.maxY )
      ];
    } );

    if ( DensityBuoyancyCommonQueryParameters.poolWidthMultiplier !== 1 ) {
      const halfX = DensityBuoyancyCommonQueryParameters.poolWidthMultiplier * 0.45;
      const halfZ = POOL_VOLUME / ( 2 * halfX * POOL_HEIGHT * 2 );
      this.poolBounds = new Bounds3(
        -halfX, -POOL_HEIGHT, -halfZ,
        halfX, 0, halfZ
      );
      this.groundBounds = new Bounds3(
        -10, -10, -2,
        10, 0, halfZ
      );
    }

    this.groundPoints = [
      new Vector2( this.groundBounds.minX, this.groundBounds.minY ),
      new Vector2( this.groundBounds.maxX, this.groundBounds.minY ),
      new Vector2( this.groundBounds.maxX, this.groundBounds.maxY ),
      new Vector2( this.poolBounds.maxX, this.poolBounds.maxY ),
      new Vector2( this.poolBounds.maxX, this.poolBounds.minY ),
      new Vector2( this.poolBounds.minX, this.poolBounds.minY ),
      new Vector2( this.poolBounds.minX, this.poolBounds.maxY ),
      new Vector2( this.groundBounds.minX, this.groundBounds.maxY )
    ];

    this.engine = new PhysicsEngine();

    this.pool = new Pool( this.poolBounds, options.usePoolScale, this.engine, this.gravityProperty, options.fluidSelectionType, tandem.createTandem( 'pool' ) );

    this.groundBody = this.engine.createGround( this.groundPoints );
    this.engine.addBody( this.groundBody );

    this.barrierBody = this.engine.createBarrier( barrierPointsProperty.value );
    this.engine.addBody( this.barrierBody );

    // Update the barrier shape as needed (full recreation for now)
    barrierPointsProperty.lazyLink( points => {
      this.engine.removeBody( this.barrierBody );
      this.barrierBody = this.engine.createBarrier( points );
      this.engine.addBody( this.barrierBody );
    } );

    this.availableMasses.addItemAddedListener( mass => {
      const visibilityListener = ( visible: boolean ) => {
        if ( visible ) {
          this.visibleMasses.push( mass );
        }
        else {
          this.visibleMasses.remove( mass );
        }
      };
      mass.visibleProperty.lazyLink( visibilityListener );

      if ( mass.visibleProperty.value ) {
        this.visibleMasses.push( mass );
      }
    } );
    assert && this.availableMasses.addItemRemovedListener( () => {
      assert && assert( false, 'Masses should not be removed from availableMasses' );
    } );

    this.visibleMasses.addItemAddedListener( mass => {
      this.engine.addBody( mass.body );
    } );
    this.visibleMasses.addItemRemovedListener( mass => {
      this.engine.removeBody( mass.body );
      mass.interruptedEmitter.emit();
    } );

    // The main engine post-step actions, that will determine the net forces applied on each mass. This callback fires
    // once per "physics engine step", and so results in potentially up to "p2MaxSubSteps" calls per simulation frame
    // (30 as of writing).
    //
    // The purpose of this listener is to update the state of the simulation by adjusting forces, handling collisions,
    // and applying specific rules to certain objects.
    //
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener.
    this.engine.addPostStepListener( dt => {

      // Check for fluid level/overflow and which basin contains which other basin.
      this.updateFluid();

      const gravity = this.gravityProperty.gravityValueProperty.value;
      this.updateVerticalMotion( dt ); // Updates the vertical motion of the Boat, if present.

      this.visibleMasses.forEach( mass => {
        let contactForce = PhysicsEngine.bodyGetContactForces( mass.body );

        // p2.js sometimes reports incorrect forces for static objects (immovable Scale instances), so these need to be corrected.
        if ( !contactForce.isFinite() ) {
          contactForce = Vector2.ZERO;
        }

        // Horizontally force out objects trapped by the PoolScale (which is controlled by the slider)
        if ( mass instanceof PoolScale ) {
          this.visibleMasses.forEach( otherMass => {
            if ( mass !== otherMass ) {
              const horizontalForce = this.engine.bodyGetContactForceBetween( mass.body, otherMass.body ).x;

              // Blocks should never experience +x forces (to the right) by the PoolScale.
              // If they do, they are trapped beneath it, so teleport them back to the left.
              if ( horizontalForce > 0 && mass.getBounds().centerX < otherMass.getBounds().centerX ) {
                otherMass.teleportLeft( mass );
              }
            }
          } );
        }

        // Reset contact forces after we have stored them.
        PhysicsEngine.resetContactForces( mass.body );
        mass.contactForceInterpolatedProperty.setNextValue( contactForce );

        // Measure the weight on any Scale, including the PoolScale
        if ( mass instanceof Scale ) {
          let scaleForce = 0;
          this.visibleMasses.forEach( otherMass => {
            if ( mass !== otherMass ) {
              const verticalForce = this.engine.bodyGetContactForceBetween( mass.body, otherMass.body ).y;

              // Accumulate positive vertical forces to measure the weight on the scale.
              if ( verticalForce > 0 ) {
                scaleForce += verticalForce;
              }
            }
          } );
          mass.measuredWeightInterpolatedProperty.setNextValue( scaleForce );
        }

        const velocity = PhysicsEngine.bodyGetVelocity( mass.body );

        // Limit the velocity of the mass to ensure stability and faster convergence.
        if ( velocity.magnitude > 5 ) {
          velocity.setMagnitude( 5 );
          PhysicsEngine.bodySetVelocity( mass.body, velocity );
        }

        const basin = mass.containingBasin;

        let submergedVolume = 0;
        if ( basin ) {
          const displacedVolume = mass.getDisplacedVolume( basin.fluidYInterpolatedProperty.currentValue );

          // Ensure the submerged volume does not exceed the fluid volume in the basin. Bug fix for https://github.com/phetsims/buoyancy/issues/135
          submergedVolume = displacedVolume > basin.fluidVolumeProperty.value ? basin.fluidVolumeProperty.value : displacedVolume;
        }

        let massValue = mass.massProperty.value;

        // Update the submerged volume and mass value based on current conditions.
        submergedVolume = this.getUpdatedSubmergedVolume( mass, submergedVolume );
        massValue = this.getUpdatedMassValue( mass, massValue, submergedVolume );

        if ( submergedVolume !== 0 ) {
          const displacedMass = submergedVolume * this.pool.fluidDensityProperty.value;
          const acceleration = gravity + this.getAdditionalVerticalAcceleration( basin );

          const buoyantForce = new Vector2( 0, displacedMass * acceleration );
          this.engine.bodyApplyForce( mass.body, buoyantForce );
          mass.buoyancyForceInterpolatedProperty.setNextValue( buoyantForce );

          this.adjustVelocity( basin, velocity );

          // Calculate and apply viscous forces to simulate fluid resistance.
          const ratioSubmerged = ( 1 - DensityBuoyancyCommonQueryParameters.viscositySubmergedRatio ) +
                                 DensityBuoyancyCommonQueryParameters.viscositySubmergedRatio * submergedVolume / mass.volumeProperty.value;
          const hackedViscosity = 0.03 * Math.pow( this.pool.fluidMaterialProperty.value.viscosity / 0.03, 0.8 );
          const viscosityMass = Math.max( DensityBuoyancyCommonQueryParameters.viscosityMassCutoff, massValue );
          const viscousForce = velocity.times( -hackedViscosity * viscosityMass * ratioSubmerged * 3000 * DensityBuoyancyCommonQueryParameters.viscosityMultiplier );

          // Calculate the maximum allowable viscous force to prevent it from being so high that it could change the
          // direction of the velocity. Note the viscous force is always in the opposite direction of the velocity,
          // so we just need to manage the magnitude
          // F = ma = m dv/dt
          // see https://github.com/phetsims/density-buoyancy-common/issues/223
          const maxViscousForceMagnitude = velocity.magnitude * massValue / dt;
          const viscousForceMagnitude = Math.min( viscousForce.magnitude, maxViscousForceMagnitude );

          // Apply the viscous force if it is significant.
          if ( viscousForce.magnitude > 1E-6 ) {
            const actualViscousForce = viscousForce.normalize().times( viscousForceMagnitude );
            this.engine.bodyApplyForce( mass.body, actualViscousForce );
          }
        }
        else {

          // If not submerged, set buoyancy force to zero.
          mass.buoyancyForceInterpolatedProperty.setNextValue( Vector2.ZERO );
        }

        // Apply gravitational force to the mass.
        const gravityForce = new Vector2( 0, -massValue * gravity );
        this.engine.bodyApplyForce( mass.body, gravityForce );
        mass.gravityForceInterpolatedProperty.setNextValue( gravityForce );

        // Update the fraction of the mass that is submerged.
        mass.updateSubmergedMassFraction( gravity, this.pool.fluidDensityProperty.value );
      } );
    } );

    // Make sure to render it
    this.pool.scale && this.availableMasses.push( this.pool.scale );
  }

  /**
   * Implementation details for updateFluid that is independent of whether there is a Boat or not.
   * @param basins - The basins that are being updated
   * @param assignableBasins - The basins that masses can be assigned to, note these must be specified in order of precedence
   */
  protected updateFluidForBasins( basins: Basin[], assignableBasins: Basin[] ): void {
    this.visibleMasses.forEach( mass => mass.updateStepInformation() );
    basins.forEach( basin => {
      basin.stepMasses = this.visibleMasses.filter( mass => basin.isMassInside( mass ) );
    } );

    // Check to see if fluid "spilled" out of the pool, and set the finalized fluid volume
    this.pool.fluidVolumeProperty.value = Math.min( this.getPoolFluidVolume(), this.pool.getEmptyVolume( this.poolBounds.maxY ) );

    basins.forEach( basin => basin.computeY() );

    this.visibleMasses.forEach( mass => {
      mass.containingBasin = assignableBasins.find( basin => basin.isMassInside( mass ) ) || null;
    } );
  }

  /**
   * Resets things to their original values.
   */
  public reset(): void {

    this.gravityProperty.reset();

    this.pool.reset();

    this.availableMasses.forEach( mass => mass.reset() );
  }

  /**
   * Steps forward in time. This is a "simulation step", not a "physics engine step"
   */
  public step( dt: number ): void {

    // Ideally, InterpolatedProperty would only be read in the view. Locking InterpolatedProperty while doing the model
    // step provides the facility for asserting that this assumption is correct, see https://github.com/phetsims/density-buoyancy-common/issues/132
    InterpolatedProperty.lock();

    this.engine.step( dt );

    this.visibleMasses.forEach( mass => {
      mass.step( dt, this.engine.interpolationRatio );

      // If the mass is under the pool (likely because user forced it there), interrupt dragging and move it back up.
      if ( !( mass instanceof Scale ) && mass.matrix.m12() < this.poolBounds.minY ) {
        mass.teleportUp();
      }
    } );

    this.pool.fluidYInterpolatedProperty.setRatio( this.engine.interpolationRatio );

    InterpolatedProperty.unlock();
  }

  /**
   * Moves masses' previous positions to their current positions.
   */
  protected syncPreviousMassPositionsToCurrent(): void {
    this.visibleMasses.forEach( mass => PhysicsEngine.bodySynchronizePrevious( mass.body ) );
  }

  /**
   * Positions masses from the left of the pool outward, with padding
   */
  public positionMassesLeft( masses: Cuboid[] ): void {
    let position = this.poolBounds.minX;

    masses.forEach( mass => {
      mass.matrix.setToTranslation(
        position - BLOCK_SPACING - mass.sizeProperty.value.width / 2,
        -mass.sizeProperty.value.minY
      );
      position -= BLOCK_SPACING + mass.sizeProperty.value.width;
      mass.writeData();
    } );
  }

  /**
   * Positions masses from the right of the pool outward, with padding
   */
  public positionMassesRight( masses: Cuboid[] ): void {
    let position = this.poolBounds.maxX;

    masses.forEach( mass => {
      mass.matrix.setToTranslation(
        position + BLOCK_SPACING + mass.sizeProperty.value.width / 2,
        -mass.sizeProperty.value.minY
      );
      position += BLOCK_SPACING + mass.sizeProperty.value.width;
      mass.writeData();
    } );
  }

  /**
   * Positions masses from the left of the pool up
   */
  public positionStackLeft( masses: Cuboid[] ): void {
    const x = this.poolBounds.minX - BLOCK_SPACING - Math.max( ...masses.map( mass => mass.sizeProperty.value.width ) ) / 2;

    this.positionStack( masses, x );
  }

  /**
   * Positions masses from the right of the pool up
   */
  public positionStackRight( masses: Cuboid[] ): void {
    const x = this.poolBounds.maxX + BLOCK_SPACING + Math.max( ...masses.map( mass => mass.sizeProperty.value.width ) ) / 2;

    this.positionStack( masses, x );
  }

  /**
   * Position a stack of masses at a given center x.
   */
  private positionStack( masses: Cuboid[], x: number ): void {
    let position = 0;

    masses = _.sortBy( masses, mass => -mass.volumeProperty.value );

    masses.forEach( mass => {
      mass.matrix.setToTranslation( x, position + mass.sizeProperty.value.height / 2 );
      position += mass.sizeProperty.value.height;
      PhysicsEngine.bodySynchronizePrevious( mass.body );
      mass.writeData();
    } );
  }

  // NOTE: The functions below are to be overridden in BuoyancyApplicationsModel for Boat functionality

  /**
   * Computes the heights of the main pool fluid. Also check for fluid level/overflow and which basin contains which other basin.
   * NOTE: the overridden method in BuoyancyApplicationsModel does NOT call super.updateFluid()
   */
  protected updateFluid(): void {
    this.pool.childBasin = null;
    this.updateFluidForBasins( [ this.pool ], [ this.pool ] );
  }

  protected getPoolFluidVolume(): number {
    return this.pool.fluidVolumeProperty.value;
  }

  protected getUpdatedSubmergedVolume( mass: Mass, submergedVolume: number ): number {
    return submergedVolume;
  }

  protected getUpdatedMassValue( mass: Mass, massValue: number, submergedVolume: number ): number {
    return massValue;
  }

  protected getAdditionalVerticalAcceleration( basin: Basin | null ): number {
    return 0;
  }

  protected adjustVelocity( basin: Basin | null, velocity: Vector2 ): void {
    // no-op
  }

  protected updateVerticalMotion( dt: number ): void {
    // no-op
  }
}

densityBuoyancyCommon.register( 'DensityBuoyancyModel', DensityBuoyancyModel );