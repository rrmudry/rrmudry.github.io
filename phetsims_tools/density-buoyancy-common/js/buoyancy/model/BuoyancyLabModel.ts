// Copyright 2019-2024, University of Colorado Boulder

/**
 * The main model for the Lab screen of the Buoyancy simulation.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import ReadOnlyProperty from '../../../../axon/js/ReadOnlyProperty.js';
import Matrix3 from '../../../../dot/js/Matrix3.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import Cube from '../../common/model/Cube.js';
import DensityBuoyancyModel, { DensityBuoyancyModelOptions } from '../../common/model/DensityBuoyancyModel.js';
import { MaterialSchema } from '../../common/model/Mass.js';
import Material from '../../common/model/Material.js';
import Scale, { DisplayType } from '../../common/model/Scale.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

export type BuoyancyLabModelOptions = DensityBuoyancyModelOptions;

export default class BuoyancyLabModel extends DensityBuoyancyModel {

  public readonly block: Cube;
  public readonly fluidDisplacedVolumeProperty: ReadOnlyProperty<number>;

  public constructor( providedOptions: BuoyancyLabModelOptions ) {

    const options = optionize<BuoyancyLabModelOptions, EmptySelfOptions, DensityBuoyancyModelOptions>()( {
      fluidSelectionType: 'all',
      isGravityPropertyInstrumented: true
    }, providedOptions );

    super( options );

    const availableMassMaterials: MaterialSchema[] = [
      ...Material.SIMPLE_MASS_MATERIALS,
      'CUSTOM',
      Material.MATERIAL_T,
      Material.MATERIAL_U
    ];

    this.block = Cube.createWithMass( this.engine, Material.WOOD, new Vector2( -0.2, 0.2 ), 2, {
      tandem: options.tandem.createTandem( 'block' ),
      availableMassMaterials: availableMassMaterials,
      customMaterialOptions: {
        densityPropertyOptions: {
          phetioReadOnly: true // Controlled by mass and volume
        }
      }
    } );
    this.availableMasses.push( this.block );

    // Left scale
    this.availableMasses.push( new Scale( this.engine, this.gravityProperty, {
      matrix: Matrix3.translation( -0.65, -Scale.SCALE_BASE_BOUNDS.minY ),
      displayType: DisplayType.NEWTONS,
      tandem: options.tandem.createTandem( 'scale' ),
      canMove: false,
      inputEnabledPropertyOptions: {
        phetioReadOnly: false
      }
    } ) );

    this.fluidDisplacedVolumeProperty = new DerivedProperty(
      [ this.block.percentSubmergedProperty, this.block.volumeProperty ],
      ( percentSubmerged, volume ) => {
        return percentSubmerged / 100 * volume * DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER;
      }, {
        tandem: this.pool.fluidTandem.createTandem( 'displacedVolumeProperty' ),
        phetioDocumentation: 'Volume of fluid displaced by objects in the pool.',
        phetioValueType: NumberIO,
        phetioFeatured: true,
        units: 'L'
      }
    );
  }

  /**
   * Resets things to their original values.
   */
  public override reset(): void {
    super.reset();

    this.block.reset();
  }
}

densityBuoyancyCommon.register( 'BuoyancyLabModel', BuoyancyLabModel );