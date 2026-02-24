// Copyright 2024-2025, University of Colorado Boulder

/**
 * The 3D view for a Duck.
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Bounds3 from '../../../../../dot/js/Bounds3.js';
import Vector2 from '../../../../../dot/js/Vector2.js';
import Vector3 from '../../../../../dot/js/Vector3.js';
import { THREEModelViewTransform } from '../../../../../mobius/js/MobiusScreenView.js';
import Node from '../../../../../scenery/js/nodes/Node.js';
import MeasurableMassView from '../../../common/view/MeasurableMassView.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import Duck from '../../model/shapes/Duck.js';
import { duckGeometry } from '../../model/shapes/DuckData.js';
import DisplayProperties from '../DisplayProperties.js';

export default class DuckView extends MeasurableMassView {

  private readonly duckGeometry: THREE.BufferGeometry;
  private readonly updateListener: ( newSize: Bounds3 ) => void;

  public constructor( private readonly duck: Duck, modelViewTransform: THREEModelViewTransform, displayProperties: DisplayProperties, interactionCueParentNode: Node ) {

    const localDuckGeometry = duckGeometry.clone();

    super( duck, localDuckGeometry, modelViewTransform, displayProperties, interactionCueParentNode );

    this.duckGeometry = localDuckGeometry;

    const positionTag = () => {
      const size = duck.sizeProperty.value;
      const DUCK_TAG_OFFSET = new Vector2( 0.01, 0.03 );
      this.tagOffsetProperty.value = new Vector3( size.minX - DUCK_TAG_OFFSET.x, size.maxY + DUCK_TAG_OFFSET.y, size.maxZ );
    };
    positionTag();

    this.updateListener = ( newSize: Bounds3 ) => {
      positionTag();
      this.massMesh.scale.x = newSize.width;
      this.massMesh.scale.y = newSize.height;
      this.massMesh.scale.z = newSize.depth;
    };
    this.duck.sizeProperty.link( this.updateListener );

  }

  public override dispose(): void {
    this.duck.sizeProperty.unlink( this.updateListener );
    this.duckGeometry.dispose();

    super.dispose();
  }
}

densityBuoyancyCommon.register( 'DuckView', DuckView );