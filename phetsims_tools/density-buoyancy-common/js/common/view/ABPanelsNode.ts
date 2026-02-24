// Copyright 2019-2025, University of Colorado Boulder

/**
 * A Panel with primary/secondary nodes, called A and B.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Node from '../../../../scenery/js/nodes/Node.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import MassTag from '../model/MassTag.js';
import MassTagNode from './MassTagNode.js';
import MultiSectionPanelsNode from './MultiSectionPanelsNode.js';

export default class ABPanelsNode extends MultiSectionPanelsNode {

  public constructor( nodeA: Node, nodeB: Node ) {
    super( [
      nodeA,
      nodeB
    ] );
  }

  /**
   * Returns a Node that displays the "primary mass" tag label.
   */
  public static getTagALabelNode(): Node {
    return new Node( {
      children: [ new MassTagNode( MassTag.OBJECT_A, 40 ) ],
      scale: 1.3
    } );
  }

  /**
   * Returns a Node that displays the "secondary mass" tag label.
   */
  public static getTagBLabelNode(): Node {
    return new Node( {
      children: [ new MassTagNode( MassTag.OBJECT_B, 40 ) ],
      scale: 1.3
    } );
  }
}

densityBuoyancyCommon.register( 'ABPanelsNode', ABPanelsNode );