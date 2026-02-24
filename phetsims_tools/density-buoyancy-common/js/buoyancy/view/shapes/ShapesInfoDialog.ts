// Copyright 2024-2025, University of Colorado Boulder

/**
 * ShapesInfoDialog is a dialog that displays info related to the forces and torque limitations within the sim
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 */

import PhetFont from '../../../../../scenery-phet/js/PhetFont.js';
import VBox from '../../../../../scenery/js/layout/nodes/VBox.js';
import RichText from '../../../../../scenery/js/nodes/RichText.js';
import Dialog from '../../../../../sun/js/Dialog.js';
import Tandem from '../../../../../tandem/js/Tandem.js';
import DensityBuoyancyCommonConstants from '../../../common/DensityBuoyancyCommonConstants.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../../DensityBuoyancyCommonStrings.js';

export default class ShapesInfoDialog extends Dialog {

  public constructor( tandem: Tandem ) {

    const content = new VBox( {
      align: 'left',
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      margin: DensityBuoyancyCommonConstants.MARGIN,
      children: [
        new RichText( DensityBuoyancyCommonStrings.shapesInfoDialogStringProperty, {
          font: new PhetFont( 18 ),
          fill: 'black',
          lineWrap: 450
        } )
      ]
    } );

    super( content, {
      isDisposable: false,
      titleAlign: 'center',
      tandem: tandem
    } );
  }
}

densityBuoyancyCommon.register( 'ShapesInfoDialog', ShapesInfoDialog );