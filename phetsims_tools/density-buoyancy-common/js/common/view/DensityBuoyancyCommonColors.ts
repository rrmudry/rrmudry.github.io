// Copyright 2019-2025, University of Colorado Boulder

/**
 * Colors for the density/buoyancy simulations.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import packageJSON from '../../../../joist/js/packageJSON.js';
import PhetColorScheme from '../../../../scenery-phet/js/PhetColorScheme.js';
import Color from '../../../../scenery/js/util/Color.js';
import ProfileColorProperty from '../../../../scenery/js/util/ProfileColorProperty.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

const tandem = Tandem.COLORS;
const packageName = packageJSON.name;

// Initial colors for each profile, by string key. Only profile currently is default (still helpful for making color
// tweaks with the top-level files)
const DensityBuoyancyCommonColors = {
  // Color recommended in https://github.com/phetsims/density/issues/6#issuecomment-600911868
  panelBackgroundProperty: new ProfileColorProperty( densityBuoyancyCommon, 'panelBackground', {
    default: new Color( 240, 240, 240 )
  } ),

  skyBottomProperty: new ProfileColorProperty( densityBuoyancyCommon, 'skyBottom', {
    default: new Color( 255, 255, 255 )
  } ),
  skyTopProperty: new ProfileColorProperty( densityBuoyancyCommon, 'skyTop', {
    default: new Color( 19, 165, 224 )
  } ),
  groundProperty: new ProfileColorProperty( densityBuoyancyCommon, 'ground', {
    default: new Color( 161, 101, 47 )
  } ),
  grassCloseProperty: new ProfileColorProperty( densityBuoyancyCommon, 'grassClose', {
    default: new Color( 107, 165, 75 )
  } ),
  grassFarProperty: new ProfileColorProperty( densityBuoyancyCommon, 'grassFar', {
    default: new Color( 230, 230, 80 )
  } ),
  poolSurfaceProperty: new ProfileColorProperty( densityBuoyancyCommon, 'poolSurface', {
    default: new Color( 183, 159, 159 )
  } ),

  fluidIndicatorHighlightProperty: new ProfileColorProperty( densityBuoyancyCommon, 'fluidIndicatorHighlight', {
    default: new Color( 255, 0, 0 )
  } ),

  contactForceProperty: new ProfileColorProperty( densityBuoyancyCommon, 'contactForce', {
    default: new Color( 234, 150, 62 )
  } ),
  gravityForceProperty: new ProfileColorProperty( densityBuoyancyCommon, 'gravityForce', {
    default: PhetColorScheme.GRAVITATIONAL_FORCE
  } ),
  buoyancyForceProperty: new ProfileColorProperty( densityBuoyancyCommon, 'buoyancyForce', {
    default: new Color( 218, 51, 138 )
  } ),

  massLabelBackgroundProperty: new ProfileColorProperty( densityBuoyancyCommon, 'massLabelBackground', {
    default: Color.WHITE
  } ),

  tagAProperty: new ProfileColorProperty( densityBuoyancyCommon, 'tagA', {
    default: new Color( 237, 55, 50 )
  } ),
  tagBProperty: new ProfileColorProperty( densityBuoyancyCommon, 'tagB', {
    default: new Color( 48, 89, 166 )
  } ),

  // Color used in Density, uninstrumented in https://github.com/phetsims/density-buoyancy-common/issues/265
  compareYellowColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'compareYellow', {
    default: new Color( 252, 246, 80 )
  } ),
  compareBlueColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'compareBlue', {
    default: new Color( 46, 88, 166 )
  } ),
  compareGreenColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'compareGreen', {
    default: new Color( 125, 195, 52 )
  } ),
  compareOchreColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'compareOchre', {
    default: new Color( 160, 140, 0 )
  } ),
  compareRedColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'compareRed', {
    default: new Color( 233, 55, 50 )
  } ),
  comparePurpleColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'comparePurple', {
    default: new Color( 131, 43, 126 )
  } ),

  mysteryPinkColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryPink', {
    default: new Color( 255, 192, 203 )
  } ),
  mysteryOrangeColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryOrange', {
    default: new Color( 255, 127, 0 )
  } ),
  mysteryLightPurpleColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryLightPurple', {
    default: new Color( 177, 156, 217 )
  } ),
  mysteryLightGreenColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryLightGreen', {
    default: new Color( 144, 238, 144 )
  } ),
  mysteryBrownColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryBrown', {
    default: new Color( 150, 75, 0 )
  } ),
  mysteryWhiteColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryWhite', {
    default: new Color( 255, 255, 255 )
  } ),
  mysteryGrayColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryGray', {
    default: new Color( 140, 140, 140 )
  } ),
  mysteryMustardColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryMustard', {
    default: new Color( 225, 173, 0 )
  } ),
  mysteryPeachColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryPeach', {
    default: new Color( 255, 229, 180 )
  } ),
  mysteryMaroonColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'mysteryMaroon', {
    default: new Color( 128, 0, 0 )
  } ),

  chartHeaderColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'chartHeader', {
    default: new Color( 230, 230, 230 )
  } ),

  radioBorderColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'radioBorder', {
    default: PhetColorScheme.BUTTON_YELLOW
  } ),
  radioBackgroundColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'radioBackground', {
    default: Color.WHITE
  } ),

  // "liquid" material colors
  materialConcreteColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialConcrete', {
    default: new Color( 128, 130, 133 )
  } ),
  materialCopperColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialCopper', {
    default: new Color( 184, 115, 51 )
  } ),
  materialFluidAColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialFluidA', {
    default: new Color( 255, 255, 80, 0.6 )
  } ),
  materialFluidBColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialFluidB', {
    default: new Color( 80, 255, 255, 0.6 )
  } ),
  materialFluidCColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialFluidC', {
    default: new Color( 255, 128, 255, 0.6 )
  } ),
  materialFluidDColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialFluidD', {
    default: new Color( 128, 255, 255, 0.6 )
  } ),
  materialFluidEColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialFluidE', {
    default: new Color( 255, 128, 128, 0.6 )
  } ),
  materialFluidFColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialFluidF', {
    default: new Color( 128, 255, 128, 0.6 )
  } ),
  materialGasolineColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialGasoline', {
    default: new Color( 230, 255, 0, 0.4 )
  } ),
  materialHoneyColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialHoney', {
    default: new Color( 238, 170, 0, 0.5 )
  } ),
  materialMercuryColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialMercury', {
    default: new Color( 219, 206, 202, 0.8 )
  } ),
  materialOilColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialOil', {
    default: new Color( 180, 230, 20, 0.4 )
  } ),
  materialSandColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialSand', {
    default: new Color( 194, 178, 128 )
  } ),
  materialSeawaterColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialSeawater', {
    default: new Color( 0, 150, 255, 0.4 )
  } ),
  materialWaterColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialWater', {
    default: new Color( 0, 128, 255, 0.4 )
  } ),
  materialTColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialT', {
    default: new Color( 'rgba(255,0,0,1)' )
  }, {
    tandem: packageName === 'buoyancy' ? tandem.createTandem( 'materialTColorProperty' ) : Tandem.OPT_OUT,
    phetioFeatured: true
  } ),
  materialUColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialU', {
    default: new Color( 'rgba(0,255,0,1)' )
  }, {
    tandem: packageName === 'buoyancy' ? tandem.createTandem( 'materialUColorProperty' ) : Tandem.OPT_OUT,
    phetioFeatured: true
  } ),
  materialVColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialV', {
    default: new Color( 'rgba(255,115,0,0.61)' )
  }, {
    tandem: packageName === 'buoyancy' ? tandem.createTandem( 'materialVColorProperty' ) : Tandem.OPT_OUT,
    phetioFeatured: true
  } ),
  materialWColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialW', {
    default: new Color( 'rgba(255,16,223,0.5)' )
  }, {
    tandem: packageName === 'buoyancy' ? tandem.createTandem( 'materialWColorProperty' ) : Tandem.OPT_OUT,
    phetioFeatured: true
  } ),
  materialXColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialX', {
    default: new Color( 'rgba(255,255,0,1)' )
  }, {
    tandem: packageName === 'buoyancy' ? tandem.createTandem( 'materialXColorProperty' ) : Tandem.OPT_OUT,
    phetioFeatured: true
  } ),
  materialYColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'materialY', {
    default: new Color( 'rgba(0,170,255,1)' )
  }, {
    tandem: packageName === 'buoyancy' ? tandem.createTandem( 'materialYColorProperty' ) : Tandem.OPT_OUT,
    phetioFeatured: true
  } ),
  customFluidLightColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'customFluidLight', {
    default: new Color( 255, 255, 255, 0.3 )
  } ),
  customFluidDarkColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'customFluidDark', {
    default: new Color( 0, 30, 255, 0.6 )
  } ),

  depthLinesDarkColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'depthLinesDark', {
    default: Color.DARK_GRAY
  } ),
  depthLinesLightColorProperty: new ProfileColorProperty( densityBuoyancyCommon, 'depthLinesLight', {
    default: Color.LIGHT_GRAY
  } )
};

densityBuoyancyCommon.register( 'DensityBuoyancyCommonColors', DensityBuoyancyCommonColors );

export default DensityBuoyancyCommonColors;