// Copyright 2020-2025, University of Colorado Boulder

/**
 * The main model for the Mystery screen of the Density simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import Emitter from '../../../../axon/js/Emitter.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import dotRandom from '../../../../dot/js/dotRandom.js';
import Matrix3 from '../../../../dot/js/Matrix3.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Enumeration from '../../../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../../../phet-core/js/EnumerationValue.js';
import optionize, { combineOptions, EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import StrictOmit from '../../../../phet-core/js/types/StrictOmit.js';
import GrabDragUsageTracker from '../../../../scenery-phet/js/accessibility/grab-drag/GrabDragUsageTracker.js';
import Color from '../../../../scenery/js/util/Color.js';
import ColorProperty from '../../../../scenery/js/util/ColorProperty.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import { toCubicMeters } from '../../common/DensityBuoyancyCommonConstants.js';
import BlockSetModel, { BlockSetModelOptions } from '../../common/model/BlockSetModel.js';
import Cube, { CubeOptions } from '../../common/model/Cube.js';
import Cuboid from '../../common/model/Cuboid.js';
import DensityBuoyancyModel from '../../common/model/DensityBuoyancyModel.js';
import { MaterialSchema } from '../../common/model/Mass.js';
import MassTag from '../../common/model/MassTag.js';
import Material from '../../common/model/Material.js';
import PhysicsEngine from '../../common/model/PhysicsEngine.js';
import Scale, { DisplayType } from '../../common/model/Scale.js';
import DensityBuoyancyCommonColors from '../../common/view/DensityBuoyancyCommonColors.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';

// constants
const randomColors = [
  DensityBuoyancyCommonColors.compareYellowColorProperty,
  DensityBuoyancyCommonColors.compareBlueColorProperty,
  DensityBuoyancyCommonColors.compareGreenColorProperty,
  DensityBuoyancyCommonColors.compareRedColorProperty,
  DensityBuoyancyCommonColors.comparePurpleColorProperty,
  DensityBuoyancyCommonColors.mysteryPinkColorProperty,
  DensityBuoyancyCommonColors.mysteryOrangeColorProperty,
  DensityBuoyancyCommonColors.mysteryLightPurpleColorProperty,
  DensityBuoyancyCommonColors.mysteryLightGreenColorProperty,
  DensityBuoyancyCommonColors.mysteryBrownColorProperty,
  DensityBuoyancyCommonColors.mysteryWhiteColorProperty,
  DensityBuoyancyCommonColors.mysteryGrayColorProperty,
  DensityBuoyancyCommonColors.mysteryMustardColorProperty,
  DensityBuoyancyCommonColors.mysteryPeachColorProperty,
  DensityBuoyancyCommonColors.mysteryMaroonColorProperty
];

export class MysteryBlockSet extends EnumerationValue {
  public static readonly SET_1 = new MysteryBlockSet( DensityBuoyancyCommonStrings.blockSet.set1StringProperty, 'set1' );
  public static readonly SET_2 = new MysteryBlockSet( DensityBuoyancyCommonStrings.blockSet.set2StringProperty, 'set2' );
  public static readonly SET_3 = new MysteryBlockSet( DensityBuoyancyCommonStrings.blockSet.set3StringProperty, 'set3' );
  public static readonly RANDOM = new MysteryBlockSet( DensityBuoyancyCommonStrings.blockSet.randomStringProperty, 'random' );

  public constructor( public readonly stringProperty: TReadOnlyProperty<string>, public readonly tandemName: string ) {
    super();
  }

  public static readonly enumeration = new Enumeration( MysteryBlockSet, {
    phetioDocumentation: 'Block set'
  } );
}

export type DensityMysteryModelOptions = StrictOmit<BlockSetModelOptions<MysteryBlockSet>, 'initialMode' | 'BlockSet' | 'createMassesCallback' | 'regenerateMassesCallback' | 'positionMassesCallback'>;

export default class DensityMysteryModel extends BlockSetModel<MysteryBlockSet> {

  private readonly scale: Scale;

  public constructor( providedOptions: DensityMysteryModelOptions ) {

    const tandem = providedOptions.tandem;

    const commonCubeOptions = {
      adjustVolumeOnMassChanged: true,
      massPropertyOptions: {
        phetioReadOnly: false
      },
      volumePropertyOptions: {
        phetioReadOnly: false
      },
      availableMassMaterials: [
        ...Material.SIMPLE_MASS_MATERIALS,
        Material.STEEL,
        Material.COPPER,
        Material.PLATINUM,
        'CUSTOM'
      ] satisfies MaterialSchema[],

      // Shared to all Masses on this screen
      grabDragUsageTracker: new GrabDragUsageTracker()
    };

    let densities: number[];
    let colors: ColorProperty[];
    const randomizeMaterialsEmitter = new Emitter();
    const randomizeMysteryMaterials = () => {
      densities = dotRandom.shuffle( Material.DENSITY_MYSTERY_SCREEN_MATERIALS ).slice( 0, 5 ).map( material => material.density );
      colors = dotRandom.shuffle( randomColors ).slice( 0, 5 );
      randomizeMaterialsEmitter.emit();
    };
    randomizeMysteryMaterials(); // initial setup

    const createMysteryVolumes = () => {
      return [
        // we will want 3 smaller masses on the right, then 2 larger masses on the left
        ...dotRandom.shuffle( [ 1, 2, 3, 4, 5, 6 ].map( toCubicMeters ) ).slice( 0, 3 ),
        ...dotRandom.shuffle( [ 7, 8, 9, 10 ].map( toCubicMeters ) ).slice( 0, 2 )
      ].sort();
    };

    const blockSetsTandem = tandem.createTandem( 'blockSets' );
    const set1Tandem = blockSetsTandem.createTandem( 'set1' );
    const set2Tandem = blockSetsTandem.createTandem( 'set2' );
    const set3Tandem = blockSetsTandem.createTandem( 'set3' );
    const randomTandem = blockSetsTandem.createTandem( 'random' );

    const createColorProperty = ( colorProperty: TReadOnlyProperty<Color>, cubeTandem: Tandem ) => {
      return new ColorProperty( colorProperty.value, {
        tandem: cubeTandem.createTandem( 'materialProperty' ).createTandem( 'customMaterial' ).createTandem( 'colorProperty' )
      } );
    };

    const createMasses = ( model: DensityBuoyancyModel, blockSet: MysteryBlockSet ) => {

      const cube1DTandem = set1Tandem.createTandem( `block${MassTag.ONE_D.tandemName}` );
      const cube1BTandem = set1Tandem.createTandem( `block${MassTag.ONE_B.tandemName}` );
      const set1ETandem = set1Tandem.createTandem( `block${MassTag.ONE_E.tandemName}` );
      const set1CTandem = set1Tandem.createTandem( `block${MassTag.ONE_C.tandemName}` );
      const set1ATandem = set1Tandem.createTandem( `block${MassTag.ONE_A.tandemName}` );
      const set2DTandem = set2Tandem.createTandem( `block${MassTag.TWO_D.tandemName}` );
      const set2ATandem = set2Tandem.createTandem( `block${MassTag.TWO_A.tandemName}` );
      const set2ETandem = set2Tandem.createTandem( `block${MassTag.TWO_E.tandemName}` );
      const set2CTandem = set2Tandem.createTandem( `block${MassTag.TWO_C.tandemName}` );
      const set2BTandem = set2Tandem.createTandem( `block${MassTag.TWO_B.tandemName}` );
      const set3ETandem = set3Tandem.createTandem( `block${MassTag.THREE_E.tandemName}` );
      const set3BTandem = set3Tandem.createTandem( `block${MassTag.THREE_B.tandemName}` );
      const set3DTandem = set3Tandem.createTandem( `block${MassTag.THREE_D.tandemName}` );
      const set3CTandem = set3Tandem.createTandem( `block${MassTag.THREE_C.tandemName}` );
      const set3ATandem = set3Tandem.createTandem( `block${MassTag.THREE_A.tandemName}` );

      // Convenience function to promote nested options to top-level
      const createCubeOptions = ( tandem: Tandem, tag: MassTag, density: number, colorProperty: ColorProperty ) => {
        return combineOptions<CubeOptions>( {}, commonCubeOptions, {
          tandem: tandem,
          tag: tag,
          customMaterialOptions: {
            density: density,
            colorProperty: createColorProperty( colorProperty, tandem )
          }
        } );
      };

      const createWithVolume = ( tandem: Tandem, tag: MassTag, volume: number, density: number, colorProperty: ColorProperty ) =>
        Cube.createWithVolume( model.engine, 'CUSTOM', Vector2.ZERO, volume, createCubeOptions( tandem, tag, density, colorProperty ) );

      const createWithMass = ( tandem: Tandem, tag: MassTag, mass: number, density: number, colorProperty: ColorProperty ) =>
        Cube.createWithMass( model.engine, 'CUSTOM', Vector2.ZERO, mass, createCubeOptions( tandem, tag, density, colorProperty ) );

      switch( blockSet ) {
        case MysteryBlockSet.SET_1:
          return [
            createWithVolume( cube1DTandem, MassTag.ONE_D, 0.005, Material.WATER.density, DensityBuoyancyCommonColors.compareRedColorProperty ),
            createWithVolume( cube1BTandem, MassTag.ONE_B, 0.001, Material.WOOD.density, DensityBuoyancyCommonColors.compareBlueColorProperty ),
            createWithVolume( set1ETandem, MassTag.ONE_E, 0.007, Material.WOOD.density, DensityBuoyancyCommonColors.compareGreenColorProperty ),
            createWithVolume( set1CTandem, MassTag.ONE_C, 0.001, Material.GOLD.density, DensityBuoyancyCommonColors.compareYellowColorProperty ),
            createWithVolume( set1ATandem, MassTag.ONE_A, 0.0055, Material.DIAMOND.density, DensityBuoyancyCommonColors.comparePurpleColorProperty )
          ];
        case MysteryBlockSet.SET_2:
          return [
            createWithMass( set2DTandem, MassTag.TWO_D, 18, 4500, DensityBuoyancyCommonColors.mysteryPinkColorProperty ),
            createWithMass( set2ATandem, MassTag.TWO_A, 18, 11340, DensityBuoyancyCommonColors.mysteryOrangeColorProperty ),
            createWithVolume( set2ETandem, MassTag.TWO_E, 0.005, Material.COPPER.density, DensityBuoyancyCommonColors.mysteryLightPurpleColorProperty ),
            createWithMass( set2CTandem, MassTag.TWO_C, 2.7, 2700, DensityBuoyancyCommonColors.mysteryLightGreenColorProperty ),
            createWithMass( set2BTandem, MassTag.TWO_B, 10.8, 2700, DensityBuoyancyCommonColors.mysteryBrownColorProperty )
          ];
        case MysteryBlockSet.SET_3:
          return [
            createWithMass( set3ETandem, MassTag.THREE_E, 6, 950, DensityBuoyancyCommonColors.mysteryWhiteColorProperty ),
            createWithMass( set3BTandem, MassTag.THREE_B, 6, 1000, DensityBuoyancyCommonColors.mysteryGrayColorProperty ), // density of water in SI
            createWithMass( set3DTandem, MassTag.THREE_D, 2, 400, DensityBuoyancyCommonColors.mysteryMustardColorProperty ),
            createWithMass( set3CTandem, MassTag.THREE_C, 23.4, 7800, DensityBuoyancyCommonColors.mysteryPeachColorProperty ),
            createWithMass( set3ATandem, MassTag.THREE_A, 2.85, 950, DensityBuoyancyCommonColors.mysteryMaroonColorProperty )
          ];
        case MysteryBlockSet.RANDOM: {

          // The ordering here is like this to ensure that the blocks are in order when stacked on both sides of the pool.
          const tags = [ MassTag.C, MassTag.D, MassTag.E, MassTag.A, MassTag.B ];

          const mysteryVolumes = createMysteryVolumes();

          return _.range( 0, 5 ).map( i => {
            const cubeTandem = randomTandem.createTandem( `block${tags[ i ].tandemName}` );

            const colorProperty = new ColorProperty( colors[ i ].value, {
              tandem: cubeTandem.createTandem( 'materialProperty' ).createTandem( 'customMaterial' ).createTandem( 'colorProperty' )
            } );

            // Cannot use the factored out version above because the colorProperty is not wrapped
            const cube = Cube.createWithVolume( model.engine, 'CUSTOM', Vector2.ZERO, mysteryVolumes[ i ],
              combineOptions<CubeOptions>( {}, commonCubeOptions, {
                tag: tags[ i ],
                tandem: cubeTandem,
                customMaterialOptions: {
                  colorProperty: colorProperty,
                  density: densities[ i ]
                }
              } ) );

            randomizeMaterialsEmitter.addListener( () => {
              cube.materialProperty.customMaterial.densityProperty.value = densities[ i ];
              colorProperty.value = colors[ i ].value;
            } );

            return cube;
          } );
        }
        default:
          throw new Error( `unknown blockSet: ${blockSet}` );
      }
    };

    const regenerateMasses = ( blockSet: MysteryBlockSet, masses: Cuboid[] ) => {
      assert && assert( blockSet === MysteryBlockSet.RANDOM, 'Unexpected blockSet regeneration:', blockSet );

      randomizeMysteryMaterials();
      const mysteryVolumes = createMysteryVolumes();

      masses.forEach( ( mass, i ) => {
        mass.updateSize( Cube.boundsFromVolume( mysteryVolumes[ i ] ) );
      } );
    };

    const positionMasses = ( model: DensityBuoyancyModel, blockSet: MysteryBlockSet, masses: Cuboid[] ) => {
      switch( blockSet ) {
        case MysteryBlockSet.SET_1:
          model.positionStackLeft( [ masses[ 1 ], masses[ 4 ] ] );
          model.positionStackRight( [ masses[ 2 ], masses[ 3 ], masses[ 0 ] ] );
          break;
        case MysteryBlockSet.SET_2:
          model.positionStackLeft( [ masses[ 1 ], masses[ 4 ] ] );
          model.positionStackRight( [ masses[ 2 ], masses[ 3 ], masses[ 0 ] ] );
          break;
        case MysteryBlockSet.SET_3:
          model.positionStackLeft( [ masses[ 1 ], masses[ 4 ] ] );
          model.positionStackRight( [ masses[ 2 ], masses[ 3 ], masses[ 0 ] ] );
          break;
        case MysteryBlockSet.RANDOM:
          model.positionStackLeft( [ masses[ 3 ], masses[ 4 ] ] );
          model.positionStackRight( [ masses[ 0 ], masses[ 1 ], masses[ 2 ] ] );
          break;
        default:
          throw new Error( `unknown blockSet: ${blockSet}` );
      }
    };

    const options = optionize<DensityMysteryModelOptions, EmptySelfOptions, BlockSetModelOptions<MysteryBlockSet>>()( {

      fluidSelectionType: 'justWater',
      initialMode: MysteryBlockSet.SET_1,
      BlockSet: MysteryBlockSet.enumeration,

      // Prefer callbacks to overridden abstract methods in this case because it is an antipattern to have the parent
      // type call an overridden method, since the subtype may not have been fully constructed yet and have undefined
      // members.
      createMassesCallback: createMasses,
      regenerateMassesCallback: regenerateMasses,
      positionMassesCallback: positionMasses,

      usePoolScale: false
    }, providedOptions );

    super( options );

    const scalePositionProperty = new DerivedProperty( [ this.invisibleBarrierBoundsProperty ], bounds => {
      return new Vector2( -0.75 + bounds.minX + 0.875, -Scale.SCALE_BASE_BOUNDS.minY );
    } );

    this.scale = new Scale( this.engine, this.gravityProperty, {
      matrix: Matrix3.translationFromVector( scalePositionProperty.value ),
      displayType: DisplayType.KILOGRAMS,
      canMove: false,
      tandem: tandem.createTandem( 'scale' ),
      massPropertyOptions: {
        phetioFeatured: false
      },
      materialPropertyOptions: {
        phetioFeatured: false
      },
      volumePropertyOptions: {
        phetioFeatured: false
      }
    } );
    this.availableMasses.push( this.scale );

    // Move the scale with the barrier, see https://github.com/phetsims/density/issues/73
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    scalePositionProperty.lazyLink( position => {
      this.scale.matrix.setToTranslation( position.x, position.y );

      // When we reset-all, we'll want it to move back to here
      this.scale.setResetLocation();

      // Adjust its previous position also
      PhysicsEngine.bodySynchronizePrevious( this.scale.body );

      this.scale.writeData();
    } );
  }

  /**
   * Resets things to their original values.
   */
  public override reset(): void {
    super.reset();

    // Make sure to create new random masses on a reset
    this.regenerate( MysteryBlockSet.RANDOM );
  }
}

densityBuoyancyCommon.register( 'DensityMysteryModel', DensityMysteryModel );