// Copyright 2024-2025, University of Colorado Boulder

/**
 * BarrierMesh is a mesh that represents the invisible barrier in the simulation. It is used to prevent the user from
 * moving objects outside of the simulation area.
 *
 * It is only shown when DensityBuoyancyCommonQueryParameters.showBarrier is true.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { TReadOnlyProperty } from '../../../../../axon/js/TReadOnlyProperty.js';
import Bounds2 from '../../../../../dot/js/Bounds2.js';
import Bounds3 from '../../../../../dot/js/Bounds3.js';
import ThreeUtils from '../../../../../mobius/js/ThreeUtils.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';

export default class BarrierMesh extends THREE.Mesh {
  public constructor( invisibleBarrierBoundsProperty: TReadOnlyProperty<Bounds3> ) {
    const barrierGeometry = new THREE.BufferGeometry();
    const barrierPositionArray = new Float32Array( 18 * 2 );

    barrierGeometry.addAttribute( 'position', new THREE.BufferAttribute( barrierPositionArray, 3 ) );
    barrierGeometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( [
      // Left
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,
      1, 0, 0,

      // Right
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0,
      -1, 0, 0
    ] ), 3 ) );
    const barrierMaterial = new THREE.MeshLambertMaterial( {
      color: 0xff0000,
      transparent: true,
      opacity: 0.5
    } );

    // Only when showing the debug barrier, when the model-reported invisible barrier boundary changes, update the 3D
    // barrier geometry.
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    invisibleBarrierBoundsProperty.link( bounds => {
      let index = 0;
      const zyBounds = new Bounds2( bounds.minZ, bounds.minY, bounds.maxZ, bounds.maxY );
      index = ThreeUtils.writeRightVertices( barrierPositionArray, index, zyBounds, bounds.minX );
      ThreeUtils.writeLeftVertices( barrierPositionArray, index, zyBounds, bounds.maxX );

      barrierGeometry.attributes.position.needsUpdate = true;
      barrierGeometry.computeBoundingSphere();
    } );

    super( barrierGeometry, barrierMaterial );
  }
}

densityBuoyancyCommon.register( 'BarrierMesh', BarrierMesh );