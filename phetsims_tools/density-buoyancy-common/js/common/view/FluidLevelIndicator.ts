// Copyright 2019-2025, University of Colorado Boulder

/**
 * Shows the fluid level numerically next to the top-left of the pool's fluid. Lives for the lifetime of the sim.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import PatternStringProperty from '../../../../axon/js/PatternStringProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Shape from '../../../../kite/js/Shape.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import ManualConstraint from '../../../../scenery/js/layout/constraints/ManualConstraint.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Path from '../../../../scenery/js/nodes/Path.js';
import RichText from '../../../../scenery/js/nodes/RichText.js';
import Panel from '../../../../sun/js/Panel.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import DensityBuoyancyCommonColors from './DensityBuoyancyCommonColors.js';

export default class FluidLevelIndicator extends Node {

  // volume of the fluid, in liters
  public constructor( volumeProperty: TReadOnlyProperty<number> ) {
    super();

    const highlightShape = new Shape().moveTo( 0, 0 ).lineTo( -20, -10 ).lineTo( -20, 10 ).close();
    const highlightPath = new Path( highlightShape, {
      fill: DensityBuoyancyCommonColors.fluidIndicatorHighlightProperty
    } );
    this.addChild( highlightPath );

    const readoutText = new RichText( new PatternStringProperty( DensityBuoyancyCommonConstants.VOLUME_PATTERN_STRING_PROPERTY, {
      value: volumeProperty
    }, {
      decimalPlaces: 2
    } ), {
      font: new PhetFont( { size: 18 } ),
      maxWidth: 70
    } );

    const readoutPanel = new Panel( readoutText, {
      cornerRadius: DensityBuoyancyCommonConstants.CORNER_RADIUS
    } );
    this.addChild( readoutPanel );

    ManualConstraint.create( this, [ readoutPanel, highlightPath ], ( readoutWrapper, highlightWrapper ) => {
      readoutWrapper.rightCenter = highlightWrapper.leftCenter;
    } );
  }
}

densityBuoyancyCommon.register( 'FluidLevelIndicator', FluidLevelIndicator );