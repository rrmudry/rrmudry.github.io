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

export default class PoolMesh extends THREE.Mesh {
  public constructor( poolBounds: Bounds3 ) {

    // Pool interior
    const poolGeometry = new THREE.BufferGeometry();
    poolGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( [
      // Bottom
      ...ThreeUtils.topVertices( new Bounds2(
        poolBounds.minX, poolBounds.minZ,
        poolBounds.maxX, poolBounds.maxZ
      ), poolBounds.minY ),

      // Back
      ...ThreeUtils.frontVertices( new Bounds2(
        poolBounds.minX, poolBounds.minY,
        poolBounds.maxX, poolBounds.maxY
      ), poolBounds.minZ ),

      // Left
      ...ThreeUtils.rightVertices( new Bounds2(
        poolBounds.minZ, poolBounds.minY,
        poolBounds.maxZ, poolBounds.maxY
      ), poolBounds.minX ),

      // Right
      ...ThreeUtils.leftVertices( new Bounds2(
        poolBounds.minZ, poolBounds.minY,
        poolBounds.maxZ, poolBounds.maxY
      ), poolBounds.maxX )
    ] ), 3 ) );
    poolGeometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( [
      // Bottom
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,

      // Back
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,
      0, 0, 1,

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
    const poolMaterial = new THREE.MeshLambertMaterial();
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    DensityBuoyancyCommonColors.poolSurfaceProperty.link( poolSurfaceColor => {
      poolMaterial.color = ThreeUtils.colorToThree( poolSurfaceColor );
    } );

    super( poolGeometry, poolMaterial );
  }
}

densityBuoyancyCommon.register( 'PoolMesh', PoolMesh );