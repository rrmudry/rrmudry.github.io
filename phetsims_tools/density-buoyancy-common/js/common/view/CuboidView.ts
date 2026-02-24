// Copyright 2019-2025, University of Colorado Boulder

/**
 * The 3D view for a Cuboid.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Bounds3 from '../../../../dot/js/Bounds3.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import Shape from '../../../../kite/js/Shape.js';
import { THREEModelViewTransform } from '../../../../mobius/js/MobiusScreenView.js';
import TriangleArrayWriter from '../../../../mobius/js/TriangleArrayWriter.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Path from '../../../../scenery/js/nodes/Path.js';
import DisplayProperties from '../../buoyancy/view/DisplayProperties.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import Cuboid from '../model/Cuboid.js';
import Material from '../model/Material.js';
import MassDecorationLayer from './MassDecorationLayer.js';
import { TAG_OFFSET } from './MassTagNode.js';
import MeasurableMassView from './MeasurableMassView.js';

// constants
const numElements = 18 * 3;

const DEPTH_LINE_SECTIONS = 5;

export default class CuboidView extends MeasurableMassView {

  private readonly depthLinesNode: Path;

  public constructor( cuboid: Cuboid,
                      modelViewTransform: THREEModelViewTransform,
                      displayProperties: DisplayProperties,
                      interactionCueParentNode: Node ) {

    const size = cuboid.sizeProperty.value;

    const cuboidGeometry = CuboidView.getCuboidGeometry( size );

    super( cuboid, cuboidGeometry, modelViewTransform, displayProperties, interactionCueParentNode );

    const positionTag = () => {
      const size = cuboid.sizeProperty.value;
      this.tagOffsetProperty.value = new Vector3( size.minX + TAG_OFFSET, size.maxY - TAG_OFFSET, size.maxZ );
    };
    positionTag();

    this.depthLinesNode = new Path( new Shape(), {
      visibleProperty: displayProperties.depthLinesVisibleProperty,
      lineWidth: 2
    } );

    const updateDepthLines = () => {

      // No need to recompute if not showing depth lines
      if ( !displayProperties.depthLinesVisibleProperty.value ) {
        return;
      }

      const size = cuboid.sizeProperty.value;
      const shape = new Shape(); // New shape each time, sad.
      const modelHeight = size.height;

      const modelHeightPerSection = modelHeight / DEPTH_LINE_SECTIONS;

      for ( let i = 1; i < DEPTH_LINE_SECTIONS; i++ ) {
        const y = ( DEPTH_LINE_SECTIONS - i ) * modelHeightPerSection - modelHeight / 2;
        const asVector3 = Vector3.from( cuboid.matrix.translation );
        const viewLeft = modelViewTransform.modelToViewPoint( asVector3.plusXYZ( size.minX, y, size.maxZ ) );
        const viewRight = modelViewTransform.modelToViewPoint( asVector3.plusXYZ( size.maxX, y, size.maxZ ) );

        assert && assert( !viewLeft.equals( Vector2.ZERO ) );

        shape.moveTo( viewLeft.x, viewLeft.y );
        shape.lineTo( viewRight.x, viewRight.y );
      }

      this.depthLinesNode.shape = shape;
    };

    const updateListener = ( size: Bounds3 ) => {
      positionTag();
      CuboidView.updateArrays( cuboidGeometry.attributes.position.array as Float32Array, null, cuboidGeometry.attributes.uv.array as Float32Array, size );
      cuboidGeometry.attributes.position.needsUpdate = true;
      cuboidGeometry.attributes.uv.needsUpdate = true;
      cuboidGeometry.computeBoundingSphere();

      updateDepthLines();
    };
    cuboid.sizeProperty.lazyLink( updateListener );

    cuboid.transformedEmitter.addListener( updateDepthLines );
    displayProperties.depthLinesVisibleProperty.link( updateDepthLines );

    const materialListener = ( material: Material ) => {
      this.depthLinesNode.stroke = material.depthLinesColorProperty;
    };

    cuboid.materialProperty.link( materialListener );

    this.disposeEmitter.addListener( () => {
      this.depthLinesNode.dispose();
      cuboidGeometry.dispose();
      cuboid.transformedEmitter.removeListener( updateDepthLines );
      cuboid.sizeProperty.unlink( updateListener );
      displayProperties.depthLinesVisibleProperty.unlink( updateDepthLines );
      cuboid.materialProperty.unlink( materialListener );
    } );
  }

  public override decorate( massDecorationLayer: MassDecorationLayer ): void {
    super.decorate( massDecorationLayer );

    massDecorationLayer.depthLinesLayer.addChild( this.depthLinesNode );
  }

  /**
   * Updates provided geometry arrays given the specific size.
   *
   * @param positionArray
   * @param normalArray
   * @param uvArray
   * @param size
   * @param offset - How many vertices have been specified so far?
   * @param offsetPosition - How to transform all the points
   * @returns - The offset after the specified vertices have been written
   */
  public static updateArrays( positionArray: Float32Array | null, normalArray: Float32Array | null, uvArray: Float32Array | null, size: Bounds3, offset = 0, offsetPosition: Vector3 = Vector3.ZERO ): number {
    const writer = new TriangleArrayWriter( positionArray, normalArray, uvArray, offset, offsetPosition );

    function quad( p0x: number, p0y: number, p0z: number, p1x: number, p1y: number, p1z: number, p2x: number, p2y: number, p2z: number, p3x: number, p3y: number, p3z: number ): void {
      writer.position( p0x, p0y, p0z );
      writer.position( p1x, p1y, p1z );
      writer.position( p2x, p2y, p2z );

      writer.position( p0x, p0y, p0z );
      writer.position( p2x, p2y, p2z );
      writer.position( p3x, p3y, p3z );

      const du = 2.5 * ( Math.abs( p1x - p0x ) + Math.abs( p1y - p0y ) + Math.abs( p1z - p0z ) );
      const dv = 2.5 * ( Math.abs( p1x - p2x ) + Math.abs( p1y - p2y ) + Math.abs( p1z - p2z ) );
      const uMin = 0.5 - du;
      const uMax = 0.5 + du;
      const vMin = 0.5 - dv;
      const vMax = 0.5 + dv;

      writer.uv( uMax, vMin );
      writer.uv( uMin, vMin );
      writer.uv( uMin, vMax );

      writer.uv( uMax, vMin );
      writer.uv( uMin, vMax );
      writer.uv( uMax, vMax );
    }

    // Bottom
    quad(
      size.minX, size.minY, size.minZ,
      size.maxX, size.minY, size.minZ,
      size.maxX, size.minY, size.maxZ,
      size.minX, size.minY, size.maxZ
    );
    for ( let i = 0; i < 6; i++ ) { writer.normal( 0, -1, 0 ); }

    // Top
    quad(
      size.minX, size.maxY, size.minZ,
      size.minX, size.maxY, size.maxZ,
      size.maxX, size.maxY, size.maxZ,
      size.maxX, size.maxY, size.minZ
    );
    for ( let i = 0; i < 6; i++ ) { writer.normal( 0, 1, 0 ); }

    // Left
    quad(
      size.minX, size.minY, size.minZ,
      size.minX, size.minY, size.maxZ,
      size.minX, size.maxY, size.maxZ,
      size.minX, size.maxY, size.minZ
    );
    for ( let i = 0; i < 6; i++ ) { writer.normal( -1, 0, 0 ); }

    // Right
    quad(
      size.maxX, size.minY, size.minZ,
      size.maxX, size.maxY, size.minZ,
      size.maxX, size.maxY, size.maxZ,
      size.maxX, size.minY, size.maxZ
    );
    for ( let i = 0; i < 6; i++ ) { writer.normal( 1, 0, 0 ); }

    // Back
    quad(
      size.minX, size.minY, size.minZ,
      size.minX, size.maxY, size.minZ,
      size.maxX, size.maxY, size.minZ,
      size.maxX, size.minY, size.minZ
    );
    for ( let i = 0; i < 6; i++ ) { writer.normal( 0, 0, -1 ); }

    // Front
    quad(
      size.minX, size.minY, size.maxZ,
      size.maxX, size.minY, size.maxZ,
      size.maxX, size.maxY, size.maxZ,
      size.minX, size.maxY, size.maxZ
    );
    for ( let i = 0; i < 6; i++ ) { writer.normal( 0, 0, 1 ); }

    return writer.getOffset();
  }

  private static getCuboidGeometry( size: Bounds3 ): THREE.BufferGeometry {
    const positionArray = new Float32Array( numElements * 3 );
    const normalArray = new Float32Array( numElements * 3 );
    const uvArray = new Float32Array( numElements * 2 );

    CuboidView.updateArrays( positionArray, normalArray, uvArray, size );

    const cuboidGeometry = new THREE.BufferGeometry();
    cuboidGeometry.addAttribute( 'position', new THREE.BufferAttribute( positionArray, 3 ) );
    cuboidGeometry.addAttribute( 'normal', new THREE.BufferAttribute( normalArray, 3 ) );
    cuboidGeometry.addAttribute( 'uv', new THREE.BufferAttribute( uvArray, 2 ) );

    return cuboidGeometry;
  }
}

densityBuoyancyCommon.register( 'CuboidView', CuboidView );