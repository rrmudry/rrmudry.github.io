// Copyright 2019-2024, University of Colorado Boulder

/**
 * The main model for the Shapes screen of the Buoyancy simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../../axon/js/DerivedProperty.js';
import EnumerationProperty from '../../../../../axon/js/EnumerationProperty.js';
import Property from '../../../../../axon/js/Property.js';
import Matrix3 from '../../../../../dot/js/Matrix3.js';
import optionize, { EmptySelfOptions } from '../../../../../phet-core/js/optionize.js';
import GrabDragUsageTracker from '../../../../../scenery-phet/js/accessibility/grab-drag/GrabDragUsageTracker.js';
import Tandem from '../../../../../tandem/js/Tandem.js';
import Cuboid from '../../../common/model/Cuboid.js';
import DensityBuoyancyModel, { DensityBuoyancyModelOptions } from '../../../common/model/DensityBuoyancyModel.js';
import Mass from '../../../common/model/Mass.js';
import { MassShape } from '../../../common/model/MassShape.js';
import MassTag from '../../../common/model/MassTag.js';
import Material, { CustomSolidMaterial } from '../../../common/model/Material.js';
import MaterialProperty from '../../../common/model/MaterialProperty.js';
import Scale, { DisplayType } from '../../../common/model/Scale.js';
import TwoBlockMode from '../../../common/model/TwoBlockMode.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import BuoyancyShapeModel from './BuoyancyShapeModel.js';
import Cone from './Cone.js';
import Duck from './Duck.js';
import Ellipsoid from './Ellipsoid.js';
import HorizontalCylinder from './HorizontalCylinder.js';
import VerticalCylinder from './VerticalCylinder.js';

export type BuoyancyShapesModelOptions = DensityBuoyancyModelOptions;

export default class BuoyancyShapesModel extends DensityBuoyancyModel {

  public readonly modeProperty: Property<TwoBlockMode>;
  private readonly scale: Scale;

  public readonly objectA: BuoyancyShapeModel;
  public readonly objectB: BuoyancyShapeModel;

  public readonly materialProperty: MaterialProperty;
  private readonly availableMaterials: Material[];

  private readonly grabDragUsageTracker = new GrabDragUsageTracker();

  public constructor( providedOptions: BuoyancyShapesModelOptions ) {

    const options = optionize<BuoyancyShapesModelOptions, EmptySelfOptions, DensityBuoyancyModelOptions>()( {
      fluidSelectionType: 'all'
    }, providedOptions );

    super( options );

    const objectsTandem = options.tandem.createTandem( 'objects' );

    this.modeProperty = new EnumerationProperty( TwoBlockMode.ONE_BLOCK, {
      tandem: objectsTandem.createTandem( 'modeProperty' ),
      phetioFeatured: true
    } );

    this.availableMaterials = Material.SIMPLE_MASS_MATERIALS;

    this.materialProperty = new MaterialProperty( Material.WOOD,

      // Placeholder for custom material which is not used in the shapes screen.
      new CustomSolidMaterial( Tandem.OPT_OUT, {
        density: Material.WOOD.density
      } ),
      this.availableMaterials, {
        tandem: objectsTandem.createTandem( 'materialProperty' )
      } );

    this.scale = new Scale( this.engine, this.gravityProperty, {
      matrix: Matrix3.translation( -0.7, -Scale.SCALE_BASE_BOUNDS.minY ),
      displayType: DisplayType.NEWTONS,
      tandem: options.tandem.createTandem( 'scale' ),
      canMove: true,
      inputEnabledPropertyOptions: {
        phetioReadOnly: false
      }
    } );
    this.availableMasses.push( this.scale );

    const boundCreateMass = this.createMass.bind( this );

    this.objectA = new BuoyancyShapeModel( MassShape.BLOCK, 0.25, 0.75, MassTag.OBJECT_A, this.availableMasses, boundCreateMass, {
      tandem: objectsTandem.createTandem( 'objectA' )
    } );

    this.objectB = new BuoyancyShapeModel( MassShape.BLOCK, 0.25, 0.75, MassTag.OBJECT_B, this.availableMasses, boundCreateMass, {
      tandem: objectsTandem.createTandem( 'objectB' ),
      selectedShapeIsVisibleProperty: new DerivedProperty( [ this.modeProperty ], mode => mode === TwoBlockMode.TWO_BLOCKS )
    } );

    this.setInitialPositions();
  }

  private createMass( tandem: Tandem, shape: MassShape, widthRatio: number, heightRatio: number, tag: MassTag, initiallyVisible: boolean ): Mass {
    const massOptions = {
      material: this.materialProperty.value,
      availableMassMaterials: this.availableMaterials,
      materialPropertyOptions: {
        phetioReadOnly: true
      },
      minVolume: 0.0002, // Cones have a smaller volume at min height/width
      maxVolume: Cuboid.MAX_VOLUME, // Cubes are the highest volume object in this screen
      tandem: tandem,
      tag: tag,
      visible: initiallyVisible, // Most shapes will always be invisible, so initialize as invisible for performance on reset().
      grabDragUsageTracker: this.grabDragUsageTracker // All Mass shapes except the scale share the same interaction model, see https://github.com/phetsims/density-buoyancy-common/issues/368
    };

    let mass: Mass;
    switch( shape ) {
      case MassShape.BLOCK:
        mass = new Cuboid( this.engine, Cuboid.getSizeFromRatios( widthRatio, heightRatio ), massOptions );
        break;
      case MassShape.ELLIPSOID:
        mass = new Ellipsoid( this.engine, Ellipsoid.getSizeFromRatios( widthRatio, heightRatio ), massOptions );
        break;
      case MassShape.VERTICAL_CYLINDER:
        mass = new VerticalCylinder(
          this.engine,
          VerticalCylinder.getRadiusFromRatio( widthRatio ),
          VerticalCylinder.getHeightFromRatio( heightRatio ),
          massOptions
        );
        break;
      case MassShape.HORIZONTAL_CYLINDER:
        mass = new HorizontalCylinder(
          this.engine,
          HorizontalCylinder.getRadiusFromRatio( heightRatio ),
          HorizontalCylinder.getLengthFromRatio( widthRatio ),
          massOptions
        );
        break;
      case MassShape.CONE:
        mass = new Cone(
          this.engine,
          Cone.getRadiusFromRatio( widthRatio ),
          Cone.getHeightFromRatio( heightRatio ),
          true,
          massOptions
        );
        break;
      case MassShape.INVERTED_CONE:
        mass = new Cone(
          this.engine,
          Cone.getRadiusFromRatio( widthRatio ),
          Cone.getHeightFromRatio( heightRatio ),
          false,
          massOptions
        );
        break;
      case MassShape.DUCK:
        mass = new Duck( this.engine, Duck.getSizeFromRatios( widthRatio, heightRatio ), massOptions );
        break;
      default:
        throw new Error( `shape not recognized: ${shape}` );
    }

    // When the main material selector changes, propagate that through to the mass.
    this.materialProperty.lazyLink( material => {
      mass.materialProperty.value = material;
    } );
    return mass;
  }

  /**
   * Sets up the initial positions of the masses (since some resets may not change the mass).
   */
  private setInitialPositions(): void {
    this.objectA.shapeProperty.value.setPosition( -0.225, 0 );
    this.objectB.shapeProperty.value.setPosition( 0.075, 0 );
  }

  /**
   * Resets things to their original values.
   */
  public override reset(): void {

    // This must go before resetting the individual shape models to keep visibility correct.
    super.reset();

    this.objectA.reset();
    this.objectB.reset();

    this.modeProperty.reset();

    this.materialProperty.reset();

    this.setInitialPositions();
  }
}

densityBuoyancyCommon.register( 'BuoyancyShapesModel', BuoyancyShapesModel );