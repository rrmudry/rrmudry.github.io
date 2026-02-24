// Copyright 2019-2025, University of Colorado Boulder

/**
 * Shows a NumberControl/ComboBox to control the gravity.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import GatedVisibleProperty from '../../../../axon/js/GatedVisibleProperty.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import Gravity from '../model/Gravity.js';
import GravityProperty from '../model/GravityProperty.js';
import ComboNumberControl from './ComboNumberControl.js';

const FALLBACK_NODE = new Text( DensityBuoyancyCommonStrings.whatIsTheValueOfGravityStringProperty, {
  font: new PhetFont( 14 ),

  // estimate as the same max width as the combo box below
  maxWidth: 210
} );

export default class GravityControlNode extends ComboNumberControl<Gravity> {
  public constructor( gravityProperty: GravityProperty, listParent: Node, tandem: Tandem ) {

    const numberDisplayTandem = tandem.createTandem( 'numberDisplay' );

    super( {
      unitsConversionFactor: 1,
      tandem: tandem,
      titleProperty: DensityBuoyancyCommonStrings.gravity.nameStringProperty,
      valuePatternProperty: DensityBuoyancyCommonStrings.metersPerSecondSquaredPatternStringProperty,
      property: gravityProperty,
      range: gravityProperty.customGravity.gravityValueProperty.rangeProperty.value,
      listParent: listParent,
      comboItems: gravityProperty.availableValues.map( gravity => {
        return {
          value: gravity,
          createNode: () => new Text( gravity.nameProperty, {
            font: DensityBuoyancyCommonConstants.COMBO_BOX_ITEM_FONT,
            maxWidth: 160
          } ),
          tandemName: `${gravity.tandem.name.replace( 'Gravity', '' )}Item`,
          accessibleName: gravity.nameProperty
        };
      } ),
      comboBoxOptions: {
        listPosition: 'above'
      },
      numberControlOptions: {
        numberDisplayOptions: {
          tandem: numberDisplayTandem,
          visibleProperty: new GatedVisibleProperty(
            new DerivedProperty( [ gravityProperty ], gravity => !gravity.hidden ),
            numberDisplayTandem
          )
        }
      },
      getFallbackNode: gravity => {
        if ( gravity.hidden ) {
          return FALLBACK_NODE;
        }
        else {
          return null;
        }
      }
    } );
  }
}

densityBuoyancyCommon.register( 'GravityControlNode', GravityControlNode );