// Copyright 2019-2025, University of Colorado Boulder

/**
 * Shows mass/volume controls for a primary and secondary mass, called A and B.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import Cuboid from '../model/Cuboid.js';
import ABPanelsNode from './ABPanelsNode.js';
import BlockControlNode, { BlockControlNodeOptions } from './BlockControlNode.js';
import DensityBuoyancyCommonColors from './DensityBuoyancyCommonColors.js';

export type ABControlsNodeOptions = BlockControlNodeOptions & { tandem: Tandem };

export default class ABControlsNode extends ABPanelsNode {

  // Controls for the primary and secondary masses. Public so they can be split up in the focus order,
  // see https://github.com/phetsims/density-buoyancy-common/issues/121
  public readonly controlANode: BlockControlNode;
  public readonly controlBNode: BlockControlNode;

  /**
   * @param blockA
   * @param blockB
   * @param popupLayer
   * @param blockControlNodeOptions - Applied to each BlockControlNode
   */
  public constructor( blockA: Cuboid, blockB: Cuboid, popupLayer: Node, blockControlNodeOptions: ABControlsNodeOptions ) {

    const tandem = blockControlNodeOptions.tandem;
    const omittedOptions = _.omit( blockControlNodeOptions, [ 'tandem' ] );

    const controlANode = new BlockControlNode( blockA, popupLayer, combineOptions<BlockControlNodeOptions>( {
      labelNode: ABPanelsNode.getTagALabelNode(),
      color: DensityBuoyancyCommonColors.tagAProperty,
      tandem: tandem.createTandem( 'blockAPanel' ),
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    }, omittedOptions ) );

    const controlBNode = new BlockControlNode( blockB, popupLayer, combineOptions<BlockControlNodeOptions>( {
      labelNode: ABPanelsNode.getTagBLabelNode(),
      color: DensityBuoyancyCommonColors.tagBProperty,
      tandem: tandem.createTandem( 'blockBPanel' ),
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    }, omittedOptions ) );

    super(
      new Node( {
        children: [ controlANode ],
        visibleProperty: DerivedProperty.and( [ blockA.visibleProperty, controlANode.visibleProperty ] )
      } ),
      new Node( {
        children: [ controlBNode ],
        visibleProperty: DerivedProperty.and( [ blockB.visibleProperty, controlBNode.visibleProperty ] )
      } )
    );

    this.controlANode = controlANode;
    this.controlBNode = controlBNode;
  }
}

densityBuoyancyCommon.register( 'ABControlsNode', ABControlsNode );