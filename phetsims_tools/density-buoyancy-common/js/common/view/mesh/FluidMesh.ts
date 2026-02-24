// Copyright 2024-2025, University of Colorado Boulder

/**
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { TReadOnlyProperty } from '../../../../../axon/js/TReadOnlyProperty.js';
import Bounds2 from '../../../../../dot/js/Bounds2.js';
import Bounds3 from '../../../../../dot/js/Bounds3.js';
import ThreeUtils from '../../../../../mobius/js/ThreeUtils.js';
import phetioStateSetEmitter from '../../../../../tandem/js/phetioStateSetEmitter.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import DensityBuoyancyModel from '../../model/DensityBuoyancyModel.js';
import MaterialProperty from '../../model/MaterialProperty.js';
import DensityBuoyancyScreenView from '../DensityBuoyancyScreenView.js';

export default class FluidMesh extends THREE.Mesh {
  public constructor( fluidMaterialProperty: MaterialProperty, fluidYInterpolatedProperty: TReadOnlyProperty<number>,
                      fillFluidGeometry: DensityBuoyancyScreenView<DensityBuoyancyModel>['fillFluidGeometry'] ) {

    const fluidGeometry = new THREE.BufferGeometry();
    const fluidPositionArray = FluidMesh.createFluidVertexArray();
    fluidGeometry.addAttribute( 'position', new THREE.BufferAttribute( fluidPositionArray, 3 ) );
    fluidGeometry.addAttribute( 'normal', new THREE.BufferAttribute( FluidMesh.createFluidNormalArray(), 3 ) );
    const fluidMaterial = new THREE.MeshLambertMaterial( {
      transparent: true,
      depthWrite: false
    } );

    fluidMaterialProperty.linkColorProperty( fluidMaterial );

    super( fluidGeometry, fluidMaterial );

    // boolean for optimization, to prevent zeroing out the remainder of the array if we have already done so
    let wasFilled = false;

    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    fluidYInterpolatedProperty.link( y => {
      wasFilled = fillFluidGeometry( y, fluidPositionArray, fluidGeometry, wasFilled );
    } );

    // To prevent PhET-iO state artifact reported in https://github.com/phetsims/density-buoyancy-common/issues/416
    phetioStateSetEmitter.addListener( () => {
      wasFilled = fillFluidGeometry( fluidYInterpolatedProperty.value, fluidPositionArray, fluidGeometry, wasFilled );
    } );
  }

  /**
   * Creates a coordinate float array to be used with fillFluidVertexArray, for three.js purposes.
   */
  private static createFluidVertexArray(): Float32Array {
    const CROSS_SECTION_SAMPLES = 30;
    return new Float32Array( ( CROSS_SECTION_SAMPLES + 1.5 ) * 3 * 3 * 4 );
  }

  /**
   * Creates a coordinate float array to be used with fillFluidVertexArray, for three.js purposes.
   */
  private static createFluidNormalArray(): Float32Array {
    const array = FluidMesh.createFluidVertexArray();

    for ( let i = 0; i < array.length / 3; i++ ) {

      // The first 6 normals should be 0,0,1 (front). After that, 0,1,0 (up)
      array[ i * 3 + ( i < 6 ? 2 : 1 ) ] = 1;
    }

    return array;
  }

  /**
   * Fills the positionArray with an X,Z cross-section of the fluid around a boat at a given y value (for a given liters
   * value).
   *
   * @returns - Whether the fluid is completely filled
   */
  public static fillFluidVertexArray( fluidY: number, boatX: number, boatY: number, liters: number, poolBounds: Bounds3, positionArray: Float32Array, wasFilled: boolean ): boolean {

    let index = 0;

    // Front
    index = ThreeUtils.writeFrontVertices( positionArray, index, new Bounds2(
      poolBounds.minX, poolBounds.minY,
      poolBounds.maxX, fluidY
    ), poolBounds.maxZ );

    // Top
    index = ThreeUtils.writeTopVertices( positionArray, index, new Bounds2(
      poolBounds.minX, poolBounds.minZ,
      poolBounds.maxX, poolBounds.maxZ
    ), fluidY );

    // If we were not filled before, we'll zero out the rest of the buffer
    if ( !wasFilled ) {
      positionArray.fill( 0, index );
    }

    return true;
  }
}

densityBuoyancyCommon.register( 'FluidMesh', FluidMesh );