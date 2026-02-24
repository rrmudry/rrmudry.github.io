// Copyright 2024-2025, University of Colorado Boulder

/**
 * A display to show the excess pool fluid that has been displaced.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import DynamicProperty from '../../../../axon/js/DynamicProperty.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import ReadOnlyProperty from '../../../../axon/js/ReadOnlyProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import optionize, { combineOptions, EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import WithRequired from '../../../../phet-core/js/types/WithRequired.js';
import BeakerNode, { BeakerNodeOptions, SOLUTION_VISIBLE_THRESHOLD } from '../../../../scenery-phet/js/BeakerNode.js';
import NumberDisplay from '../../../../scenery-phet/js/NumberDisplay.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import RichText from '../../../../scenery/js/nodes/RichText.js';
import Color from '../../../../scenery/js/util/Color.js';
import AccordionBox, { AccordionBoxOptions } from '../../../../sun/js/AccordionBox.js';
import Panel, { PanelOptions } from '../../../../sun/js/Panel.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import GravityProperty from '../../common/model/GravityProperty.js';
import Material from '../../common/model/Material.js';
import { DisplayType } from '../../common/model/Scale.js';
import DensityBuoyancyCommonColors from '../../common/view/DensityBuoyancyCommonColors.js';
import { GeneralScaleReadoutNode } from '../../common/view/ScaleReadoutNode.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import getFluidDisplacedAccordionBoxScaleIcon from './getFluidDisplacedAccordionBoxScaleIcon.js';

type SelfOptions = EmptySelfOptions;

type FluidDisplacedAccordionBoxOptions = SelfOptions & WithRequired<AccordionBoxOptions, 'tandem'>;

const CONTENT_WIDTH = 105;

// For custom fluid densities, hollywood the color to ensure good contrast with the beaker fluid and the panel background, see https://github.com/phetsims/buoyancy/issues/154
const SAME_COLOR_MIN_DENSITY_THRESHOLD = 1000; // 1 kg/L

// Beaker expects a range between 0 (empty) and 1 (full)
export const BEAKER_RANGE = new Range( 0, 1 );

export default class FluidDisplacedAccordionBox extends AccordionBox {

  public constructor( displacedVolumeProperty: ReadOnlyProperty<number>, // Imported as property to link to it in phet-io
                      maxBeakerVolume: number,
                      fluidMaterialProperty: TReadOnlyProperty<Material>,
                      gravityProperty: GravityProperty,
                      providedOptions?: FluidDisplacedAccordionBoxOptions ) {

    const options = optionize<FluidDisplacedAccordionBoxOptions, SelfOptions, AccordionBoxOptions>()( {
      titleNode: new RichText( DensityBuoyancyCommonStrings.fluidDisplacedStringProperty, {
        font: DensityBuoyancyCommonConstants.TITLE_FONT,
        maxWidth: 100,
        lineWrap: 90,
        maxHeight: 40
      } ),
      expandedDefaultValue: true,
      fill: DensityBuoyancyCommonColors.panelBackgroundProperty,

      titleAlignX: 'left',
      titleAlignY: 'center',
      titleXMargin: 5,
      titleXSpacing: 10,

      contentXMargin: 2,
      contentYMargin: 2,
      contentXSpacing: 2,
      contentYSpacing: 2,

      accessibleName: DensityBuoyancyCommonStrings.fluidDisplacedStringProperty
    }, providedOptions );

    const beakerVolumeProperty = new NumberProperty( 0, { range: BEAKER_RANGE.copy() } );

    const solutionFillProperty = new DynamicProperty<Color, Color, Material>( fluidMaterialProperty, {
      derive: material => {
        assert && assert( material.colorProperty, 'liquid color needed here' );
        return material.colorProperty!;
      },
      map: color => {

        // Below this threshold, use the same color for better contrast, see https://github.com/phetsims/buoyancy/issues/154
        if ( fluidMaterialProperty.value.custom ) {
          if ( fluidMaterialProperty.value.density < SAME_COLOR_MIN_DENSITY_THRESHOLD ) {
            color = Material.getCustomLiquidColor( SAME_COLOR_MIN_DENSITY_THRESHOLD, DensityBuoyancyCommonConstants.FLUID_DENSITY_RANGE_PER_M3 );
          }

          return color.withAlpha( 0.8 );
        }
        else {
          return color;
        }
      }
    } );

    const beakerNode = new BeakerNode( beakerVolumeProperty, combineOptions<BeakerNodeOptions>( {
      solutionFill: solutionFillProperty
    }, FluidDisplacedAccordionBox.getBeakerOptions() ) );

    const decimalPlaces = 2;
    displacedVolumeProperty.link( displacedLiters => {
      const newValue = displacedLiters / maxBeakerVolume;
      const formatted = Utils.toFixed( displacedLiters, decimalPlaces );

      // Iff the readout shows 0, don't show liquid in the beaker.
      beakerVolumeProperty.value = formatted === '0.00' ? 0 : Math.max( SOLUTION_VISIBLE_THRESHOLD, newValue );
    } );

    const numberDisplay = new NumberDisplay( displacedVolumeProperty, new Range( 0, maxBeakerVolume ), {
      valuePattern: DensityBuoyancyCommonConstants.VOLUME_PATTERN_STRING_PROPERTY,
      useRichText: true,
      decimalPlaces: decimalPlaces,
      textOptions: {
        font: new PhetFont( 14 ),
        maxWidth: beakerNode.width * 0.66 // recognizing that this isn't the maxWidth of the whole NumberDisplay.
      },
      opacity: 0.8
    } );

    const displacedWeightProperty = new DerivedProperty( [
      gravityProperty.gravityValueProperty,
      displacedVolumeProperty,
      fluidMaterialProperty
    ], ( gravityValue, displacedVolume, fluidMaterial ) => {

      // Convert density units from kg/m^3=>kg/L
      return ( fluidMaterial.density / DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER ) *
             gravityValue * displacedVolume;
    }, {
      tandem: options.tandem.createTandem( 'displacedWeightProperty' ),
      phetioValueType: NumberIO,
      phetioFeatured: true,
      units: 'N'
    } );

    const scaleIcon = getFluidDisplacedAccordionBoxScaleIcon();

    const forceReadout = new GeneralScaleReadoutNode( displacedWeightProperty, gravityProperty, DisplayType.NEWTONS, {
      textMaxWidth: scaleIcon.width * 0.8 // margins on the scale, and the icon goes beyond the actual scale, see https://github.com/phetsims/density-buoyancy-common/issues/108
    } );

    forceReadout.childBoundsProperty.link( () => {
      forceReadout.centerX = beakerNode.centerX;
    } );

    numberDisplay.bottom = beakerNode.bottom - beakerNode.height * 0.05;
    numberDisplay.right = beakerNode.right;
    scaleIcon.top = beakerNode.bottom - 13;
    forceReadout.centerY = scaleIcon.bottom - 13;
    scaleIcon.centerX = forceReadout.centerX = beakerNode.centerX;

    numberDisplay.boundsProperty.link( () => {
      numberDisplay.right = beakerNode.right;
    } );

    const panel = new Panel(
      new Node( {
        children: [ scaleIcon, beakerNode, numberDisplay, forceReadout ]
      } ),
      combineOptions<PanelOptions>( {}, DensityBuoyancyCommonConstants.PANEL_OPTIONS, {
        yMargin: DensityBuoyancyCommonConstants.MARGIN_SMALL,
        stroke: null
      } )
    );
    super( panel, options );

    this.addLinkedElement( displacedVolumeProperty, {
      tandemName: 'displacedVolumeProperty'
    } );
  }

  public static getBeakerOptions(): BeakerNodeOptions {
    return {
      lineWidth: 1,
      beakerHeight: CONTENT_WIDTH * 0.55,
      beakerWidth: CONTENT_WIDTH,
      yRadiusOfEnds: CONTENT_WIDTH * 0.12,
      ticksVisible: true,
      numberOfTicks: 9, // The top is the 10th tick mark
      majorTickMarkModulus: 5
    };
  }
}

densityBuoyancyCommon.register( 'FluidDisplacedAccordionBox', FluidDisplacedAccordionBox );