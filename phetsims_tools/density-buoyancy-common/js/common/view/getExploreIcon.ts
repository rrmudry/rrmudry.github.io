// Copyright 2024-2025, University of Colorado Boulder

/**
 * Shows the icon for the explore screen, which is a force diagram with gravity and buoyancy forces.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { combineOptions } from '../../../../phet-core/js/optionize.js';
import ArrowNode, { ArrowNodeOptions } from '../../../../scenery-phet/js/ArrowNode.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import DensityBuoyancyCommonColors from './DensityBuoyancyCommonColors.js';
import { arrowOptions } from './ForceDiagramNode.js';

const getExploreIcon = (): Node => {
  const arrowLength = 120;

  const arrowIconOptions = {
    tailWidth: arrowLength / 8,
    headWidth: arrowLength / 4,
    headHeight: arrowLength / 5
  };

  const gravityArrowNode = new ArrowNode( 0, 0, 0, arrowLength, combineOptions<ArrowNodeOptions>( {
    fill: DensityBuoyancyCommonColors.gravityForceProperty
  }, arrowOptions, arrowIconOptions ) );

  const buoyancyArrowNode = new ArrowNode( 0, 0, 0, arrowLength, combineOptions<ArrowNodeOptions>( {
    fill: DensityBuoyancyCommonColors.buoyancyForceProperty
  }, arrowOptions, arrowIconOptions ) );

  buoyancyArrowNode.setTip( 0, -arrowLength );
  gravityArrowNode.setTip( 0, arrowLength );
  return new VBox( {
    children: [
      buoyancyArrowNode,
      gravityArrowNode
    ]
  } );
};

export default getExploreIcon;