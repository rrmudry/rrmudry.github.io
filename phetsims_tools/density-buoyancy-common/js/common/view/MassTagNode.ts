// Copyright 2024-2025, University of Colorado Boulder

/**
 * The view code for the label for the name of the mass, often called the mass "tag" (see MassTag).
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import BackgroundNode from '../../../../scenery-phet/js/BackgroundNode.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import Color from '../../../../scenery/js/util/Color.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import { MASS_MIN_SHAPES_DIMENSION } from '../model/Mass.js';
import MassTag from '../model/MassTag.js';

// In model coordinates, the margin for the MassTagNode's placement from the top left of the mass.
export const TAG_OFFSET = MASS_MIN_SHAPES_DIMENSION / 20;

// Calculated by comparing the original label rectangle size when providing A/B tags
const horizontalMargin = 14;
const verticalMargin = 5;

// constants
const tagFont = new PhetFont( { size: 24, weight: 'bold' } );

export default class MassTagNode extends Node {

  public constructor( massTag: MassTag, maxTextWidth = 100 ) {

    assert && assert( massTag !== MassTag.NONE, 'MassTagNode must have a provided MassTag' );
    assert && assert( !massTag.nameProperty.isDisposed, 'do not dispose a nameProperty' );

    const visibleProperty = new DerivedProperty( [ massTag.nameProperty ], name => name.length > 0 );

    const label = new Text( massTag.nameProperty, {
      font: tagFont,
      maxWidth: maxTextWidth,
      visibleProperty: visibleProperty
    } );

    const colorListener = ( color: Color ) => {
      label.fill = Color.getLuminance( color ) > ( 255 / 2 ) ? 'black' : 'white'; // best guess?
    };
    massTag.colorProperty.link( colorListener );

    const backgroundNode = new BackgroundNode( label, {
      xMargin: horizontalMargin / 2,
      yMargin: verticalMargin / 2,
      rectangleOptions: {
        cornerRadius: DensityBuoyancyCommonConstants.CORNER_RADIUS,
        fill: massTag.colorProperty,
        opacity: 1
      },
      scale: 0.54 // To match the sizing when rendered as a THREE Quad.
    } );
    backgroundNode.leftTop = Vector2.ZERO;
    super( {
      children: [ backgroundNode ]
    } );
    this.disposeEmitter.addListener( () => {
      massTag.colorProperty.unlink( colorListener );
      label.dispose();
      visibleProperty.dispose();
      backgroundNode.dispose();
    } );
  }
}

densityBuoyancyCommon.register( 'MassTagNode', MassTagNode );