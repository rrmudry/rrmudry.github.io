// Copyright 2019-2025, University of Colorado Boulder

/**
 * A label shown in front of a mass that shows its mass-value. This is not to be confused with a label for the name of
 * the mass (see MassTagNode).
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import ReadOnlyProperty from '../../../../axon/js/ReadOnlyProperty.js';
import Utils from '../../../../dot/js/Utils.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import ManualConstraint from '../../../../scenery/js/layout/constraints/ManualConstraint.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import Panel from '../../../../sun/js/Panel.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import Mass from '../model/Mass.js';

export default class MassLabelNode extends Node {

  public constructor( mass: Mass, showMassValuesProperty: ReadOnlyProperty<boolean> ) {
    super( {
      pickable: false
    } );

    const readoutStringProperty = new DerivedProperty( [
      mass.materialProperty,
      mass.materialProperty.densityProperty,
      mass.volumeProperty,
      DensityBuoyancyCommonStrings.kilogramsPatternStringProperty,
      DensityBuoyancyCommonStrings.questionMarkStringProperty
    ], (
      material,
      density,
      volume,
      patternStringProperty,
      questionMarkString
    ) => material.hidden ? questionMarkString :
         StringUtils.fillIn( patternStringProperty, {
           // Deriving the mass instead of using massProperty to avoid including the contained mass, for the case of the boat
           kilograms: Utils.toFixed( volume * density, 2 ),
           decimalPlaces: 2
         } ) );

    const readoutText = new Text( readoutStringProperty, {
      font: new PhetFont( {
        size: 18
      } ),
      maxWidth: 70
    } );
    const readoutPanel = new Panel( readoutText, {
      cornerRadius: DensityBuoyancyCommonConstants.CORNER_RADIUS,
      xMargin: 4,
      yMargin: 4
    } );

    this.addChild( readoutPanel );

    // Keep it centered
    ManualConstraint.create( this, [ readoutPanel ], readoutWrapper => {
      readoutWrapper.center = Vector2.ZERO;
    } );

    showMassValuesProperty.link( shown => {
      readoutPanel.visible = shown;
    }, { disposer: this } );
    this.addDisposable( readoutPanel, readoutText, readoutStringProperty );
  }
}

densityBuoyancyCommon.register( 'MassLabelNode', MassLabelNode );