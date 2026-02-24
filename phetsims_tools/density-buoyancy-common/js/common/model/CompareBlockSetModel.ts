// Copyright 2024-2025, University of Colorado Boulder

/**
 * Model set up to support a "comparison" BlockSet where you can "lock" one variable of the density equation such
 * that all cubes have that component value. That "locked" variable (for example "same mass"), can be adjusted with
 * a control to effect all Cubes in the model.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Multilink from '../../../../axon/js/Multilink.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Property from '../../../../axon/js/Property.js';
import { propertyStateHandlerSingleton } from '../../../../axon/js/PropertyStateHandler.js';
import PropertyStatePhase from '../../../../axon/js/PropertyStatePhase.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Range from '../../../../dot/js/Range.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import { affirmCallback } from '../../../../perennial-alias/js/browser-and-node/affirm.js';
import optionize, { combineOptions } from '../../../../phet-core/js/optionize.js';
import StrictOmit from '../../../../phet-core/js/types/StrictOmit.js';
import WithRequired from '../../../../phet-core/js/types/WithRequired.js';
import GrabDragUsageTracker from '../../../../scenery-phet/js/accessibility/grab-drag/GrabDragUsageTracker.js';
import Color from '../../../../scenery/js/util/Color.js';
import ColorProperty from '../../../../scenery/js/util/ColorProperty.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import BlockSet from './BlockSet.js';
import BlockSetModel, { BlockSetModelOptions } from './BlockSetModel.js';
import Cube, { CubeOptions, StrictCubeOptions } from './Cube.js';
import HasChangedNumberProperty from './HasChangedNumberProperty.js';
import { MaterialSchema } from './Mass.js';
import Material from './Material.js';
import PhysicsEngine from './PhysicsEngine.js';

affirmCallback( () => BlockSet.enumeration.values.length === 3, 'This class is very hard coded for the three "SAME" values of BlockSet' );

// Public API for specifying a cube in the BlockSet. A cube will exist in all BlockSet values.
type CubeData = {
  sameMassVolume: number;
  sameVolumeMass: number;
  sameDensityVolume: number;
  colorProperty: Property<Color>;
  sameMassCubeOptions: WithRequired<Partial<CubeOptions>, 'tandem'>;
  sameVolumeCubeOptions: WithRequired<Partial<CubeOptions>, 'tandem'>;
  sameDensityCubeOptions: WithRequired<Partial<CubeOptions>, 'tandem'>;
};

type SelfOptions = {
  cubesData: CubeData[];

  sameMassValue?: number;
  sameMassRange?: Range;
  sameVolumeValue?: number;
  sameVolumeRange?: Range;
  sameDensityValue?: number;
  sameDensityRange?: Range;

  // Provided options to cubes for all blockSets
  sharedCubeOptions?: Partial<StrictCubeOptions>;

  // Support for using non-custom materials as the initial materials of the blocks, but only if their densities are
  // the same. Once the variable changes for the given block set, these are ignored, and custom materials are used. Use
  // an empty list to opt out of this feature.
  initialMaterials?: Material[];
};

type ParentOptions = BlockSetModelOptions<BlockSet>;

type ExcludedParentOptions = 'initialMode' | 'BlockSet' | 'createMassesCallback' | 'regenerateMassesCallback';

export type CompareBlockSetModelOptions = SelfOptions & StrictOmit<ParentOptions, ExcludedParentOptions>;

// Filled in later, and so not needed by the optionize call
type OptionizeParent = StrictOmit<ParentOptions, 'createMassesCallback'>;

type StrictCubeOptionsNoAvailableMaterials = StrictOmit<StrictCubeOptions, 'availableMassMaterials'>;

export default class CompareBlockSetModel extends BlockSetModel<BlockSet> {

  // Properties that control all blocks within the block set named for it massProperty -> "sameMass".
  public readonly massProperty: NumberProperty;
  public readonly volumeProperty: NumberProperty;
  public readonly densityProperty: NumberProperty;

  public constructor( providedOptions: CompareBlockSetModelOptions ) {

    const options = optionize<CompareBlockSetModelOptions, SelfOptions, OptionizeParent>()( {
      sameMassValue: 5,
      sameMassRange: new Range( 1, 10 ),
      sameVolumeValue: 0.005,
      sameVolumeRange: new Range( 0.001, 0.01 ),
      sameDensityValue: 400,
      sameDensityRange: new Range( 100, 3000 ),

      initialMaterials: [],

      sharedCubeOptions: {
        grabDragUsageTracker: new GrabDragUsageTracker(),
        materialPropertyOptions: {
          phetioReadOnly: true // See https://github.com/phetsims/density-buoyancy-common/issues/270#issuecomment-2243371397
        }
      },

      // BlockSetModel options
      initialMode: BlockSet.SAME_MASS,
      BlockSet: BlockSet.enumeration,
      regenerateMassesCallback: _.noop // Compare blocks live for the lifetime of the sim, and are just mutated.

    }, providedOptions );

    const tandem = options.tandem;
    const blockSetsTandem = tandem.createTandem( 'blockSets' );

    const massProperty = new HasChangedNumberProperty( options.sameMassValue, {
      range: options.sameMassRange,
      tandem: blockSetsTandem.createTandem( BlockSet.SAME_MASS.tandemName ).createTandem( 'massProperty' ),
      phetioFeatured: true,
      units: 'kg'
    } );

    const volumeProperty = new HasChangedNumberProperty( options.sameVolumeValue, {
      range: options.sameVolumeRange,
      tandem: blockSetsTandem.createTandem( BlockSet.SAME_VOLUME.tandemName ).createTandem( 'volumeProperty' ),
      phetioFeatured: true,
      units: 'm^3'
    } );

    const densityProperty = new HasChangedNumberProperty( options.sameDensityValue, {
      range: options.sameDensityRange,

      tandem: blockSetsTandem.createTandem( BlockSet.SAME_DENSITY.tandemName ).createTandem( 'densityProperty' ),
      phetioFeatured: true,
      units: 'kg/m^3'
    } );

    // A good approximation of the potential range (as used for the block shading), is the range for the sameDensity control
    const colorDensityRange = options.sameDensityRange;

    const getCubeOptions = ( cubeOptions: StrictCubeOptionsNoAvailableMaterials ) => combineOptions<StrictCubeOptionsNoAvailableMaterials>( {}, options.sharedCubeOptions, cubeOptions );

    // Create one mass for each cubeData/blockSet combo, based on the provided blockSet
    const createMasses = ( model: BlockSetModel<BlockSet>, blockSet: BlockSet ) => {

      // In the following code, the cube instance persists for the lifetime of the simulation and the listeners
      // don't need to be removed.
      return blockSet === BlockSet.SAME_MASS ?
             options.cubesData.map( cubeData => {
               const cube = CompareBlockSetModel.createCube( model.engine, Vector2.ZERO,
                 massProperty.value, options.sameMassValue / cubeData.sameMassVolume,
                 cubeData.colorProperty, massProperty.hasChangedProperty, options.initialMaterials, colorDensityRange, getCubeOptions( cubeData.sameMassCubeOptions )
               );

               // Keep this block's density in sync with the controlling massProperty when it changes.
               massProperty.lazyLink( massValue => cube.materialProperty.customMaterial.densityProperty.set( massValue / cube.volumeProperty.value ) );

               // Because the materialProperty is used by a DynamicProperty, which is read from a listener of the
               // blockSetProperty (in ReadoutAccordionBox), we need to make sure that the materialProperty is updated
               // before the blockSetProperty is. See better doc in BuoyancyApplicationScreen about applicationModeProperty.
               propertyStateHandlerSingleton.registerPhetioOrderDependency( cube.materialProperty, PropertyStatePhase.UNDEFER, model.blockSetProperty, PropertyStatePhase.UNDEFER );
               return cube;
             } ) :

             blockSet === BlockSet.SAME_VOLUME ?
             options.cubesData.map( cubeData => {
               const cube = CompareBlockSetModel.createCube( model.engine, Vector2.ZERO,
                 cubeData.sameVolumeMass, cubeData.sameVolumeMass / options.sameVolumeValue,
                 cubeData.colorProperty, volumeProperty.hasChangedProperty, options.initialMaterials,
                 colorDensityRange, getCubeOptions( cubeData.sameVolumeCubeOptions ) );

               // Keep this block's density in sync with the controlling volumeProperty when it changes.
               volumeProperty.lazyLink( volume => {
                 const size = Cube.boundsFromVolume( volume );
                 cube.updateSize( size );

                 // Our volume listener is triggered AFTER the cubes have phet-io applyState run, so we can't rely on
                 // inspecting their mass at that time (and instead need an external reference from the cubeData).
                 // See https://github.com/phetsims/density/issues/111
                 cube.materialProperty.customMaterial.densityProperty.value = cubeData.sameVolumeMass / volume;
               } );

               // Because the materialProperty is used by a DynamicProperty, which is read from a listener of the
               // blockSetProperty (in ReadoutAccordionBox), we need to make sure that the materialProperty is updated
               // before the blockSetProperty is. See better doc in BuoyancyApplicationScreen about applicationModeProperty.
               propertyStateHandlerSingleton.registerPhetioOrderDependency( cube.materialProperty, PropertyStatePhase.UNDEFER, model.blockSetProperty, PropertyStatePhase.UNDEFER );

               return cube;
             } ) :
             options.cubesData.map( cubeData => {
               const startingMass = options.sameDensityValue * cubeData.sameDensityVolume;

               const cube = CompareBlockSetModel.createCube( model.engine, Vector2.ZERO,
                 startingMass, options.sameDensityValue,
                 cubeData.colorProperty, densityProperty.hasChangedProperty, options.initialMaterials,
                 colorDensityRange,
                 combineOptions<StrictCubeOptions>( {
                   customMaterialOptions: {
                     densityPropertyOptions: {
                       range: options.sameDensityRange
                     }
                   }
                 }, getCubeOptions( cubeData.sameDensityCubeOptions ) ) );

               // Keep this block's density in sync with the controlling densityProperty when it changes.
               densityProperty.lazyLink( density => cube.materialProperty.customMaterial.densityProperty.set( density ) );

               // Because the materialProperty is used by a DynamicProperty, which is read from a listener of the
               // blockSetProperty (in ReadoutAccordionBox), we need to make sure that the materialProperty is updated
               // before the blockSetProperty is. See better doc in BuoyancyApplicationScreen about applicationModeProperty.
               propertyStateHandlerSingleton.registerPhetioOrderDependency( cube.materialProperty, PropertyStatePhase.UNDEFER, model.blockSetProperty, PropertyStatePhase.UNDEFER );

               return cube;
             } );
    };

    // Using spread here is the best possible solution. We want to add in `createMassesCallback` but cannot change the
    // type of `options` after creation, so `options.createMassesCallback = ...` won't work. Because we are providing an
    // object literal here, there is excess property checking (main worry about object spread), and the output type is
    // cleaner than using `merge()`. By spreading the output of optionize, we ensure that all contents of that type
    // are behaving correctly (including excess property checking). Furthermore, if we didn't use `OptionizeParent`
    // above (like by providing an initial void function to be overwritten), then we would be hacking out a solution
    // in value space for something that really should be handled in type space.
    super( {
      createMassesCallback: createMasses,

      ...options // eslint-disable-line phet/no-object-spread-on-non-literals
    } );

    this.massProperty = massProperty;
    this.volumeProperty = volumeProperty;
    this.densityProperty = densityProperty;
  }

  public override reset(): void {
    this.massProperty.reset();
    this.volumeProperty.reset();
    this.densityProperty.reset();
    super.reset();
  }

  // Get a material from a list given a desired density, or null if none match.
  private static getMaterial( density: number, blockSetValueChanged: boolean, nonCustomMaterials: Material[] ): Material | null {

    // If the block set value has not changed, attempt to use an initial material with the same density.
    if ( !blockSetValueChanged ) {
      for ( let i = 0; i < nonCustomMaterials.length; i++ ) {
        const material = nonCustomMaterials[ i ];
        if ( material.density === density ) {
          return material;
        }
      }
    }
    return null;
  }


  private static createCube( engine: PhysicsEngine,
                             position: Vector2,
                             mass: number,
                             initialDensity: number,
                             baseColorProperty: ColorProperty,
                             blockSetValueChangedProperty: TReadOnlyProperty<boolean>,
                             initialMaterials: Material[],
                             colorDensityRange: Range,
                             providedOptions?: StrictCubeOptionsNoAvailableMaterials ): Cube {

    // Behaves like a derived property but order of dependencies forces it to be a normal property
    const densityAdjustedColorProperty = new ColorProperty( baseColorProperty.value );

    const options = combineOptions<StrictCubeOptions>( {
      customMaterialOptions: {
        density: initialDensity,
        densityPropertyOptions: {
          phetioReadOnly: true
        },
        colorProperty: densityAdjustedColorProperty
      },
      materialPropertyOptions: {
        phetioReadOnly: true
      },
      availableMassMaterials: [
        ...initialMaterials,
        'CUSTOM'
      ]
    }, providedOptions );

    // Having the correct initialMaterial is vital to get resetting to work.
    const initialMaterial: MaterialSchema = CompareBlockSetModel.getMaterial( initialDensity, blockSetValueChangedProperty.value,
      initialMaterials ) || 'CUSTOM';

    const cube = Cube.createWithMass( engine, initialMaterial, position, mass, options );

    Multilink.multilink( [ baseColorProperty, cube.materialProperty.densityProperty ], ( color, density ) => {

      // Calculate the lightness of the material based on its density, but keep a consistent range independent of the available ranges for all usages.
      const lightness = Material.getNormalizedLightness( density, colorDensityRange ); // 0-1
      const scale = 0.4; // Scale to prevent too much lightness/darkness changing
      const factor = lightness * 2 - 1;
      densityAdjustedColorProperty.value = color.colorUtilsBrightness( factor * scale );
    } );

    // When the cube custom material density changes, match the density with an existing material if possible. Or set it to custom otherwise.
    Multilink.multilink( [ cube.materialProperty.densityProperty, blockSetValueChangedProperty ],
      ( density, blockSetValueChanged ) => {

        // Custom if a non custom was not found.
        cube.materialProperty.value = CompareBlockSetModel.getMaterial( density, blockSetValueChanged,
          initialMaterials ) || cube.materialProperty.customMaterial;
      } );

    return cube;
  }
}

// The tandem where all cubes should be nested under
export const BLOCK_SETS_TANDEM_NAME = 'blockSets';

densityBuoyancyCommon.register( 'CompareBlockSetModel', CompareBlockSetModel );