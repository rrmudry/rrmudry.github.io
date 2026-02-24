// Copyright 2024-2025, University of Colorado Boulder

/**
 * Panel that contains information and controls related to the Boat and Block in the Applications Screen
 *
 * @author Agustín Vallejo
 */

import UnitConversionProperty from '../../../../../axon/js/UnitConversionProperty.js';
import Utils from '../../../../../dot/js/Utils.js';
import { combineOptions } from '../../../../../phet-core/js/optionize.js';
import NumberControl, { NumberControlOptions } from '../../../../../scenery-phet/js/NumberControl.js';
import PhetFont from '../../../../../scenery-phet/js/PhetFont.js';
import HSeparator from '../../../../../scenery/js/layout/nodes/HSeparator.js';
import VBox from '../../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../../scenery/js/nodes/Node.js';
import Text from '../../../../../scenery/js/nodes/Text.js';
import Panel from '../../../../../sun/js/Panel.js';
import Tandem from '../../../../../tandem/js/Tandem.js';
import DensityBuoyancyCommonConstants from '../../../common/DensityBuoyancyCommonConstants.js';
import Cube from '../../../common/model/Cube.js';
import MaterialMassVolumeControlNode from '../../../common/view/MaterialMassVolumeControlNode.js';
import PrecisionSliderThumb from '../../../common/view/PrecisionSliderThumb.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../../DensityBuoyancyCommonStrings.js';
import Boat from '../../model/applications/Boat.js';

export default class BoatPanel extends Panel {

  public readonly contentWidth: number;

  public constructor( block: Cube, boat: Boat, popupLayer: Node, tandem: Tandem ) {
    const blockControls = new MaterialMassVolumeControlNode( block.materialProperty, block.massProperty, block.volumeProperty,
      block.materialProperty.availableValues, cubicMeters => block.updateSize( Cube.boundsFromVolume( cubicMeters ) ), popupLayer, {
        tandem: tandem.createTandem( 'blockControls' ),
        visiblePropertyOptions: {
          phetioFeatured: true
        },
        highDensityMaxMass: 215
      } );
    const boatVolumeControlTandem = tandem.createTandem( 'boatVolumeNumberControl' );
    const boatVolumeRange = boat.maxVolumeDisplacedProperty.range.times( DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER );
    const boatBox = new VBox( {
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      align: 'left',
      children: [
        blockControls,
        new HSeparator(),
        // Convert cubic meters => liters
        new NumberControl( DensityBuoyancyCommonStrings.boatVolumeStringProperty, new UnitConversionProperty( boat.maxVolumeDisplacedProperty, {
          factor: DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER
        } ), boatVolumeRange, combineOptions<NumberControlOptions>( {
          numberDisplayOptions: {
            valuePattern: DensityBuoyancyCommonConstants.VOLUME_PATTERN_STRING_PROPERTY,
            useRichText: true,
            textOptions: {
              font: DensityBuoyancyCommonConstants.READOUT_FONT,
              maxWidth: 120
            }
          }
        }, MaterialMassVolumeControlNode.getNumberControlOptions(), {
          sliderOptions: {
            thumbNode: new PrecisionSliderThumb( {
              tandem: boatVolumeControlTandem.createTandem( 'slider' ).createTandem( 'thumbNode' )
            } ),
            constrainValue: ( value: number ) => {
              return boatVolumeRange.constrainValue( Utils.roundToInterval( value, 0.1 ) );
            },
            phetioLinkedProperty: boat.maxVolumeDisplacedProperty,
            majorTickLength: 5,
            majorTicks: [ {
              value: boatVolumeRange.min,
              label: new Text( boatVolumeRange.min, { font: new PhetFont( 12 ), maxWidth: 50 } )
            }, {
              value: boatVolumeRange.max,
              label: new Text( boatVolumeRange.max, { font: new PhetFont( 12 ), maxWidth: 50 } )
            } ]
          },

          accessibleName: DensityBuoyancyCommonStrings.boatVolumeStringProperty,
          tandem: boatVolumeControlTandem
        } ) )
      ]
    } );

    super( boatBox, DensityBuoyancyCommonConstants.PANEL_OPTIONS );

    this.contentWidth = boatBox.width;
  }
}

densityBuoyancyCommon.register( 'BoatPanel', BoatPanel );