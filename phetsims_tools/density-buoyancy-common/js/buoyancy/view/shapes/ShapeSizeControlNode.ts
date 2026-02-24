// Copyright 2019-2025, University of Colorado Boulder

/**
 * Controls the dimensions of different masses with a generic "height/width" control.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../../axon/js/BooleanProperty.js';
import DerivedStringProperty from '../../../../../axon/js/DerivedStringProperty.js';
import { TReadOnlyProperty } from '../../../../../axon/js/TReadOnlyProperty.js';
import UnitConversionProperty from '../../../../../axon/js/UnitConversionProperty.js';
import Dimension2 from '../../../../../dot/js/Dimension2.js';
import Range from '../../../../../dot/js/Range.js';
import optionize, { combineOptions } from '../../../../../phet-core/js/optionize.js';
import WithRequired from '../../../../../phet-core/js/types/WithRequired.js';
import NumberControl, { NumberControlOptions } from '../../../../../scenery-phet/js/NumberControl.js';
import NumberDisplay from '../../../../../scenery-phet/js/NumberDisplay.js';
import { FlowBoxOptions } from '../../../../../scenery/js/layout/nodes/FlowBox.js';
import HBox from '../../../../../scenery/js/layout/nodes/HBox.js';
import HSeparator from '../../../../../scenery/js/layout/nodes/HSeparator.js';
import VBox, { VBoxOptions } from '../../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../../scenery/js/nodes/Node.js';
import Text from '../../../../../scenery/js/nodes/Text.js';
import ComboBox from '../../../../../sun/js/ComboBox.js';
import Tandem from '../../../../../tandem/js/Tandem.js';
import DensityBuoyancyCommonConstants from '../../../common/DensityBuoyancyCommonConstants.js';
import { MassShape } from '../../../common/model/MassShape.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../../DensityBuoyancyCommonStrings.js';
import BuoyancyShapeModel from '../../model/shapes/BuoyancyShapeModel.js';

type SelfOptions = {
  labelNode?: Node | null;
};

export type ShapeSizeControlNodeOptions = SelfOptions & WithRequired<FlowBoxOptions, 'tandem'>;

export default class ShapeSizeControlNode extends VBox {
  public constructor(
    shapeModel: BuoyancyShapeModel,
    volumeProperty: TReadOnlyProperty<number>, // cubic meters
    listParent: Node,
    providedOptions?: ShapeSizeControlNodeOptions ) {

    const options = optionize<ShapeSizeControlNodeOptions, SelfOptions, VBoxOptions>()( {
      labelNode: null
    }, providedOptions );

    super( {
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      align: 'left'
    } );

    const shapeComboBox = new ComboBox( shapeModel.shapeNameProperty, MassShape.enumeration.values.map( massShape => {
      return {
        value: massShape,
        createNode: () => new Text( massShape.shapeString, {
          font: DensityBuoyancyCommonConstants.COMBO_BOX_ITEM_FONT,
          maxWidth: 110 // 160 minus maxWidth of the icons
        } ),
        tandemName: `${massShape.tandemName}Item`,
        accessibleName: massShape.shapeString
      };
    } ), listParent, {
      xMargin: 8,
      yMargin: 4,
      tandem: options.tandem.createTandem( 'shapeComboBox' )
    } );

    const numberControlOptions = {
      delta: DensityBuoyancyCommonConstants.NUMBER_CONTROL_DELTA,
      sliderOptions: {
        trackSize: new Dimension2( 120, 0.5 ),
        thumbSize: DensityBuoyancyCommonConstants.THUMB_SIZE
      },
      arrowButtonOptions: {
        scale: DensityBuoyancyCommonConstants.ARROW_BUTTON_SCALE
      },
      numberDisplayOptions: {
        tandem: Tandem.OPT_OUT
      },
      layoutFunction: NumberControl.createLayoutFunction4( {
        numberDisplayParentNodeOptions: { visibleProperty: new BooleanProperty( false ) },
        sliderPadding: 5
      } ),
      titleNodeOptions: {
        font: DensityBuoyancyCommonConstants.ITEM_FONT,
        maxWidth: 160
      }
    };

    const verticalStringProperty = new DerivedStringProperty( [
      shapeModel.shapeNameProperty,
      DensityBuoyancyCommonStrings.heightStringProperty,
      DensityBuoyancyCommonStrings.radiusStringProperty
    ], ( ( shapeName, heightString, radiusString ) => {
      return shapeName === MassShape.HORIZONTAL_CYLINDER ? radiusString :
             heightString;
    } ), {
      tandem: options.tandem.createTandem( 'verticalStringProperty' ) // To help with studio autoselect
    } );

    const horizontalStringProperty = new DerivedStringProperty( [
      shapeModel.shapeNameProperty,
      DensityBuoyancyCommonStrings.widthStringProperty,
      DensityBuoyancyCommonStrings.radiusStringProperty,
      DensityBuoyancyCommonStrings.widthAndDepthStringProperty
    ], ( ( shapeName, widthString, radiusString, widthAndDepth ) => {
      return shapeName === MassShape.BLOCK || shapeName === MassShape.DUCK || shapeName === MassShape.ELLIPSOID ? widthAndDepth :
             shapeName === MassShape.VERTICAL_CYLINDER || shapeName === MassShape.CONE || shapeName === MassShape.INVERTED_CONE ? radiusString :
             widthString;
    } ), {
      tandem: options.tandem.createTandem( 'horizontalStringProperty' ) // To help with studio autoselect
    } );

    const verticalNumberControl = new NumberControl( verticalStringProperty, shapeModel.verticalRatioProperty, new Range( 0, 1 ), combineOptions<NumberControlOptions>( {
      tandem: options.tandem.createTandem( 'verticalNumberControl' ),
      accessibleName: DensityBuoyancyCommonStrings.heightStringProperty
    }, numberControlOptions ) );

    const horizontalNumberControl = new NumberControl( horizontalStringProperty, shapeModel.horizontalRatioProperty, new Range( 0, 1 ), combineOptions<NumberControlOptions>( {
      tandem: options.tandem.createTandem( 'horizontalNumberControl' ),
      accessibleName: horizontalStringProperty
    }, numberControlOptions ) );

    const litersProperty = new UnitConversionProperty( volumeProperty, {
      factor: DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER
    } );

    this.children = [
      new HBox( {
        spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
        children: [
          shapeComboBox,
          options.labelNode
        ].filter( _.identity ) as Node[]
      } ),
      verticalNumberControl,
      horizontalNumberControl,
      new HSeparator(),
      new HBox( {
        layoutOptions: { stretch: true },
        align: 'center',
        justify: 'spaceBetween',
        tandem: options.tandem.createTandem( 'volumeDisplay' ),
        visiblePropertyOptions: {
          phetioFeatured: true
        },
        children: [
          new Text( DensityBuoyancyCommonStrings.volumeStringProperty, {
            font: DensityBuoyancyCommonConstants.READOUT_FONT,
            maxWidth: horizontalNumberControl.width / 2
          } ),

          // For this number display, the max is 8.66 (for the cube Block) but each shape has a different maximum. But
          // the limit of 10.00 works well for the sizing.
          new NumberDisplay( litersProperty, new Range( 0, 10 ), {
            valuePattern: DensityBuoyancyCommonConstants.VOLUME_PATTERN_STRING_PROPERTY,
            useRichText: true,
            decimalPlaces: 2,
            textOptions: {
              font: DensityBuoyancyCommonConstants.READOUT_FONT,
              maxWidth: horizontalNumberControl.width / 3 // to account for the numberDisplay padding
            }
          } )
        ]
      } )
    ];

    this.mutate( options );
  }
}

densityBuoyancyCommon.register( 'ShapeSizeControlNode', ShapeSizeControlNode );