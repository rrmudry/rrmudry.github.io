// Copyright 2019-2024, University of Colorado Boulder

/**
 * The main model for the Intro screen of the Density simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import EnumerationProperty from '../../../../axon/js/EnumerationProperty.js';
import Property from '../../../../axon/js/Property.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import GrabDragUsageTracker from '../../../../scenery-phet/js/accessibility/grab-drag/GrabDragUsageTracker.js';
import Cube from '../../common/model/Cube.js';
import Cuboid from '../../common/model/Cuboid.js';
import DensityBuoyancyModel, { DensityBuoyancyModelOptions } from '../../common/model/DensityBuoyancyModel.js';
import { MaterialSchema } from '../../common/model/Mass.js';
import MassTag from '../../common/model/MassTag.js';
import Material from '../../common/model/Material.js';
import TwoBlockMode from '../../common/model/TwoBlockMode.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

export type DensityIntroModelOptions = DensityBuoyancyModelOptions;

export default class DensityIntroModel extends DensityBuoyancyModel {

  public readonly modeProperty: Property<TwoBlockMode>;
  public readonly blockA: Cuboid;
  public readonly blockB: Cuboid;

  public constructor( providedOptions: DensityIntroModelOptions ) {

    const options = optionize<DensityIntroModelOptions, EmptySelfOptions, DensityBuoyancyModelOptions>()( {
      fluidSelectionType: 'justWater',
      usePoolScale: false
    }, providedOptions );

    const tandem = options.tandem;

    super( options );

    const blocksTandem = tandem.createTandem( 'blocks' );
    this.modeProperty = new EnumerationProperty( TwoBlockMode.ONE_BLOCK, {
      tandem: blocksTandem.createTandem( 'modeProperty' ),
      phetioFeatured: true
    } );

    const availableMassMaterials: MaterialSchema[] = [
      ...Material.SIMPLE_MASS_MATERIALS,
      'CUSTOM'
    ];

    const grabDragUsageTracker = new GrabDragUsageTracker();
    this.blockA = Cube.createWithMass( this.engine, Material.WOOD, new Vector2( -0.2, 0.2 ), 2, {
      tag: MassTag.OBJECT_A,
      tandem: blocksTandem.createTandem( 'blockA' ),
      availableMassMaterials: availableMassMaterials,
      grabDragUsageTracker: grabDragUsageTracker,
      customMaterialOptions: {
        densityPropertyOptions: {
          phetioReadOnly: true // Controlled by mass and volume
        }
      }
    } );
    this.availableMasses.push( this.blockA );
    this.blockB = Cube.createWithMass( this.engine, Material.ALUMINUM, new Vector2( 0.2, 0.2 ), 13.5, {
      tag: MassTag.OBJECT_B,
      tandem: blocksTandem.createTandem( 'blockB' ),
      availableMassMaterials: availableMassMaterials,
      visible: this.modeProperty.value === TwoBlockMode.TWO_BLOCKS,
      grabDragUsageTracker: grabDragUsageTracker,
      customMaterialOptions: {
        densityPropertyOptions: {
          phetioReadOnly: true // Controlled by mass and volume
        }
      }
    } );
    this.availableMasses.push( this.blockB );

    this.modeProperty.link( mode => {
      this.blockB.internalVisibleProperty.value = mode === TwoBlockMode.TWO_BLOCKS;
    } );
  }

  /**
   * Resets things to their original values.
   */
  public override reset(): void {
    this.modeProperty.reset();

    // Blocks are reset in the super
    super.reset();
  }
}

densityBuoyancyCommon.register( 'DensityIntroModel', DensityIntroModel );