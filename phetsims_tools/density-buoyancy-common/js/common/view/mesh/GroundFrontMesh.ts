// Copyright 2024, University of Colorado Boulder

/**
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Bounds2 from '../../../../../dot/js/Bounds2.js';
import Bounds3 from '../../../../../dot/js/Bounds3.js';
import ThreeUtils from '../../../../../mobius/js/ThreeUtils.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonColors from '../DensityBuoyancyCommonColors.js';

export default class GroundFrontMesh extends THREE.Mesh {
  public constructor( poolBounds: Bounds3, groundBounds: Bounds3 ) {
    // Front ground
    const frontGeometry = new THREE.BufferGeometry();
    frontGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( [
      // Left side
      ...ThreeUtils.frontVertices( new Bounds2(
        groundBounds.minX, groundBounds.minY,
        poolBounds.minX, groundBounds.maxY
      ), groundBounds.maxZ ),

      // Right side
      ...ThreeUtils.frontVertices( new Bounds2(
        poolBounds.maxX, groundBounds.minY,
        groundBounds.maxX, groundBounds.maxY
      ), groundBounds.maxZ ),

      // Bottom
      ...ThreeUtils.frontVertices( new Bounds2(
        poolBounds.minX, groundBounds.minY,
        poolBounds.maxX, poolBounds.minY
      ), groundBounds.maxZ )
    ] ), 3 ) );
    const groundMaterial = new THREE.MeshBasicMaterial();
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    DensityBuoyancyCommonColors.groundProperty.link( groundColor => {
      groundMaterial.color = ThreeUtils.colorToThree( groundColor );
    } );

    super( frontGeometry, groundMaterial );
  }
}

densityBuoyancyCommon.register( 'GroundFrontMesh', GroundFrontMesh );