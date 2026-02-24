// Copyright 2024-2025, University of Colorado Boulder

/**
 * A containing Node for all decoration layers that are set on top of the THREE stage Node. This pattern was developed
 * because it is much easier to super-impose scenery content onto THREE graphics in an overlay, than it is to try to
 * re-render the scenery content into the THREE state. See https://github.com/phetsims/density-buoyancy-common/issues/112
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Node from '../../../../scenery/js/nodes/Node.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

export default class MassDecorationLayer extends Node {
  public readonly depthLinesLayer = new Node();
  public readonly massTagsLayer = new Node();

  public readonly forceDiagramLayer = new Node();
  public readonly massLabelLayer = new Node();
  public readonly scaleReadoutLayer = new Node();

  public constructor() {
    super();
    this.addChild( this.depthLinesLayer ); // Depth lines need to be behind everything else.
    this.addChild( this.massTagsLayer );
    this.addChild( this.massLabelLayer );
    this.addChild( this.forceDiagramLayer );
    this.addChild( this.scaleReadoutLayer );
  }
}

densityBuoyancyCommon.register( 'MassDecorationLayer', MassDecorationLayer );