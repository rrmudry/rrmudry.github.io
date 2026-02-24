// Copyright 2019-2025, University of Colorado Boulder

/**
 * Panel content for showing/hiding various arrows/readouts.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Property from '../../../../axon/js/Property.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import { combineOptions, optionize4 } from '../../../../phet-core/js/optionize.js';
import WithRequired from '../../../../phet-core/js/types/WithRequired.js';
import ArrowNode, { ArrowNodeOptions } from '../../../../scenery-phet/js/ArrowNode.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import PlusMinusZoomButtonGroup from '../../../../scenery-phet/js/PlusMinusZoomButtonGroup.js';
import HBox from '../../../../scenery/js/layout/nodes/HBox.js';
import HSeparator from '../../../../scenery/js/layout/nodes/HSeparator.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import Text, { TextOptions } from '../../../../scenery/js/nodes/Text.js';
import Color from '../../../../scenery/js/util/Color.js';
import RectangularButton from '../../../../sun/js/buttons/RectangularButton.js';
import Checkbox, { CheckboxOptions } from '../../../../sun/js/Checkbox.js';
import Panel, { PanelOptions } from '../../../../sun/js/Panel.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import DensityBuoyancyCommonColors from '../../common/view/DensityBuoyancyCommonColors.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DisplayProperties from './DisplayProperties.js';

// constants
const arrowSpacing = DensityBuoyancyCommonConstants.SPACING;
const arrowLength = 45;
const arrowOptions = {
  stroke: null,
  headWidth: 15,
  headHeight: 15,
  tailWidth: 4
};
const labelFont = new PhetFont( 14 );
const checkboxOptions = {
  boxWidth: 17,
  spacing: DensityBuoyancyCommonConstants.SPACING_SMALL
};
const checkboxSpacing = DensityBuoyancyCommonConstants.SPACING_SMALL;

type SelfOptions = {
  contentWidth?: number;
};

type BuoyancyDisplayOptionsPanelOptions = SelfOptions & WithRequired<PanelOptions, 'tandem'>;

export default class BuoyancyDisplayOptionsPanel extends Panel {
  public constructor( displayProperties: DisplayProperties, providedOptions: BuoyancyDisplayOptionsPanelOptions ) {

    const options = optionize4<BuoyancyDisplayOptionsPanelOptions, SelfOptions, PanelOptions>()( {}, DensityBuoyancyCommonConstants.PANEL_OPTIONS, {
      contentWidth: 200
    }, providedOptions );

    const labelOptions = {
      font: labelFont,
      maxWidth: options.contentWidth - 3 * arrowSpacing - arrowLength - checkboxOptions.boxWidth - checkboxOptions.spacing - 2 * options.xMargin
    };

    const forcesSubpanelTandem = options.tandem.createTandem( 'forcesSubpanel' );

    const createForceControl = ( property: Property<boolean>, label: TReadOnlyProperty<string>, color: TReadOnlyProperty<Color>, tandemName: string ) => {
      const children = [
        new Text( label, labelOptions ),
        new ArrowNode( 0, 0, arrowLength, 0, combineOptions<ArrowNodeOptions>( {
          fill: color
        }, arrowOptions ) )
      ];
      return new Checkbox( property, new HBox( { children: children, spacing: 2 * arrowSpacing } ), combineOptions<CheckboxOptions>( {
        tandem: forcesSubpanelTandem.createTandem( tandemName ),
        containerTagName: 'p',
        accessibleName: label,
        boxWidth: 14,
        touchAreaYDilation: 2.2,
        phetioDisplayOnlyPropertyInstrumented: true
      }, checkboxOptions ) );
    };

    const plusMinusZoomButtonGroup = new PlusMinusZoomButtonGroup( displayProperties.vectorZoomLevelProperty, {
      spacing: 3, // Custom small spacing between the buttons
      buttonOptions: {
        cornerRadius: 3,
        buttonAppearanceStrategy: RectangularButton.ThreeDAppearanceStrategy,
        stroke: 'black',
        xMargin: 7,
        yMargin: 7
      },
      applyZoomIn: ( scale: number ) => scale + 1,
      applyZoomOut: ( scale: number ) => scale - 1,
      tandem: forcesSubpanelTandem.createTandem( 'vectorZoomButtonGroup' ),
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    } );

    const content = new VBox( {
      align: 'left',
      spacing: checkboxSpacing,
      children: [
        // Forces Group VBox
        new VBox( {
          spacing: checkboxSpacing,
          align: 'left',
          tandem: forcesSubpanelTandem,
          visiblePropertyOptions: {
            phetioFeatured: true
          },
          stretch: true,
          children: [
            new Text( DensityBuoyancyCommonStrings.forcesStringProperty, {
              font: DensityBuoyancyCommonConstants.TITLE_FONT,
              maxWidth: options.contentWidth - 2 * options.xMargin
            } ),
            createForceControl( displayProperties.gravityForceVisibleProperty, DensityBuoyancyCommonStrings.gravity.nameStringProperty, DensityBuoyancyCommonColors.gravityForceProperty, 'gravityForceCheckbox' ),
            createForceControl( displayProperties.buoyancyForceVisibleProperty, DensityBuoyancyCommonStrings.buoyancyStringProperty, DensityBuoyancyCommonColors.buoyancyForceProperty, 'buoyancyForceCheckbox' ),
            createForceControl( displayProperties.contactForceVisibleProperty, DensityBuoyancyCommonStrings.contactStringProperty, DensityBuoyancyCommonColors.contactForceProperty, 'contactForceCheckbox' ),

            // Vector zoom
            new HBox( {
              children: [
                new Text( DensityBuoyancyCommonStrings.vectorZoomStringProperty, combineOptions<TextOptions>( {
                  visibleProperty: plusMinusZoomButtonGroup.visibleProperty
                }, labelOptions ) ),
                plusMinusZoomButtonGroup
              ]
            } ),

            new Checkbox( displayProperties.forceValuesVisibleProperty, new Text( DensityBuoyancyCommonStrings.forceValuesStringProperty, labelOptions ), combineOptions<CheckboxOptions>( {
              tandem: forcesSubpanelTandem.createTandem( 'forceValuesCheckbox' ),
              containerTagName: 'p',
              accessibleName: DensityBuoyancyCommonStrings.forceValuesStringProperty
            }, checkboxOptions ) )
          ]
        } ),

        new HSeparator(),

        // Mass and depth lines checkboxes
        new VBox( {
          spacing: checkboxSpacing,
          align: 'left',
          children: [
            new Checkbox( displayProperties.massValuesVisibleProperty, new Text( DensityBuoyancyCommonStrings.massValuesStringProperty, labelOptions ), combineOptions<CheckboxOptions>( {
              tandem: options.tandem.createTandem( 'massValuesCheckbox' ),
              containerTagName: 'p',
              accessibleName: DensityBuoyancyCommonStrings.massValuesStringProperty
            }, checkboxOptions ) ),
            ...( displayProperties.supportsDepthLines ?
              [ new Checkbox( displayProperties.depthLinesVisibleProperty, new Text( DensityBuoyancyCommonStrings.depthLinesStringProperty, labelOptions ), combineOptions<CheckboxOptions>( {
                tandem: options.tandem.createTandem( 'depthLinesCheckbox' ),
                containerTagName: 'p',
                accessibleName: DensityBuoyancyCommonStrings.depthLinesStringProperty
              }, checkboxOptions ) ) ] : [] )
          ]
        } )
      ]
    } );

    super( content, options );
  }
}

densityBuoyancyCommon.register( 'BuoyancyDisplayOptionsPanel', BuoyancyDisplayOptionsPanel );