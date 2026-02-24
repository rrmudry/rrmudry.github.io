// Copyright 2024-2025, University of Colorado Boulder

/**
 * The main model for a single shape model object in the sim. This manages changing the shape, phet-io, and updating
 * the size of the shape. In this file, we use "shape" to describe the "Mass" subtypes. This is different from KITE/Shape.
 * Please forgive us.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import { ObservableArray } from '../../../../../axon/js/createObservableArray.js';
import DerivedProperty from '../../../../../axon/js/DerivedProperty.js';
import EnumerationProperty from '../../../../../axon/js/EnumerationProperty.js';
import Multilink from '../../../../../axon/js/Multilink.js';
import NumberProperty from '../../../../../axon/js/NumberProperty.js';
import Property from '../../../../../axon/js/Property.js';
import TinyProperty from '../../../../../axon/js/TinyProperty.js';
import { TReadOnlyProperty } from '../../../../../axon/js/TReadOnlyProperty.js';
import Matrix3 from '../../../../../dot/js/Matrix3.js';
import Range from '../../../../../dot/js/Range.js';
import optionize from '../../../../../phet-core/js/optionize.js';
import PickRequired from '../../../../../phet-core/js/types/PickRequired.js';
import isSettingPhetioStateProperty from '../../../../../tandem/js/isSettingPhetioStateProperty.js';
import { PhetioObjectOptions } from '../../../../../tandem/js/PhetioObject.js';
import ReferenceIO from '../../../../../tandem/js/types/ReferenceIO.js';
import Mass from '../../../common/model/Mass.js';
import { MassShape } from '../../../common/model/MassShape.js';
import MassTag from '../../../common/model/MassTag.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import BuoyancyShapesModel from './BuoyancyShapesModel.js';

type SelfOptions = {

  // The "selected Mass shape" (current value of shapeProperty) determines its visibility based on this Property.
  // Defaults to "always visible".
  selectedShapeIsVisibleProperty?: TReadOnlyProperty<boolean>;
};
export type BuoyancyShapeModelOptions = SelfOptions & PickRequired<PhetioObjectOptions, 'tandem'>;

export default class BuoyancyShapeModel {

  // The currently selected shape, from which the mass changes to this type.
  public readonly shapeNameProperty: Property<MassShape>;
  public readonly horizontalRatioProperty: Property<number>;
  public readonly verticalRatioProperty: Property<number>;

  // A reference to the currently selected Mass based on the shapeName (MassShape).
  public readonly shapeProperty: TReadOnlyProperty<Mass>;

  // Statically initialize all possible Mass instances to simplify phet-io. This is well within a good memory limit, see https://github.com/phetsims/buoyancy/issues/160
  private readonly shapeCacheMap = new Map<MassShape, Mass>();

  private readonly selectedShapeIsVisibleProperty: TReadOnlyProperty<boolean>;

  public constructor( massShape: MassShape, width: number, height: number, massTag: MassTag, availableMasses: ObservableArray<Mass>,
                      createMass: BuoyancyShapesModel['createMass'], providedOptions: BuoyancyShapeModelOptions ) {

    const options = optionize<BuoyancyShapeModelOptions, SelfOptions>()( {
      selectedShapeIsVisibleProperty: new TinyProperty( true )
    }, providedOptions );

    this.shapeNameProperty = new EnumerationProperty( massShape, {
      tandem: options.tandem.createTandem( 'shapeNameProperty' ),
      phetioFeatured: true
    } );

    this.horizontalRatioProperty = new NumberProperty( width, {
      tandem: options.tandem.createTandem( 'horizontalRatioProperty' ),
      phetioFeatured: true,
      range: new Range( 0, 1 )
    } );

    this.verticalRatioProperty = new NumberProperty( height, {
      tandem: options.tandem.createTandem( 'verticalRatioProperty' ),
      phetioFeatured: true,
      range: new Range( 0, 1 )
    } );

    this.selectedShapeIsVisibleProperty = options.selectedShapeIsVisibleProperty;

    MassShape.enumeration.values.forEach( shape => {
      const mass = createMass(
        options.tandem.createTandem( 'shapes' ).createTandem( shape.tandemName ), shape,
        this.horizontalRatioProperty.value, this.verticalRatioProperty.value, massTag,
        shape === massShape
      );
      this.shapeCacheMap.set( shape, mass );

      availableMasses.push( mass );

      // Initially selected one made visible below in link()
      mass.internalVisibleProperty.value = false;
    } );

    // Property doesn't need disposal, since everything here lives for the lifetime of the simulation.
    // Named like this for clarity with PhET-iO naming, do not confuse this with "KITE/Shape" or Mass.shapeProperty.
    this.shapeProperty = new DerivedProperty( [ this.shapeNameProperty ], shapeName => this.shapeCacheMap.get( shapeName )!, {
      tandem: options.tandem.createTandem( 'shapeProperty' ),
      phetioDocumentation: 'A reference to the currently selected shape based on the shape name.',
      phetioValueType: ReferenceIO( Mass.MassIO ),
      phetioFeatured: true
    } );

    Multilink.lazyMultilink( [ this.shapeProperty, this.horizontalRatioProperty, this.verticalRatioProperty ], ( mass, widthRatio, heightRatio ) => {
      mass.setRatios( widthRatio, heightRatio );
    } );

    this.shapeProperty.link( ( newMass, oldMass ) => {
      if ( oldMass && !isSettingPhetioStateProperty.value ) {
        newMass.matrix.set( oldMass.matrix );

        // Change the shape, keeping the bottom at the same y value
        // Triggering dimension change first
        const minYBefore = oldMass.getBounds().minY;
        this.horizontalRatioProperty.notifyListenersStatic(); // Triggering dimension change first
        newMass.matrix.multiplyMatrix( Matrix3.translation( 0, minYBefore - newMass.getBounds().minY ) );
        newMass.writeData();
      }
    } );

    Multilink.multilink( [ this.shapeProperty, options.selectedShapeIsVisibleProperty ], () => {
      this.updateShapeVisibilities();
    } );
  }

  public reset(): void {
    this.shapeNameProperty.reset();
    this.verticalRatioProperty.reset();
    this.horizontalRatioProperty.reset();

    // Last is best here to make sure visibility isn't mutated later
    this.updateShapeVisibilities();
  }

  private updateShapeVisibilities(): void {
    for ( const mass of this.shapeCacheMap.values() ) {
      mass.internalVisibleProperty.value = mass === this.shapeProperty.value && this.selectedShapeIsVisibleProperty.value;
    }
  }
}


densityBuoyancyCommon.register( 'BuoyancyShapeModel', BuoyancyShapeModel );