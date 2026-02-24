// Copyright 2019-2025, University of Colorado Boulder

/**
 * Constants for the density/buoyancy sims
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../axon/js/DerivedProperty.js';
import PatternStringProperty from '../../../axon/js/PatternStringProperty.js';
import Dimension2 from '../../../dot/js/Dimension2.js';
import Range from '../../../dot/js/Range.js';
import Vector2 from '../../../dot/js/Vector2.js';
import Vector3 from '../../../dot/js/Vector3.js';
import PhetFont from '../../../scenery-phet/js/PhetFont.js';
import { DEFAULT_FILL, DEFAULT_FILL_HIGHLIGHTED } from '../../../sun/js/SliderThumb.js';
import Tandem from '../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../DensityBuoyancyCommonStrings.js';
import { VolumeUnits } from './DensityBuoyancyCommonQueryParameters.js';
import DensityBuoyancyCommonPreferences from './model/DensityBuoyancyCommonPreferences.js';
import DensityBuoyancyCommonColors from './view/DensityBuoyancyCommonColors.js';

const CORNER_RADIUS = 5;
const litersPatternStringProperty = new PatternStringProperty( DensityBuoyancyCommonStrings.litersPatternStringProperty, {
  liters: '{{value}}'
}, { tandem: Tandem.OPT_OUT } );
const decimetersCubedPatternStringProperty = new PatternStringProperty( DensityBuoyancyCommonStrings.decimetersCubedPatternStringProperty, {
  decimetersCubed: '{{value}}'
}, { tandem: Tandem.OPT_OUT } );

// Used for margins from the offset of screens or between panels/boxes or content margins of panels/boxes.
const MARGIN = 10;

// Used for panels/boxes by default
const SPACING = 10;

// A value applied across the code to prevent unexpected rounding errors.
const TOLERANCE = 1e-7;

const LITERS_IN_CUBIC_METER = 1000;

const FLUID_DENSITY_RANGE_PER_L = new Range( 0.5, 15 );

const DensityBuoyancyCommonConstants = {
  MARGIN: MARGIN,
  MARGIN_SMALL: MARGIN / 2,

  SPACING: SPACING,
  SPACING_SMALL: SPACING / 2,

  // Used for panels/boxes by default
  CORNER_RADIUS: CORNER_RADIUS,

  TITLE_FONT: new PhetFont( {
    size: 16,
    weight: 'bold'
  } ),
  ITEM_FONT: new PhetFont( {
    size: 14,
    weight: 'bold'
  } ),
  RADIO_BUTTON_FONT: new PhetFont( 14 ),
  COMBO_BOX_ITEM_FONT: new PhetFont( 14 ),
  READOUT_FONT: new PhetFont( 14 ),

  THUMB_SIZE: new Dimension2( 13, 22 ),
  THUMB_FILL: DEFAULT_FILL,
  THUMB_HIGHLIGHT_FILL: DEFAULT_FILL_HIGHLIGHTED,

  ARROW_BUTTON_SCALE: 0.6,

  POOL_SCALE_INITIAL_HEIGHT: 0.5,

  NUMBER_CONTROL_DELTA: 0.01,
  SLIDER_KEYBOARD_STEP: 0.5,
  SLIDER_KEYBOARD_PAGE_STEP: 1,
  SLIDER_KEYBOARD_SHIFT_STEP: 0.01,

  TOLERANCE: TOLERANCE,

  // (read-only) {Object}
  PANEL_OPTIONS: {
    cornerRadius: CORNER_RADIUS,
    fill: DensityBuoyancyCommonColors.panelBackgroundProperty,
    xMargin: MARGIN,
    yMargin: MARGIN
  },

  ACCORDION_BOX_OPTIONS: {
    cornerRadius: CORNER_RADIUS,
    titleYMargin: 5,
    buttonXMargin: 5,
    contentXMargin: MARGIN,
    titleAlignX: 'left',
    fill: DensityBuoyancyCommonColors.panelBackgroundProperty,

    // Content should appear directly below the title
    contentYSpacing: 0
  } as const,

  // cameraLookAt locations
  DENSITY_CAMERA_LOOK_AT: Vector3.ZERO,
  BUOYANCY_CAMERA_LOOK_AT: new Vector3( 0, -0.18, 0 ),
  BUOYANCY_BASICS_CAMERA_LOOK_AT: new Vector3( 0, -0.1, 0 ),

  // Shift on the screen view with respect to the camera's view
  BUOYANCY_BASICS_VIEW_OFFSET: new Vector2( -25, 0 ),

  // In m^3, the value that we want the initial fluid volume to be (including the displacement of any volumes in the pool).
  DESIRED_STARTING_POOL_VOLUME: 0.1,

  // Model units for volume are most likely in m^3, multiply by this to convert to liters.
  LITERS_IN_CUBIC_METER: 1000,

  VOLUME_PATTERN_STRING_PROPERTY: new DerivedProperty( [
    DensityBuoyancyCommonPreferences.volumeUnitsProperty,
    litersPatternStringProperty,
    decimetersCubedPatternStringProperty
  ], ( units: VolumeUnits, litersPatternString, decimetersCubedPatternString ) => {
    return units === 'liters' ? litersPatternString : decimetersCubedPatternString;
  } ),
  KILOGRAMS_PER_VOLUME_PATTERN_STRING_PROPERTY: new DerivedProperty( [
    DensityBuoyancyCommonPreferences.volumeUnitsProperty,
    DensityBuoyancyCommonStrings.kilogramsPerLiterPatternStringProperty,
    DensityBuoyancyCommonStrings.kilogramsPerDecimeterCubedPatternStringProperty
  ], ( units: VolumeUnits, kilogramsPerLiterPatternString, kilogramsPerDecimeterCubedPatternString ) => {
    return units === 'liters' ? kilogramsPerLiterPatternString : kilogramsPerDecimeterCubedPatternString;
  } ),
  KILOGRAMS_PATTERN_STRING_PROPERTY: new PatternStringProperty( DensityBuoyancyCommonStrings.kilogramsPatternStringProperty, {
    kilograms: '{{value}}'
  }, { tandem: Tandem.OPT_OUT } ),
  GRAB_RELEASE_SOUND_CLIP_OPTIONS: {
    initialOutputLevel: 0.4
  },

  FLUID_DENSITY_RANGE_PER_M3: FLUID_DENSITY_RANGE_PER_L.times( LITERS_IN_CUBIC_METER ),

  // 1 cm of potential overlap due to physics stiffness variables
  SLIP: 0.01
};

export const toLiters = ( cubicMeters: number ): number => {
  return cubicMeters * DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER;
};

export const toCubicMeters = ( liters: number ): number => {
  return liters / DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER;
};

densityBuoyancyCommon.register( 'DensityBuoyancyCommonConstants', DensityBuoyancyCommonConstants );

export default DensityBuoyancyCommonConstants;