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

export default class GroundTopMesh extends THREE.Mesh {
  public constructor( poolBounds: Bounds3, groundBounds: Bounds3 ) {

    // Top ground
    const topGeometry = new THREE.BufferGeometry();
    topGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( [
      // Left side
      ...ThreeUtils.topVertices( new Bounds2(
        groundBounds.minX, poolBounds.minZ,
        poolBounds.minX, groundBounds.maxZ
      ), groundBounds.maxY ),

      // Right side
      ...ThreeUtils.topVertices( new Bounds2(
        poolBounds.maxX, poolBounds.minZ,
        groundBounds.maxX, groundBounds.maxZ
      ), groundBounds.maxY ),

      // Back side
      ...ThreeUtils.topVertices( new Bounds2(
        groundBounds.minX, groundBounds.minZ,
        groundBounds.maxX, poolBounds.minZ
      ), groundBounds.maxY )
    ] ), 3 ) );
    topGeometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( [
      // Left
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,

      // Right
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,

      // Back
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0
    ] ), 3 ) );
    const topColorArray = new Float32Array( [
      // Left
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,

      // Right
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,

      // Back
      1, 1, 0,
      1, 1, 0,
      0, 1, 1,
      0, 1, 1,
      1, 1, 0,
      0, 1, 1
    ] );
    topGeometry.addAttribute( 'color', new THREE.BufferAttribute( topColorArray, 3 ) );
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    DensityBuoyancyCommonColors.grassCloseProperty.link( grassCloseColor => {
      for ( let i = 0; i < 18; i++ ) {
        topColorArray[ i * 3 + 0 ] = grassCloseColor.r / 255;
        topColorArray[ i * 3 + 1 ] = grassCloseColor.g / 255;
        topColorArray[ i * 3 + 2 ] = grassCloseColor.b / 255;
      }
      const offset = 3 * 2 * 6;
      topColorArray[ offset + 0 ] = topColorArray[ offset + 3 ] = topColorArray[ offset + 9 ] = grassCloseColor.r / 255;
      topColorArray[ offset + 1 ] = topColorArray[ offset + 4 ] = topColorArray[ offset + 10 ] = grassCloseColor.g / 255;
      topColorArray[ offset + 2 ] = topColorArray[ offset + 5 ] = topColorArray[ offset + 11 ] = grassCloseColor.b / 255;
      topGeometry.attributes.color.needsUpdate = true;
    } );
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    DensityBuoyancyCommonColors.grassFarProperty.link( grassFarColor => {
      const offset = 3 * 2 * 6;
      topColorArray[ offset + 6 ] = topColorArray[ offset + 12 ] = topColorArray[ offset + 15 ] = grassFarColor.r / 255;
      topColorArray[ offset + 7 ] = topColorArray[ offset + 13 ] = topColorArray[ offset + 16 ] = grassFarColor.g / 255;
      topColorArray[ offset + 8 ] = topColorArray[ offset + 14 ] = topColorArray[ offset + 17 ] = grassFarColor.b / 255;
      topGeometry.attributes.color.needsUpdate = true;
    } );
    // @ts-expect-error - THREE.js version incompatibility?
    const topMaterial = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );
    super( topGeometry, topMaterial );
  }
}


densityBuoyancyCommon.register( 'GroundTopMesh', GroundTopMesh );