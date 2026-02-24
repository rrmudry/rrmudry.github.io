// Copyright 2022-2025, University of Colorado Boulder

/**
 * Represents different materials that solids/liquids in the simulations can take, including density/viscosity/color.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import NumberProperty, { NumberPropertyOptions } from '../../../../axon/js/NumberProperty.js';
import ReadOnlyProperty from '../../../../axon/js/ReadOnlyProperty.js';
import TinyProperty from '../../../../axon/js/TinyProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import packageJSON from '../../../../joist/js/packageJSON.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import StrictOmit from '../../../../phet-core/js/types/StrictOmit.js';
import Color from '../../../../scenery/js/util/Color.js';
import PhetioObject, { PhetioObjectOptions } from '../../../../tandem/js/PhetioObject.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonColors from '../view/DensityBuoyancyCommonColors.js';
import { MappedWrappedObject } from './MappedWrappedProperty.js';

type SelfOptions = {
  nameProperty?: TReadOnlyProperty<string>;

  // in SI (kg/m^3)
  density?: number;

  // What potential densities can this Material accept? (mostly applies to custom materials)
  densityPropertyOptions?: NumberPropertyOptions;

  // in SI (Pa * s). For reference a poise is 1e-2 Pa*s, and a centipoise is 1e-3 Pa*s.
  viscosity?: number;

  // Whether the material is custom (can be modified by the user)
  custom?: boolean;

  // If true, don't show the density in number pickers/readouts, often called a "mystery" material elsewhere in the code.
  hidden?: boolean;

  // Uses the color for a solid material's color
  colorProperty?: ReadOnlyProperty<Color> | null;

  // Used for the color of depth lines added on top of the Material
  depthLinesColorProperty?: ReadOnlyProperty<Color>;

  createColorProperty?: (
    colorProperty: ReadOnlyProperty<Color> | null,
    densityProperty: NumberProperty,
    isCustom: boolean
  ) => ReadOnlyProperty<Color> | null;

  createDepthLinesColorProperty?: (
    depthLinesColor: ReadOnlyProperty<Color>,
    colorProperty: ReadOnlyProperty<Color>
  ) => ReadOnlyProperty<Color>;
};

export type MaterialOptions = SelfOptions & StrictOmit<PhetioObjectOptions, 'tandem'>;

const MATERIALS_TANDEM = Tandem.GLOBAL_MODEL.createTandem( 'materials' );
const SOLIDS_TANDEM = MATERIALS_TANDEM.createTandem( 'solids' );
const FLUIDS_TANDEM = MATERIALS_TANDEM.createTandem( 'fluids' );

export default class Material extends PhetioObject implements MappedWrappedObject {

  public readonly nameProperty: TReadOnlyProperty<string>;
  public readonly viscosity: number;
  public readonly custom: boolean;
  public readonly hidden: boolean;
  public readonly colorProperty: ReadOnlyProperty<Color> | null;
  public readonly depthLinesColorProperty: ReadOnlyProperty<Color>;
  public readonly densityProperty: NumberProperty;

  public constructor( tandem: Tandem, providedOptions: MaterialOptions ) {

    const options = optionize<MaterialOptions, SelfOptions, PhetioObjectOptions>()( {
      nameProperty: new TinyProperty( 'unknown' ),
      density: 1,
      densityPropertyOptions: {
        tandem: tandem.createTandem( 'densityProperty' ),
        phetioFeatured: true,
        phetioDocumentation: 'Density of the material',
        phetioReadOnly: !( providedOptions.hidden || providedOptions.custom ), // Read-only unless it's a mystery or custom material
        rangePropertyOptions: {

          // When used in a MaterialControlNode, the component will override the rangeProperty, even when the sim is reset
          // This is done in a recursive/reentrant link call, so we need to ensure that the value comparison is an equals function
          reentrant: true,
          valueComparisonStrategy: 'equalsFunction'
        },
        range: new Range( 0.8, 27000 ),
        units: 'kg/m^3',

        // Like the rangeProperty above, in MaterialControlNode, when syncCustomMaterialDensity is true, MaterialControlNode
        // overrides the density value to keep it in range when material changes.
        reentrant: true
      },
      viscosity: 1e-3,
      custom: false,
      hidden: false,
      colorProperty: null,
      depthLinesColorProperty: DensityBuoyancyCommonColors.depthLinesDarkColorProperty,
      createColorProperty: ( colorProperty: ReadOnlyProperty<Color> | null, densityProperty: NumberProperty, isCustom: boolean ) => {
        return colorProperty;
      },
      createDepthLinesColorProperty: ( depthLinesColor: ReadOnlyProperty<Color>, colorProperty: ReadOnlyProperty<Color> ) => {
        return depthLinesColor;
      }
    }, providedOptions );

    assert && assert( isFinite( options.density ), 'density should be finite, but it was: ' + options.density );

    super( {
      tandem: tandem,
      phetioState: false
    } );

    this.nameProperty = options.nameProperty;
    this.densityProperty = new NumberProperty( options.density, options.densityPropertyOptions );
    this.viscosity = options.viscosity;
    this.custom = options.custom;
    this.hidden = options.hidden;
    this.colorProperty = options.createColorProperty( options.colorProperty, this.densityProperty, this.custom );
    this.depthLinesColorProperty = options.createDepthLinesColorProperty( options.depthLinesColorProperty, this.colorProperty! );

    assert && assert( !( this.custom && this.hidden ), 'cannot be a mystery custom material' );
  }

  /**
   * Get the current density value of the densityProperty. Convenience accessor which is used numerous times in the simulation.
   */
  public get density(): number {
    return this.densityProperty.value;
  }

  public get valueProperty(): NumberProperty {
    return this.densityProperty;
  }

  public reset(): void {
    this.densityProperty.reset();
  }

  /**
   * Returns a lightness factor from 0-1 that can be used to map a density to a desired color.
   * 1: lots of lightness
   * 0: lots of darkness
   * .5: no change to color.
   */
  public static getNormalizedLightness( density: number, densityRange: Range ): number {
    return Utils.clamp( 1 - densityRange.getNormalizedValue( density ), 0, 1 );
  }

  /**
   * Similar to getCustomLightness, but returns the generated color, with an included alpha effect.
   */
  public static getCustomLiquidColor( density: number, densityRange: Range ): Color {
    const lightnessFactor = Material.getNormalizedLightness( density, densityRange );
    return Color.interpolateRGBA(
      DensityBuoyancyCommonColors.customFluidDarkColorProperty.value,
      DensityBuoyancyCommonColors.customFluidLightColorProperty.value,
      lightnessFactor );
  }

  ////////////////// DEFAULT SOLIDS ////////////////// Shared across all 3 sims

  public static readonly ALUMINUM = new Material( SOLIDS_TANDEM.createTandem( 'aluminum' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.aluminumStringProperty,
    density: 2700
  } );

  public static readonly BRICK = new Material( SOLIDS_TANDEM.createTandem( 'brick' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.brickStringProperty,
    density: 2000,
    depthLinesColorProperty: DensityBuoyancyCommonColors.depthLinesLightColorProperty
  } );

  public static readonly ICE = new Material( SOLIDS_TANDEM.createTandem( 'ice' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.iceStringProperty,
    density: 919
  } );

  public static readonly PVC = new Material( SOLIDS_TANDEM.createTandem( 'pvc' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.pvcStringProperty,
    density: 1440
  } );

  public static readonly STYROFOAM = new Material( SOLIDS_TANDEM.createTandem( 'styrofoam' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.styrofoamStringProperty,
    // From Flash version: between 25 and 200 according to http://wiki.answers.com/Q/What_is_the_density_of_styrofoam;
    // chose 150, so it isn't too low to show on slider, but not 200, so it's not half of wood
    density: 150
  } );

  public static readonly WOOD = new Material( SOLIDS_TANDEM.createTandem( 'wood' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.woodStringProperty,
    density: 400,
    depthLinesColorProperty: DensityBuoyancyCommonColors.depthLinesLightColorProperty
  } );

  ////////////////// BUOYANCY ONLY SOLIDS //////////////////

  // In essence identical to aluminum, but with a different name for the Density readout
  public static readonly BOAT_HULL = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'boatHull' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.boatHullStringProperty,
    density: Material.ALUMINUM.density
  } );

  public static readonly CONCRETE = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'concrete' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.concreteStringProperty,
    density: 3150,
    colorProperty: DensityBuoyancyCommonColors.materialConcreteColorProperty
  } );

  public static readonly COPPER = new Material( packageJSON.name === 'density' || packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'copper' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.copperStringProperty,
    density: 8960,
    colorProperty: DensityBuoyancyCommonColors.materialCopperColorProperty
  } );

  public static readonly GOLD = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'gold' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.goldStringProperty,
    density: 19320
  } );

  public static readonly PLATINUM = new Material( packageJSON.name === 'density' || packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'platinum' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.platinumStringProperty,
    density: 21450
  } );

  public static readonly PYRITE = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'pyrite' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.pyriteStringProperty,
    density: 5010
  } );

  public static readonly SAND = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'sand' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.sandStringProperty,
    density: 1442,
    viscosity: 0.03, // Too much bigger and it won't work, not particularly physical
    colorProperty: DensityBuoyancyCommonColors.materialSandColorProperty
  } );

  public static readonly SILVER = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'silver' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.silverStringProperty,
    density: 10490
  } );

  public static readonly STEEL = new Material( packageJSON.name === 'density' || packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'steel' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.steelStringProperty,
    density: 7800
  } );

  public static readonly TANTALUM = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'tantalum' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.tantalumStringProperty,
    density: 16650
  } );

  ////////////////// OTHER SOLIDS //////////////////

  private static readonly APPLE = new Material( Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.appleStringProperty,
    // "Some Physical Properties of Apple" - Averaged the two cultivars' densities for this
    // http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.548.1131&rep=rep1&type=pdf
    density: 832
  } );

  public static readonly DIAMOND = new Material( Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.diamondStringProperty,
    density: 3510
  } );

  public static readonly GLASS = new Material( Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.glassStringProperty,
    density: 2700
  } );

  public static readonly HUMAN = new Material( Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.humanStringProperty,
    density: 950
  } );

  private static readonly LEAD = new Material( Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.leadStringProperty,
    density: 11342
  } );

  public static readonly TITANIUM = new Material( Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.titaniumStringProperty,
    density: 4500
  } );

  ////////////////// LIQUIDS //////////////////

  private static readonly AIR = new Material( Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.airStringProperty,
    density: 1.2,
    viscosity: 0
  } );

  public static readonly FLUID_A = new Material( packageJSON.name === 'buoyancy' ? FLUIDS_TANDEM.createTandem( 'fluidA' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.fluidAStringProperty,
    density: 3100,
    colorProperty: DensityBuoyancyCommonColors.materialFluidAColorProperty,
    hidden: true
  } );

  public static readonly FLUID_B = new Material( packageJSON.name === 'buoyancy' ? FLUIDS_TANDEM.createTandem( 'fluidB' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.fluidBStringProperty,
    density: 790,
    colorProperty: DensityBuoyancyCommonColors.materialFluidBColorProperty,
    hidden: true
  } );

  public static readonly FLUID_C = new Material( packageJSON.name === 'buoyancy' ? FLUIDS_TANDEM.createTandem( 'fluidC' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.fluidCStringProperty,
    density: 490,
    colorProperty: DensityBuoyancyCommonColors.materialFluidCColorProperty,
    hidden: true
  } );

  public static readonly FLUID_D = new Material( packageJSON.name === 'buoyancy' ? FLUIDS_TANDEM.createTandem( 'fluidD' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.fluidDStringProperty,
    density: 2890,
    colorProperty: DensityBuoyancyCommonColors.materialFluidDColorProperty,
    hidden: true
  } );

  public static readonly FLUID_E = new Material( packageJSON.name === 'buoyancy' ? FLUIDS_TANDEM.createTandem( 'fluidE' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.fluidEStringProperty,
    density: 1260,
    colorProperty: DensityBuoyancyCommonColors.materialFluidEColorProperty,
    hidden: true
  } );

  public static readonly FLUID_F = new Material( packageJSON.name === 'buoyancy' ? FLUIDS_TANDEM.createTandem( 'fluidF' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.fluidFStringProperty,
    density: 6440,
    colorProperty: DensityBuoyancyCommonColors.materialFluidFColorProperty,
    hidden: true
  } );

  public static readonly GASOLINE = new Material( packageJSON.name === 'density' ? Tandem.OPT_OUT : FLUIDS_TANDEM.createTandem( 'gasoline' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.gasolineStringProperty,
    density: 680,
    viscosity: 6e-4,
    colorProperty: DensityBuoyancyCommonColors.materialGasolineColorProperty
  } );

  private static readonly HONEY = new Material( packageJSON.name === 'density' ? Tandem.OPT_OUT : FLUIDS_TANDEM.createTandem( 'honey' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.honeyStringProperty,
    density: 1440,
    viscosity: 0.03, // NOTE: actual value around 2.5, but we can get away with this for animation
    colorProperty: DensityBuoyancyCommonColors.materialHoneyColorProperty
  } );

  private static readonly MERCURY = new Material( packageJSON.name === 'density' ? Tandem.OPT_OUT : FLUIDS_TANDEM.createTandem( 'mercury' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.mercuryStringProperty,
    density: 13593,
    viscosity: 1.53e-3,
    colorProperty: DensityBuoyancyCommonColors.materialMercuryColorProperty
  } );

  public static readonly OIL = new Material( packageJSON.name === 'density' ? Tandem.OPT_OUT : FLUIDS_TANDEM.createTandem( 'oil' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.oilStringProperty,
    density: 920,
    viscosity: 0.02, // Too much bigger and it won't work, not particularly physical
    colorProperty: DensityBuoyancyCommonColors.materialOilColorProperty
  } );

  private static readonly SEAWATER = new Material( packageJSON.name === 'density' ? Tandem.OPT_OUT : FLUIDS_TANDEM.createTandem( 'seawater' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.seawaterStringProperty,
    density: 1029,
    viscosity: 1.88e-3,
    colorProperty: DensityBuoyancyCommonColors.materialSeawaterColorProperty
  } );

  public static readonly WATER = new Material( FLUIDS_TANDEM.createTandem( 'water' ), {
    nameProperty: DensityBuoyancyCommonStrings.material.waterStringProperty,
    density: 1000,
    viscosity: 8.9e-4,
    colorProperty: DensityBuoyancyCommonColors.materialWaterColorProperty
  } );

  ////////////////// MYSTERY MATERIALS //////////////////

  public static readonly MATERIAL_R = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'materialR' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.materialRStringProperty,
    hidden: true,
    density: Material.PYRITE.density
  } );

  public static readonly MATERIAL_S = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'materialS' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.materialSStringProperty,
    hidden: true,
    density: Material.GOLD.density
  } );

  public static readonly MATERIAL_T = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'materialT' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.materialTStringProperty,
    hidden: true,
    colorProperty: DensityBuoyancyCommonColors.materialTColorProperty,
    density: Material.HUMAN.density
  } );

  public static readonly MATERIAL_U = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'materialU' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.materialUStringProperty,
    hidden: true,
    colorProperty: DensityBuoyancyCommonColors.materialUColorProperty,
    density: Material.DIAMOND.density
  } );

  public static readonly MATERIAL_V = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'materialV' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.materialVStringProperty,
    hidden: true,
    colorProperty: DensityBuoyancyCommonColors.materialVColorProperty,
    density: Material.ICE.density
  } );

  public static readonly MATERIAL_W = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'materialW' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.materialWStringProperty,
    hidden: true,
    colorProperty: DensityBuoyancyCommonColors.materialWColorProperty,
    density: Material.LEAD.density
  } );

  public static readonly MATERIAL_X = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'materialX' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.materialXStringProperty,
    hidden: true,
    colorProperty: DensityBuoyancyCommonColors.materialXColorProperty,
    density: Material.TITANIUM.density
  } );

  public static readonly MATERIAL_Y = new Material( packageJSON.name === 'buoyancy' ? SOLIDS_TANDEM.createTandem( 'materialY' ) : Tandem.OPT_OUT, {
    nameProperty: DensityBuoyancyCommonStrings.material.materialYStringProperty,
    hidden: true,
    colorProperty: DensityBuoyancyCommonColors.materialYColorProperty,
    density: Material.MERCURY.density
  } );

  public static readonly ALL_MYSTERY_SOLID_MATERIALS = [
    Material.MATERIAL_R,
    Material.MATERIAL_S,
    Material.MATERIAL_T,
    Material.MATERIAL_U,
    Material.MATERIAL_V,
    Material.MATERIAL_W,
    Material.MATERIAL_X,
    Material.MATERIAL_Y
  ];

  public static readonly DENSITY_MYSTERY_SCREEN_MATERIALS = [
    Material.WOOD,
    Material.GASOLINE,
    Material.APPLE,
    Material.ICE,
    Material.HUMAN,
    Material.WATER,
    Material.GLASS,
    Material.DIAMOND,
    Material.TITANIUM,
    Material.STEEL,
    Material.COPPER,
    Material.LEAD,
    Material.GOLD
  ];

  /** This group represents the solid materials that can be selected in many of the simpler selection controls.*/
  public static readonly SIMPLE_MASS_MATERIALS = [
    Material.STYROFOAM,
    Material.WOOD,
    Material.ICE,
    Material.PVC,
    Material.BRICK,
    Material.ALUMINUM
  ];

  public static readonly BUOYANCY_FLUID_MATERIALS = [
    Material.GASOLINE,
    Material.OIL,
    Material.WATER,
    Material.SEAWATER,
    Material.HONEY,
    Material.MERCURY
  ];

  public static readonly BUOYANCY_FLUID_MYSTERY_MATERIALS = [
    Material.FLUID_A,
    Material.FLUID_B,
    Material.FLUID_C,
    Material.FLUID_D,
    Material.FLUID_E,
    Material.FLUID_F
  ];
}

type CustomSolidMaterialSelfOptions = EmptySelfOptions;
type CustomSolidMaterialOptions = MaterialOptions & CustomSolidMaterialSelfOptions;

export class CustomSolidMaterial extends Material {
  public constructor( tandem: Tandem, providedOptions: CustomSolidMaterialOptions ) {

    const options = optionize<CustomSolidMaterialOptions, CustomSolidMaterialSelfOptions, MaterialOptions>()( {
      nameProperty: DensityBuoyancyCommonStrings.material.customStringProperty,
      custom: true,
      createColorProperty: ( colorProperty, densityProperty, isCustom ) => {
        if ( colorProperty ) {
          return colorProperty;
        }
        else {
          return new DerivedProperty( [ densityProperty, densityProperty.rangeProperty ], ( density, densityRange ) => {

            // Returns a value suitable for use in colors (0-255 value) that should be used as a grayscale value for
            // a material of a given density. The mappíng is inverted, i.e. larger densities yield darker colors.
            const lightnessFactor = Material.getNormalizedLightness( density, densityRange );
            return Color.interpolateRGBA(
              new Color( '#000' ),
              new Color( '#FFF' ),
              lightnessFactor );
          } );
        }
      },
      createDepthLinesColorProperty: ( depthLinesColor, colorProperty ) => {
        return new DerivedProperty( [
          colorProperty,
          DensityBuoyancyCommonColors.depthLinesLightColorProperty,
          DensityBuoyancyCommonColors.depthLinesDarkColorProperty
        ], ( color, depthLinesLightColor, depthLinesDarkColor ) => {

          // The lighter depth line color has better contrast, so use that for more than half
          const isDark = ( color.r + color.g + color.b ) / 3 < 255 * 0.6;
          return isDark ? depthLinesLightColor : depthLinesDarkColor;
        } );
      }
    }, providedOptions );

    super( tandem, options );

    assert && assert( this.custom, 'SolidMaterial should only be used for custom materials' );
  }
}

export class CustomLiquidMaterial extends Material {
  public constructor( tandem: Tandem, providedOptions: MaterialOptions ) {
    super( tandem, optionize<MaterialOptions, EmptySelfOptions, MaterialOptions>()( {
      nameProperty: DensityBuoyancyCommonStrings.material.customStringProperty,
      custom: true,
      createColorProperty: ( colorProperty, densityProperty, isCustom ) => {
        if ( colorProperty || !isCustom ) {
          return colorProperty;
        }
        else {
          return new DerivedProperty( [ densityProperty, densityProperty.rangeProperty ], ( density, densityRange ) => {
            return Material.getCustomLiquidColor( density, densityRange );
          } );
        }
      }
    }, providedOptions ) );
  }
}

densityBuoyancyCommon.register( 'Material', Material );