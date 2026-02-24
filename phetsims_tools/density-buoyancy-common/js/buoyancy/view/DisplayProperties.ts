// Copyright 2024-2025, University of Colorado Boulder

/**
 * Contains properties that control the display of forces and mass values.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Property from '../../../../axon/js/Property.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Range from '../../../../dot/js/Range.js';
import packageJSON from '../../../../joist/js/packageJSON.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

const ZOOM_SCALES: number[] = [];

// Populating zoom scales with powers of 2
for ( let i = 8; i > 0; i-- ) {
  ZOOM_SCALES.push( Math.pow( 0.5, i ) );
}

type DisplayPropertiesOptions = {
  canShowForces: boolean;
  supportsDepthLines: boolean;
  forcesInitiallyDisplayed: boolean;
  massValuesInitiallyDisplayed: boolean;
  initialForceScale: number;
};

export default class DisplayProperties {

  public readonly gravityForceVisibleProperty: Property<boolean>;
  public readonly buoyancyForceVisibleProperty: Property<boolean>;
  public readonly contactForceVisibleProperty: Property<boolean>;
  public readonly forceValuesVisibleProperty: Property<boolean>;

  public readonly massValuesVisibleProperty: Property<boolean>;
  public readonly depthLinesVisibleProperty: Property<boolean>;

  // The integer value of the selected vector zoom level
  public readonly vectorZoomLevelProperty: NumberProperty;

  // Actual zoom applied to the vectors based on a power of 2 scale
  public readonly vectorZoomProperty: TReadOnlyProperty<number>;

  public readonly supportsDepthLines: boolean;

  public constructor( tandem: Tandem, options: DisplayPropertiesOptions ) {

    this.supportsDepthLines = options.supportsDepthLines;

    this.gravityForceVisibleProperty = new BooleanProperty( options.forcesInitiallyDisplayed, {
      tandem: options.canShowForces ? tandem.createTandem( 'gravityForceVisibleProperty' ) : Tandem.OPT_OUT,
      phetioFeatured: true
    } );
    this.buoyancyForceVisibleProperty = new BooleanProperty( options.forcesInitiallyDisplayed, {
      tandem: options.canShowForces ? tandem.createTandem( 'buoyancyForceVisibleProperty' ) : Tandem.OPT_OUT,
      phetioFeatured: true
    } );
    this.contactForceVisibleProperty = new BooleanProperty( options.forcesInitiallyDisplayed, {
      tandem: options.canShowForces ? tandem.createTandem( 'contactForceVisibleProperty' ) : Tandem.OPT_OUT,
      phetioFeatured: true
    } );
    this.forceValuesVisibleProperty = new BooleanProperty( options.forcesInitiallyDisplayed, {
      tandem: options.canShowForces ? tandem.createTandem( 'forceValuesVisibleProperty' ) : Tandem.OPT_OUT,
      phetioFeatured: true
    } );
    this.massValuesVisibleProperty = new BooleanProperty( options.massValuesInitiallyDisplayed, {
      tandem: tandem.createTandem( 'massValuesVisibleProperty' ),
      phetioFeatured: true,
      phetioDocumentation: 'Displays a mass readout on each object'
    } );

    // Zoom level for vectors
    this.vectorZoomLevelProperty = new NumberProperty( 4, {
      numberType: 'Integer',
      range: new Range( 0, ZOOM_SCALES.length - 1 ),
      tandem: packageJSON.name === 'density' ? Tandem.OPT_OUT : tandem.createTandem( 'vectorZoomLevelProperty' ),
      phetioFeatured: true,
      phetioDocumentation: 'Controls the zoom level of the force vectors. Smaller values are more zoomed out.'
    } );

    // Scale factor for the current zoom level
    this.vectorZoomProperty = new DerivedProperty( [ this.vectorZoomLevelProperty ], ( zoomLevel: number ) => {
      return ZOOM_SCALES[ zoomLevel ];
    } );

    this.depthLinesVisibleProperty = new BooleanProperty( false, {
      tandem: options.supportsDepthLines ? tandem.createTandem( 'depthLinesVisibleProperty' ) : Tandem.OPT_OUT,
      phetioDocumentation: 'Display visual lines on blocks to aid in calculating the percentage that the block is submerged.',
      phetioFeatured: true
    } );
  }

  public reset(): void {
    this.gravityForceVisibleProperty.reset();
    this.buoyancyForceVisibleProperty.reset();
    this.contactForceVisibleProperty.reset();
    this.massValuesVisibleProperty.reset();
    this.forceValuesVisibleProperty.reset();
    this.depthLinesVisibleProperty.reset();
    this.vectorZoomLevelProperty.reset();
  }

}

densityBuoyancyCommon.register( 'DisplayProperties', DisplayProperties );