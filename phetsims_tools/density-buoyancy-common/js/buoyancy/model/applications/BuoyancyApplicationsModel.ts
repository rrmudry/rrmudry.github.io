// Copyright 2019-2024, University of Colorado Boulder

/**
 * The main model for the Applications screen of the Buoyancy simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../../axon/js/DerivedProperty.js';
import StringUnionProperty from '../../../../../axon/js/StringUnionProperty.js';
import Matrix3 from '../../../../../dot/js/Matrix3.js';
import Vector2 from '../../../../../dot/js/Vector2.js';
import optionize, { EmptySelfOptions } from '../../../../../phet-core/js/optionize.js';
import Basin from '../../../common/model/Basin.js';
import Cube from '../../../common/model/Cube.js';
import DensityBuoyancyModel, { DensityBuoyancyModelOptions } from '../../../common/model/DensityBuoyancyModel.js';
import Mass, { MaterialSchema } from '../../../common/model/Mass.js';
import MassTag from '../../../common/model/MassTag.js';
import Material from '../../../common/model/Material.js';
import PhysicsEngine from '../../../common/model/PhysicsEngine.js';
import Scale, { DisplayType } from '../../../common/model/Scale.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import Boat from './Boat.js';
import Bottle from './Bottle.js';
import { BottleOrBoat, BottleOrBoatValues } from './BottleOrBoat.js';

export type BuoyancyApplicationsModelOptions = DensityBuoyancyModelOptions;

// Faster than normal stepping to fill the boat (kind of like animation speed)
const FILL_EMPTY_MULTIPLIER = 0.3;

// 90% of the boat is out of the fluid before spilling out the full boat
const BOAT_READY_TO_SPILL_OUT_THRESHOLD = 0.9;

// Y model distance of tolerance between the boat basin fluidY level and the boat basin stepTop. This was needed to
// prevent filling thrashing as a containing mass floats around. See updateFluid();
const BOAT_FULL_THRESHOLD = 0.01;

export default class BuoyancyApplicationsModel extends DensityBuoyancyModel {

  public readonly applicationModeProperty: StringUnionProperty<BottleOrBoat>;

  public readonly bottle: Bottle;
  public readonly block: Cube;
  public readonly boat: Boat;
  private readonly scale: Scale; // Scale sitting on the ground next to the pool

  // Flag that sets an animation to empty the boat of any fluid inside of it
  private spillingFluidOutOfBoat = false;

  public constructor( providedOptions: BuoyancyApplicationsModelOptions ) {

    const options = optionize<BuoyancyApplicationsModelOptions, EmptySelfOptions, DensityBuoyancyModelOptions>()( {
      fluidSelectionType: 'all'
    }, providedOptions );

    const tandem = options.tandem;

    super( options );

    this.applicationModeProperty = new StringUnionProperty<BottleOrBoat>( 'bottle', {
      validValues: BottleOrBoatValues,
      tandem: options.tandem.createTandem( 'applicationModeProperty' ),
      phetioFeatured: true
    } );

    const objectsTandem = tandem.createTandem( 'objects' );

    this.bottle = new Bottle( this.engine, {
      matrix: Matrix3.translation( 0, 0 ),
      tandem: objectsTandem.createTandem( 'bottle' ),
      visible: this.applicationModeProperty.value === 'bottle',
      tag: MassTag.OBJECT_A
    } );
    this.availableMasses.push( this.bottle );

    const sortedByDensity: MaterialSchema[] = _.sortBy( [
        Material.PYRITE,
        Material.STEEL,
        Material.SILVER,
        Material.TANTALUM,
        Material.GOLD,
        Material.PLATINUM
      ].concat( Material.SIMPLE_MASS_MATERIALS ),

      material => material.density );
    const availableMassMaterials = sortedByDensity.concat( [
      // Adding custom/mystery Materials separately, so they aren't sorted above by density
      'CUSTOM',
      Material.MATERIAL_X,
      Material.MATERIAL_Y
    ] );

    this.block = Cube.createWithVolume( this.engine, Material.BRICK, new Vector2( -0.5, 0.3 ), 0.001, {
      visible: this.applicationModeProperty.value === 'boat',
      tandem: objectsTandem.createTandem( 'block' ),
      availableMassMaterials: availableMassMaterials,
      customMaterialOptions: {
        densityPropertyOptions: {
          phetioReadOnly: true // Controlled by mass and volume
        }
      }
    } );
    this.availableMasses.push( this.block );

    // DerivedProperty doesn't need disposal, since everything here lives for the lifetime of the simulation
    this.boat = new Boat( this.engine, new DerivedProperty( [ this.block.sizeProperty ], size => size.depth ), this.pool.fluidMaterialProperty, {
      matrix: Matrix3.translation( 0.08, -0.1 ),
      tandem: objectsTandem.createTandem( 'boat' ),
      visible: this.applicationModeProperty.value === 'boat'
    } );
    this.availableMasses.push( this.boat );

    this.scale = new Scale( this.engine, this.gravityProperty, {
      matrix: Matrix3.translation( -0.77, -Scale.SCALE_BASE_BOUNDS.minY ),
      displayType: DisplayType.NEWTONS,
      tandem: tandem.createTandem( 'scale' ),
      canMove: false
    } );
    this.availableMasses.push( this.scale );

    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    this.applicationModeProperty.link( ( mode, previousScene ) => {
      this.updateMassVisibilities();

      // When switching from boat to bottle scene, subtract the scale volume from the pool and vice versa (-1 and 1)
      // But don't do it when the bottle scene is first loaded (0)
      const plusMinusScaleVolume = mode === 'bottle' ?
                                   previousScene === 'boat' ? -1 : 0 : 1;
      this.pool.fluidVolumeProperty.value += plusMinusScaleVolume * this.pool.scale!.volumeProperty.value;
      this.pool.fluidVolumeProperty.setInitialValue( this.pool.fluidVolumeProperty.value );

      assert && assert( !this.boat.visibleProperty.value || !this.bottle.visibleProperty.value,
        'Boat and bottle should not be visible at the same time' );
    } );
  }

  public override step( dt: number ): void {

    // Even thought this error would likely be caught above, and would likely be seen at runtime, double check just in case
    assert && assert( !this.boat.visibleProperty.value || !this.bottle.visibleProperty.value,
      'Boat and bottle should not be visible at the same time' );

    super.step( dt );
  }

  /**
   * Moves the boat and block to their initial positions. Does not change the volume of boat or block. This is designed
   * to allow the student to re-float a sunken boat.
   */
  public resetBoatAndBlockPosition(): void {

    // Interrupt first in case they are currently being dragged,
    this.block.interruptedEmitter.emit();
    this.boat.interruptedEmitter.emit();

    this.block.resetPosition();
    this.boat.resetPosition();

    // Reset boat's other variables
    this.boat.isFullySubmerged = false;
    this.boat.verticalVelocity = 0;
    this.boat.verticalAcceleration = 0;

    this.spillingFluidOutOfBoat = false;

    this.boat.basin.fluidVolumeProperty.value = 0;
    this.boat.basin.computeY();

    this.pool.reset( false, false );
  }

  /**
   * Resets things to their original values.
   */
  public override reset(): void {
    this.bottle.reset();
    this.block.reset();
    this.boat.reset();

    super.reset();
    this.spillingFluidOutOfBoat = false;

    this.applicationModeProperty.reset();

    this.updateMassVisibilities();
    assert && assert( !this.boat.visibleProperty.value || !this.bottle.visibleProperty.value,
      'Boat and bottle should not be visible at the same time' );
  }

  /**
   * Computes the heights of the main pool fluid, incorporating the Boat logic.
   * NOTE: This does not call super.updateFluid() because we need to handle the boat logic with the rest of the logic here.
   */
  protected override updateFluid(): void {

    const boat = this.boat;

    const basins: Basin[] = [ this.pool ];
    if ( boat.visibleProperty.value ) {
      basins.push( boat.basin );
      this.pool.childBasin = boat.basin;
    }
    else {
      this.pool.childBasin = null;
    }

    // If we have a boat that is NOT submerged, we'll assign masses into the boat's basin where relevant. Otherwise,
    // anything will go just into the pool's basin.
    // Note the order is important here, as the boat basin takes precedence.
    const assignableBasins = boat && boat.visibleProperty.value && !boat.isFullySubmerged ? [ boat.basin, this.pool ] : [ this.pool ];

    this.updateFluidForBasins( basins, assignableBasins );
  }

  // May need to adjust volumes between the boat/pool if there is a boat
  protected override getPoolFluidVolume(): number {

    let poolFluidVolume = this.pool.fluidVolumeProperty.value;

    const boat = this.boat;

    assert && assert( boat, 'boat needed to update fluid for boat' );

    const boatBasin = boat.basin;
    if ( boat.visibleProperty.value ) {
      let boatFluidVolume = boatBasin.fluidVolumeProperty.value;
      const boatBasinMaximumVolume = boatBasin.getMaximumVolume( boatBasin.stepTop );

      const poolEmptyVolumeToBoatTop = this.pool.getEmptyVolume( Math.min( boat.stepTop, this.poolBounds.maxY ) );
      const boatEmptyVolumeToBoatTop = boatBasin.getEmptyVolume( boat.stepTop );

      // Calculate adjustments to fluid volumes to match the current space in the basin
      let poolExcess = poolFluidVolume - poolEmptyVolumeToBoatTop;
      let boatExcess = boatFluidVolume - boatEmptyVolumeToBoatTop;

      const boatHeight = boat.shapeProperty.value.getBounds().height;

      if ( boatFluidVolume ) {

        // If the top of the boat is out of the fluid past the height threshold, spill the fluid back into the pool
        // (even if not totally full).
        if ( boat.stepTop > this.pool.fluidYInterpolatedProperty.currentValue + boatHeight * BOAT_READY_TO_SPILL_OUT_THRESHOLD ) {
          this.spillingFluidOutOfBoat = true;
        }
      }
      else {
        // If the boat is empty, stop spilling
        this.spillingFluidOutOfBoat = false;
      }

      // If the boat is out of the fluid, spill the fluid back into the pool
      if ( this.spillingFluidOutOfBoat ) {
        boatExcess = Math.min( FILL_EMPTY_MULTIPLIER * boat.volumeProperty.value, boatFluidVolume );
      }
      else if ( boatFluidVolume > 0 &&
                Math.abs( boatBasin.fluidYInterpolatedProperty.currentValue - boatBasin.stepTop ) >= BOAT_FULL_THRESHOLD ) {
        // If the boat is neither full nor empty, nor spilling, then it is currently filling up. We will up no matter
        // the current fluid leve or the boat AND no matter the boats position. This is because the boat can only
        // ever be full or empty (or animating to one of those states).

        const excess = Math.min( FILL_EMPTY_MULTIPLIER * boat.volumeProperty.value, boatBasinMaximumVolume - boatFluidVolume ); // This animates the boat spilling in
        poolExcess = excess;
        boatExcess = -excess;
      }

      if ( poolExcess > 0 && boatExcess < 0 ) {
        const transferVolume = Math.min( poolExcess, -boatExcess );
        poolFluidVolume -= transferVolume;
        boatFluidVolume += transferVolume;
      }
      else if ( boatExcess > 0 ) {
        // If the boat overflows, just dump the rest in the pool
        poolFluidVolume += boatExcess;
        boatFluidVolume -= boatExcess;
      }
      boatBasin.fluidVolumeProperty.value = boatFluidVolume;
    }
    else {

      // When the boat is hidden (whether via changing scene or by phet-io), move the fluid from the boat basin to the pool.
      poolFluidVolume += boatBasin.fluidVolumeProperty.value;
      boatBasin.fluidVolumeProperty.value = 0;
    }
    return poolFluidVolume;
  }

  protected override getUpdatedSubmergedVolume( mass: Mass, submergedVolume: number ): number {

    if ( mass === this.boat && this.boat.visibleProperty.value && this.boat.isFullySubmerged ) {

      // Special consideration for when boat is submerged
      // Don't count the fluid inside the boat as part of the volume
      return this.boat.volumeProperty.value;
    }
    else {
      return super.getUpdatedSubmergedVolume( mass, submergedVolume );
    }
  }

  protected override getUpdatedMassValue( mass: Mass, massValue: number, submergedVolume: number ): number {

    if ( mass === this.boat && this.boat.visibleProperty.value && this.boat.isFullySubmerged ) {

      // Special consideration for when boat is submerged
      // Don't count the fluid inside the boat as part of the mass
      return submergedVolume * this.boat.materialProperty.value.density;
    }
    else {
      return super.getUpdatedMassValue( mass, massValue, submergedVolume );
    }
  }

  // Vertical acceleration of the boat will change the buoyant force.
  protected override getAdditionalVerticalAcceleration( basin: Basin | null ): number {
    return basin === this.boat.basin ? this.boat.verticalAcceleration : 0;
  }

  protected override adjustVelocity( basin: Basin | null, velocity: Vector2 ): void {

    // If the boat is moving, assume the fluid moves with it, and apply viscosity due to the movement of our mass
    // inside the boat's fluid.
    if ( basin === this.boat.basin ) {
      velocity.subtract( PhysicsEngine.bodyGetVelocity( this.boat.body ) );
    }
  }

  protected override updateVerticalMotion( dt: number ): void {
    super.updateVerticalMotion( dt );

    if ( dt !== 0 && this.boat.visibleProperty.value ) {
      this.boat.updateVerticalMotion( this.pool, dt );
    }
  }

  private updateMassVisibilities(): void {
    const mode = this.applicationModeProperty.value;
    this.scale.internalVisibleProperty.value = true; // Unnecessary, but for completeness.

    this.boat.internalVisibleProperty.value = mode === 'boat';
    this.block.internalVisibleProperty.value = mode === 'boat';

    // As described in https://github.com/phetsims/buoyancy/issues/118#issue-2192969056, the submerged scale only shows
    // for the bottle scene, not for the boat
    this.pool.scale!.internalVisibleProperty.value = mode === 'bottle';
    this.bottle.internalVisibleProperty.value = mode === 'bottle';
  }
}

densityBuoyancyCommon.register( 'BuoyancyApplicationsModel', BuoyancyApplicationsModel );