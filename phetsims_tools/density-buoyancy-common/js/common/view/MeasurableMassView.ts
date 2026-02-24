// Copyright 2024-2025, University of Colorado Boulder

/**
 * MeasurableMassView adds visual decorations such as the mass label and force diagram layer.
 *
 * Note the ScaleView is a sibling of this class, and does not show these decorations.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Matrix3 from '../../../../dot/js/Matrix3.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import { THREEModelViewTransform } from '../../../../mobius/js/MobiusScreenView.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import phetioStateSetEmitter from '../../../../tandem/js/phetioStateSetEmitter.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import DisplayProperties from '../../buoyancy/view/DisplayProperties.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import Mass from '../model/Mass.js';
import ForceDiagramNode from './ForceDiagramNode.js';
import MassDecorationLayer from './MassDecorationLayer.js';
import MassLabelNode from './MassLabelNode.js';
import MassView from './MassView.js';

const scratchVector2 = new Vector2( 0, 0 );

export default class MeasurableMassView extends MassView {

  private readonly forceDiagramNode: ForceDiagramNode;
  private readonly massLabelNode: MassLabelNode;

  protected constructor( mass: Mass, initialGeometry: THREE.BufferGeometry,
                         modelViewTransform: THREEModelViewTransform,
                         displayProperties: DisplayProperties,
                         interactionCueParentNode: Node,
                         isDisposable = true ) {

    super( mass, initialGeometry, modelViewTransform, interactionCueParentNode, isDisposable );

    this.forceDiagramNode = new ForceDiagramNode( mass, displayProperties );

    this.massLabelNode = new MassLabelNode( mass, displayProperties.massValuesVisibleProperty );

    // Update the decoration layer when phet-io state is set
    const updateDecorationLayer = () => this.updateDecorationLayer();
    if ( Tandem.PHET_IO_ENABLED ) {
      phetioStateSetEmitter.addListener( updateDecorationLayer );
      this.disposeEmitter.addListener( () => {
        phetioStateSetEmitter.removeListener( updateDecorationLayer );
      } );
    }

    updateDecorationLayer();
  }

  private updateDecorationLayer(): void {
    this.forceDiagramNode.update();

    // Reposition force diagram
    const modelOrigin = Vector3.from( this.mass.matrix.translation ).plus( this.mass.forceOffsetProperty.value );
    const viewOrigin = this.modelViewTransform.modelToViewPoint( modelOrigin );
    this.forceDiagramNode.matrix = Matrix3.rowMajor(
      1, 0, viewOrigin.x,
      0, 1, viewOrigin.y,
      0, 0, 1
    );

    // Reposition mass label
    const modelPoint = this.modelViewTransform.modelToViewPoint( Vector3.from( this.mass.matrix.translation ).plus( this.mass.massLabelOffsetProperty.value ) );
    const offsetPoint = scratchVector2.setXY( this.massLabelNode.width / 2, this.massLabelNode.height / 2 ).componentMultiply( this.mass.massLabelOffsetOrientationProperty.value );
    this.massLabelNode.translation = modelPoint.plus( offsetPoint );
  }

  public override step( dt: number ): void {
    this.updateDecorationLayer();
  }

  public override decorate( decorationLayer: MassDecorationLayer ): void {
    super.decorate( decorationLayer );

    decorationLayer.forceDiagramLayer.addChild( this.forceDiagramNode );
    decorationLayer.massLabelLayer.addChild( this.massLabelNode );
  }

  public override undecorate( decorationLayer: MassDecorationLayer ): void {
    super.undecorate( decorationLayer );

    decorationLayer.forceDiagramLayer.removeChild( this.forceDiagramNode );
    decorationLayer.massLabelLayer.removeChild( this.massLabelNode );
  }

  public override dispose(): void {
    super.dispose();

    // also removes from the parent
    this.forceDiagramNode.dispose();
    this.massLabelNode.dispose();
  }
}

densityBuoyancyCommon.register( 'MeasurableMassView', MeasurableMassView );