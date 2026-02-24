// Copyright 2024-2025, University of Colorado Boulder

/**
 * Panel that has a radio button group to choose between:
 *
 * - Same Mass
 * - Same Volume
 * - Same Density
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Property from '../../../../axon/js/Property.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import Panel, { PanelOptions } from '../../../../sun/js/Panel.js';
import VerticalAquaRadioButtonGroup from '../../../../sun/js/VerticalAquaRadioButtonGroup.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import BlockSet from '../model/BlockSet.js';

export default class BlocksPanel extends Panel {
  public constructor( blockSetProperty: Property<BlockSet>, tandem: Tandem ) {
    const blockSetRadioButtonGroup = new VerticalAquaRadioButtonGroup( blockSetProperty, BlockSet.enumeration.values.map( blockSet => {
      return {
        createNode: tandem => new Text( blockSet.stringProperty, {
          font: DensityBuoyancyCommonConstants.RADIO_BUTTON_FONT,
          maxWidth: 160
        } ),
        value: blockSet,
        tandemName: `${blockSet.tandemName}RadioButton`,
        options: {

          // pdom
          accessibleName: blockSet.stringProperty
        }
      };
    } ), {
      align: 'left',
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      tandem: tandem.createTandem( 'blockSetRadioButtonGroup' ),
      phetioVisiblePropertyInstrumented: false
    } );
    super( new VBox( {
      align: 'left',
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      children: [
        new Text( DensityBuoyancyCommonStrings.blocksStringProperty, {
          font: DensityBuoyancyCommonConstants.TITLE_FONT,
          maxWidth: 160
        } ),
        blockSetRadioButtonGroup
      ]
    } ), combineOptions<PanelOptions>( {
      tandem: tandem,
      phetioType: Node.NodeIO,
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    }, DensityBuoyancyCommonConstants.PANEL_OPTIONS ) );
  }
}

densityBuoyancyCommon.register( 'BlocksPanel', BlocksPanel );