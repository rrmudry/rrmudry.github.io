// Copyright 2020-2025, University of Colorado Boulder

/**
 * The main shape and mathematics for the boat's shape. Due to its variable size in the sim, we normalize it so that
 * we export a "one-liter" version (in maximum displacement) for the simulation to resize.
 *
 * Coordinate frames:
 *
 * Vertical:
 * - heightRatio: 0 (bottom) to 1 (top)
 * - Design: -BoatDesign.DESIGN_BOAT_HEIGHT (bottom) to 0 (top)
 *
 * At each height, we define 4 control points to determine a cubic Bézier curve for the shape of the cross-section of
 * the boat (both inside and outside).
 *
 * Additionally, we'll need to compute different "intersection" geometries for a given block size. It's possible to
 * compute a shape (for a given block size) such that in 2D it "acts" as the proper 3d shape. This is mainly due to
 * the block corners pressing against the inside of the boat's hull.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Bounds2 from '../../../../../dot/js/Bounds2.js';
import Bounds3 from '../../../../../dot/js/Bounds3.js';
import Utils from '../../../../../dot/js/Utils.js';
import Vector2 from '../../../../../dot/js/Vector2.js';
import Vector3 from '../../../../../dot/js/Vector3.js';
import Segment, { Cubic, Line } from '../../../../../kite/js/segments/Segment.js';
import ThreeUtils from '../../../../../mobius/js/ThreeUtils.js';
import Color from '../../../../../scenery/js/util/Color.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';

// constants
const CROSS_SECTION_SAMPLES = 30;

export default class BoatDesign {

  /**
   * Given a design y-value, returns the height ratio (0 being the bottom of the boat, 1 being the top)
   */
  private static getHeightRatioFromDesignY( y: number ): number {
    return Utils.linear( -BoatDesign.DESIGN_BOAT_HEIGHT, 0, 0, 1, y );
  }

  /**
   * Returns the control point net for a cubic Bézier curve for a given height ratio (0=top, 1=bottom) and whether it
   * is on the inside or outside surface of the boat.
   */
  private static getControlPoints( heightRatio: number, isInside: boolean ): [ Vector2, Vector2, Vector2, Vector2 ] {
    const v0 = new Vector2( 0, 0 );
    const v1 = new Vector2( 50, 50 );
    const v2 = new Vector2( 150, 50 );
    const v3 = new Vector2( 200, 40 );

    const ratio = Math.pow( heightRatio, 1 / 2 );
    const oppositeRatio = 1 - ratio;

    v0.x += 50 * oppositeRatio;
    v1.x += 60 * oppositeRatio;

    v1.y += -20 * oppositeRatio;
    v2.y += -15 * oppositeRatio;
    v3.y += -5 * oppositeRatio;

    if ( !isInside ) {
      v0.x += -( 1.4 + 0.5 * oppositeRatio ) * BoatDesign.DESIGN_WALL_THICKNESS;

      v1.x += -0.9 * BoatDesign.DESIGN_WALL_THICKNESS;
      v1.y += 0.9 * BoatDesign.DESIGN_WALL_THICKNESS;

      v2.y += BoatDesign.DESIGN_WALL_THICKNESS;

      v3.x += BoatDesign.DESIGN_WALL_THICKNESS;
      v3.y += ( 0.9 - 0.1 * ratio ) * BoatDesign.DESIGN_WALL_THICKNESS;
    }

    return [ v0, v1, v2, v3 ];
  }

  /**
   * Returns the XY model coordinates for intersection with a cuboid block with the given half-width.
   *
   * @param blockHalfWidth - in model coordinates
   * @param liters - the number of liters of the boat's displacement
   */
  public static getIntersectionVertices( blockHalfWidth: number, liters: number ): Vector2[] {

    const frontSamples = 30;
    const insideSamples = 40;

    const outsideBottomY = -BoatDesign.DESIGN_BOAT_HEIGHT;
    const scale = Math.pow( liters, 1 / 3 ) * BoatDesign.ONE_LITER_SCALE_MULTIPLIER;

    const insideBottomY = -BoatDesign.DESIGN_BOAT_HEIGHT + BoatDesign.DESIGN_WALL_THICKNESS;

    const outsideBottomPoints = BoatDesign.getControlPoints( 1, false );
    const outsideTopPoints = BoatDesign.getControlPoints( 0, false );
    const insideTopPoints = BoatDesign.getControlPoints( 1, true );
    const insideBottomPoints = BoatDesign.getControlPoints( BoatDesign.getHeightRatioFromDesignY( insideBottomY ), true );

    const points = [];

    if ( blockHalfWidth < insideTopPoints[ 3 ].y * scale ) {
      points.push( new Vector2( insideBottomPoints[ 3 ].x, insideBottomY ) );
    }
    points.push( new Vector2( insideTopPoints[ 3 ].x, 0 ) );
    points.push( new Vector2( outsideTopPoints[ 3 ].x, 0 ) );
    points.push( new Vector2( outsideBottomPoints[ 3 ].x, outsideBottomY ) );
    _.range( 0, frontSamples ).forEach( sample => {
      const y = outsideBottomY + BoatDesign.DESIGN_BOAT_HEIGHT * sample / ( frontSamples - 1 );
      const x = BoatDesign.getControlPoints( BoatDesign.getHeightRatioFromDesignY( y ), false )[ 0 ].x;
      points.push( new Vector2( x, y ) );
    } );

    const interiorPoints: Vector2[] = [];

    _.range( 0, insideSamples ).forEach( sample => {
      const y = ( -BoatDesign.DESIGN_BOAT_HEIGHT + BoatDesign.DESIGN_WALL_THICKNESS ) * sample / ( insideSamples - 1 );
      const controlPoints = BoatDesign.getControlPoints( BoatDesign.getHeightRatioFromDesignY( y ), true );

      const cubic = new phet.kite.Cubic( ...controlPoints );

      const p0 = controlPoints[ 0 ];
      const p1 = controlPoints[ 1 ];
      const p2 = controlPoints[ 2 ];
      const p3 = controlPoints[ 3 ];

      const a = -p0.y + 3 * p1.y - 3 * p2.y + p3.y;
      const b = 3 * p0.y - 6 * p1.y + 3 * p2.y;
      const c = -3 * p0.y + 3 * p1.y;
      const d = p0.y - blockHalfWidth / scale;

      const ts = phet.dot.Utils.solveCubicRootsReal( a, b, c, d );
      ts.forEach( ( t: number ) => {
        if ( t >= 0 && t <= 1 ) {
          const xz = cubic.positionAt( t );
          interiorPoints.push( new Vector2( xz.x, y ) );
        }
      } );
    } );

    const fullPoints = points.concat( _.sortBy( interiorPoints, point => point.x ) );
    return _.reverse( fullPoints.map( designPoint => Vector2.from( BoatDesign.designToModel( Vector3.from( designPoint ), liters ) ) ) );
  }

  /**
   * Returns the XY model coordinates for the interior cross-section of the boat (the section of air underneath the top)
   */
  public static getBasinOneLiterVertices(): Vector2[] {

    const insideBottomY = -BoatDesign.DESIGN_BOAT_HEIGHT + BoatDesign.DESIGN_WALL_THICKNESS;

    const insideTopPoints = BoatDesign.getControlPoints( 1, true );
    const insideBottomPoints = BoatDesign.getControlPoints( BoatDesign.getHeightRatioFromDesignY( insideBottomY ), true );

    const insideSamples = 20;
    const frontPoints = _.sortBy( _.range( 0, insideSamples ).map( sample => {
      const y = insideBottomY * sample / ( insideSamples - 1 );
      const controlPoints = BoatDesign.getControlPoints( BoatDesign.getHeightRatioFromDesignY( y ), true );

      return new Vector2( controlPoints[ 0 ].x, y );
    } ), point => point.x );

    return [
      ...frontPoints,
      new Vector2( insideBottomPoints[ 3 ].x, insideBottomY ),
      new Vector2( insideTopPoints[ 3 ].x, 0 )
    ].map( designPoint => Vector2.from( BoatDesign.designToModel( Vector3.from( designPoint ), 1 ) ) );
  }

  /**
   * Given a net of control points, this returns the segments necessary to describe the y-slice of a boat in the X,Z
   * plane.
   */
  private static getSegmentsFromControlPoints( points: Vector2[] ): Segment[] {
    assert && assert( points.length === 4 );

    const verticalFlip = ( p: Vector2 ) => p.componentTimes( new Vector2( 1, -1 ) );

    const flippedPoints = points.slice().reverse().map( verticalFlip );

    return [
      new Cubic( points[ 0 ], points[ 1 ], points[ 2 ], points[ 3 ] ),
      new Line( points[ 3 ], verticalFlip( points[ 3 ] ) ),
      new Cubic( flippedPoints[ 0 ], flippedPoints[ 1 ], flippedPoints[ 2 ], flippedPoints[ 3 ] )
    ];
  }

  /**
   * Returns the area contained in a given X,Z cross-section of the boat defined by the given control points.
   */
  private static getAreaFromControlPoints( points: Vector2[] ): number {
    return Math.abs( _.sum( BoatDesign.getSegmentsFromControlPoints( points ).map( segment => segment.getSignedAreaFragment() ) ) );
  }

  /**
   * Returns a discretized form of the cross-section defined by the control points.
   */
  private static getDiscretizationFromControlPoints( points: Vector2[], quantity: number ): Vector2[] {
    return _.flatten( BoatDesign.getSegmentsFromControlPoints( points ).map( segment => {
      return (
        segment instanceof Line ? [ 0 ] : _.range( 0, quantity ).map( n => n / quantity )
      ).map( t => segment.positionAt( t ) );
    } ) );
  }

  /**
   * Returns the model-space local coordinate for the boat, given a design-space point and number of liters.
   */
  private static designToModel( point: Vector3, liters = 1 ): Vector3 {
    const scale = Math.pow( liters, 1 / 3 ) * BoatDesign.ONE_LITER_SCALE_MULTIPLIER;
    return new Vector3(
      ( point.x - BoatDesign.DESIGN_CENTROID.x ) * scale,
      ( point.y - BoatDesign.DESIGN_CENTROID.y ) * scale,
      point.z * scale
    );
  }

  private static getScaleForLiters( liters: number ): number {
    return Math.pow( liters, 1 / 3 ) * BoatDesign.ONE_LITER_SCALE_MULTIPLIER;
  }

  private static getDesignY( boatY: number, scale: number ): number {
    return boatY / scale + BoatDesign.DESIGN_CENTROID.y;
  }

  public static shouldBoatFluidDisplayIfFull( boatY: number, liters: number ): boolean {
    const scale = BoatDesign.getScaleForLiters( liters );
    const designY = BoatDesign.getDesignY( boatY, scale );

    return designY <= 1e-3 && scale > 0;
  }

  /**
   * Fills the `positionArray` with vertices representing an X-Z cross-section of fluid around a boat at a specified Y
   * coordinate (fluidY) based on the given amount of fluid (liters). This function calculates whether the fluid
   * completely surrounds the boat at the specified fluid level.
   *
   * @param fluidY - The Y-coordinate representing the height of the fluid surface.
   * @param boatX - The X-coordinate position of the boat.
   * @param boatY - The Y-coordinate position of the boat.
   * @param liters - The amount of fluid (in liters) around the boat.
   * @param poolBounds - The bounds of the fluid pool, specified as a 3D boundary.
   * @param positionArray - The array to be filled with vertex positions representing the fluid cross-section.
   * @param wasFilled - A boolean indicating whether the array was previously filled.
   * @returns - A boolean indicating whether the fluid completely surrounds the boat (i.e., the fluid cross-section is fully filled).
   */
  public static fillFluidVertexArray(
    fluidY: number,
    boatX: number,
    boatY: number,
    liters: number,
    poolBounds: Bounds3,
    positionArray: Float32Array,
    wasFilled: boolean
  ): boolean {

    const outsideBottomY = -BoatDesign.DESIGN_BOAT_HEIGHT;
    const scale = BoatDesign.getScaleForLiters( liters );
    const designY = BoatDesign.getDesignY( boatY, scale );

    let index = 0;

    // Fill the front vertices of the fluid cross-section
    index = ThreeUtils.writeFrontVertices( positionArray, index, new Bounds2(
      poolBounds.minX, poolBounds.minY,
      poolBounds.maxX, fluidY
    ), poolBounds.maxZ );

    // Determine if the fluid fully surrounds the boat
    const isFilled = designY < outsideBottomY || designY > 1e-3 || scale === 0;

    // If we have a low enough value, just zero things out (won't show anything)
    if ( isFilled ) {

      // Fill the top vertices of the fluid cross-section if the fluid fully surrounds the boat
      index = ThreeUtils.writeTopVertices( positionArray, index, new Bounds2(
        poolBounds.minX, poolBounds.minZ,
        poolBounds.maxX, poolBounds.maxZ
      ), fluidY );
    }
    else {

      // Calculate control points for the boat's shape and scale them accordingly
      const controlPoints = BoatDesign.getControlPoints( BoatDesign.getHeightRatioFromDesignY( designY ), false );
      const cubic = new Cubic( ...controlPoints );

      const x0 = ( cubic.positionAt( 0 ).x - BoatDesign.DESIGN_CENTROID.x ) * scale + boatX;
      const x1 = ( cubic.positionAt( 1 ).x - BoatDesign.DESIGN_CENTROID.x ) * scale + boatX;

      // Fill the left and right top vertices of the fluid cross-section
      index = ThreeUtils.writeTopVertices( positionArray, index, new Bounds2(
        poolBounds.minX, poolBounds.minZ,
        x0, poolBounds.maxZ
      ), fluidY );

      // Right top
      index = ThreeUtils.writeTopVertices( positionArray, index, new Bounds2(
        x1, poolBounds.minZ,
        poolBounds.maxX, poolBounds.maxZ
      ), fluidY );

      // Fill the vertices around the boat's shape in the fluid cross-section
      for ( let i = 0; i < CROSS_SECTION_SAMPLES; i++ ) {
        const t0 = i / CROSS_SECTION_SAMPLES;
        const t1 = ( i + 1 ) / CROSS_SECTION_SAMPLES;

        // Generate positions for the current and next sample points along the boat's cross-section
        const p0 = cubic.positionAt( t0 );
        const p1 = cubic.positionAt( t1 );

        const p0x = ( p0.x - BoatDesign.DESIGN_CENTROID.x ) * scale + boatX;
        const p0z = p0.y * scale;
        const p1x = ( p1.x - BoatDesign.DESIGN_CENTROID.x ) * scale + boatX;
        const p1z = p1.y * scale;

        // Fill the quad vertices behind the boat
        index = ThreeUtils.writeQuad(
          positionArray, index,
          p0x, fluidY, poolBounds.minZ,
          p0x, fluidY, -p0z,
          p1x, fluidY, -p1z,
          p1x, fluidY, poolBounds.minZ
        );

        // Fill the quad vertices in front of the boat
        index = ThreeUtils.writeQuad(
          positionArray, index,
          p1x, fluidY, poolBounds.maxZ,
          p1x, fluidY, p1z,
          p0x, fluidY, p0z,
          p0x, fluidY, poolBounds.maxZ
        );
      }
    }

    // If we were not filled before, we'll zero out the rest of the buffer
    if ( !wasFilled || !isFilled ) {
      positionArray.fill( 0, index );
    }

    return isFilled;
  }

  /**
   * Creates a coordinate float array to be used with fillCrossSectionVertexArray, for three.js purposes.
   */
  public static createCrossSectionVertexArray(): Float32Array {
    return new Float32Array( CROSS_SECTION_SAMPLES * 3 * 3 * 2 );
  }

  /**
   * Fills the positionArray with an X,Z cross-section of the boat at a given y value (for a given liters value).
   */
  public static fillCrossSectionVertexArray( y: number, liters: number, positionArray: Float32Array ): void {
    const insideBottomY = -BoatDesign.DESIGN_BOAT_HEIGHT + BoatDesign.DESIGN_WALL_THICKNESS;
    const scale = BoatDesign.getScaleForLiters( liters );
    const designY = BoatDesign.getDesignY( y, scale );

    // If we have a low enough value, just zero things out (won't show anything)
    if ( designY < insideBottomY || scale === 0 ) {
      for ( let i = 0; i < positionArray.length; i++ ) {
        positionArray[ i ] = 0;
      }
      return;
    }

    const controlPoints = BoatDesign.getControlPoints( BoatDesign.getHeightRatioFromDesignY( designY ), true );
    const cubic = new Cubic( ...controlPoints );

    for ( let i = 0; i < CROSS_SECTION_SAMPLES; i++ ) {
      const t0 = i / CROSS_SECTION_SAMPLES;
      const t1 = ( i + 1 ) / CROSS_SECTION_SAMPLES;

      const p0 = cubic.positionAt( t0 );
      const p1 = cubic.positionAt( t1 );

      const p0x = ( p0.x - BoatDesign.DESIGN_CENTROID.x ) * scale;
      const p0z = p0.y * scale;
      const p1x = ( p1.x - BoatDesign.DESIGN_CENTROID.x ) * scale;
      const p1z = p1.y * scale;

      ThreeUtils.writeQuad(
        positionArray, 6 * 3 * i,
        p0x, y, p0z,
        p1x, y, p1z,
        p1x, y, -p1z,
        p0x, y, -p0z
      );
    }
  }

  /**
   * Returns the one-liter model-coordinate main geometry for the bulk of the boat.
   */
  public static getPrimaryGeometry( liters = 1, includeExterior = true, includeGunwale = true, includeInterior = true, invertNormals = false ): THREE.BufferGeometry {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const parametricSamples = 50;
    const heightSamples = 30;

    const getRows = ( isInside: boolean ): Vector3[][] => _.range( 0, heightSamples ).map( sample => {
      const designY = ( -BoatDesign.DESIGN_BOAT_HEIGHT + ( isInside ? BoatDesign.DESIGN_WALL_THICKNESS : 0 ) ) * sample / ( heightSamples - 1 );
      const controlPoints = BoatDesign.getControlPoints( BoatDesign.getHeightRatioFromDesignY( designY ), isInside );
      const cubic = new Cubic( ...controlPoints );
      return _.range( 0, parametricSamples ).map( pSample => {
        const t = pSample / ( parametricSamples - 1 );
        const point = cubic.positionAt( t );
        return BoatDesign.designToModel( new Vector3( point.x, designY, point.y ), liters );
      } );
    } );
    const exteriorRows = getRows( false );
    const interiorRows = getRows( true );

    const normalizeRows = ( rows: Vector3[][] ) => rows.map( ( row, i ) => row.map( ( position, j ) => {
      // these will be null if they are not available
      const west = j > 0 ? row[ j - 1 ].minus( position ) : null;
      const east = j < row.length - 1 ? row[ j + 1 ].minus( position ) : null;
      const north = i > 0 ? rows[ i - 1 ][ j ].minus( position ) : null;
      const south = i < rows.length - 1 ? rows[ i + 1 ][ j ].minus( position ) : null;

      const cumulativeNormal = new Vector3( 0, 0, 0 );
      north && east && cumulativeNormal.add( north.cross( east ).normalize() );
      east && south && cumulativeNormal.add( east.cross( south ).normalize() );
      south && west && cumulativeNormal.add( south.cross( west ).normalize() );
      west && north && cumulativeNormal.add( west.cross( north ).normalize() );
      cumulativeNormal.normalize();
      return cumulativeNormal;
    } ) );

    const writeFlat = ( frontCurve: Vector3[], backCurve: Vector3[], normal: Vector3 ) => {
      assert && assert( frontCurve.length === backCurve.length );

      for ( let i = 0; i < frontCurve.length - 1; i++ ) {

        // Positions for our quad
        const pA = backCurve[ i ];
        const pB = backCurve[ i + 1 ];
        const pC = frontCurve[ i ];
        const pD = frontCurve[ i + 1 ];

        // UV coordinates for each side
        const uL = i / ( frontCurve.length - 1 );
        const uR = ( i + 1 ) / ( frontCurve.length - 1 );
        const vL = 0;
        const vR = 1;

        positions.push(
          pA.x, pA.y, pA.z,
          pC.x, pC.y, pC.z,
          pB.x, pB.y, pB.z,
          pC.x, pC.y, pC.z,
          pD.x, pD.y, pD.z,
          pB.x, pB.y, pB.z
        );
        normals.push(
          normal.x, normal.y, normal.z,
          normal.x, normal.y, normal.z,
          normal.x, normal.y, normal.z,
          normal.x, normal.y, normal.z,
          normal.x, normal.y, normal.z,
          normal.x, normal.y, normal.z
        );
        uvs.push(
          uL, vL,
          uL, vL,
          uR, vR,
          uL, vL,
          uR, vR,
          uR, vR
        );
      }
    };

    const writeGrid = ( rows: Vector3[][], normalRows: Vector3[][], reverse: boolean ) => _.range( 0, rows.length - 1 ).forEach( i => _.range( 0, rows[ i ].length - 1 ).forEach( j => {

      // Positions for our quad
      const pA = rows[ i ][ j ];
      const pB = rows[ i + 1 ][ j ];
      const pC = rows[ i ][ j + 1 ];
      const pD = rows[ i + 1 ][ j + 1 ];

      // Normals for our quad
      const nA = normalRows[ i ][ j ];
      const nB = normalRows[ i + 1 ][ j ];
      const nC = normalRows[ i ][ j + 1 ];
      const nD = normalRows[ i + 1 ][ j + 1 ];

      // UV coordinates for each side
      const uL = j / ( rows[ i ].length - 1 );
      const uR = ( j + 1 ) / ( rows[ i ].length - 1 );
      const vL = i / ( rows.length - 1 );
      const vR = ( i + 1 ) / ( rows.length - 1 );

      if ( reverse ) {
        positions.push(
          pA.x, pA.y, pA.z,
          pB.x, pB.y, pB.z,
          pC.x, pC.y, pC.z,
          pC.x, pC.y, pC.z,
          pB.x, pB.y, pB.z,
          pD.x, pD.y, pD.z
        );
        normals.push(
          nA.x, nA.y, nA.z,
          nB.x, nB.y, nB.z,
          nC.x, nC.y, nC.z,
          nC.x, nC.y, nC.z,
          nB.x, nB.y, nB.z,
          nD.x, nD.y, nD.z
        );
        uvs.push(
          uL, vL,
          uR, vR,
          uL, vL,
          uL, vL,
          uR, vR,
          uR, vR
        );
      }
      else {
        positions.push(
          pA.x, pA.y, pA.z,
          pC.x, pC.y, pC.z,
          pB.x, pB.y, pB.z,
          pC.x, pC.y, pC.z,
          pD.x, pD.y, pD.z,
          pB.x, pB.y, pB.z
        );
        normals.push(
          nA.x, nA.y, nA.z,
          nC.x, nC.y, nC.z,
          nB.x, nB.y, nB.z,
          nC.x, nC.y, nC.z,
          nD.x, nD.y, nD.z,
          nB.x, nB.y, nB.z
        );
        uvs.push(
          uL, vL,
          uL, vL,
          uR, vR,
          uL, vL,
          uR, vR,
          uR, vR
        );
      }
    } ) );

    const flipZVector = new Vector3( 1, 1, -1 );
    const flipRow = ( row: Vector3[] ) => row.map( v => v.componentTimes( flipZVector ) );
    const negateRows = ( rows: Vector3[][] ) => rows.map( row => row.map( v => v.negated() ) );
    const flipRows = ( rows: Vector3[][] ) => rows.map( flipRow );

    const exteriorNormalRows = normalizeRows( exteriorRows );
    const interiorNormalRows = normalizeRows( interiorRows );

    // Z+ exterior side
    includeExterior && writeGrid( exteriorRows, negateRows( exteriorNormalRows ), true );

    // Z+ interior side
    includeInterior && writeGrid( interiorRows, interiorNormalRows, false );

    // Z- exterior side
    includeExterior && writeGrid( flipRows( exteriorRows ), flipRows( negateRows( exteriorNormalRows ) ), false );

    // Z- interior side
    includeInterior && writeGrid( flipRows( interiorRows ), flipRows( interiorNormalRows ), true );

    // Top of the boat bottom
    includeInterior && writeFlat( interiorRows[ interiorRows.length - 1 ], flipRow( interiorRows[ interiorRows.length - 1 ] ), new Vector3( 0, 1, 0 ) );

    // Bottom of the boat bottom
    includeExterior && writeFlat( flipRow( exteriorRows[ exteriorRows.length - 1 ] ), exteriorRows[ exteriorRows.length - 1 ], new Vector3( 0, -1, 0 ) );

    // Z+ gunwale
    includeGunwale && writeFlat( exteriorRows[ 0 ], interiorRows[ 0 ], new Vector3( 0, 1, 0 ) );

    // Z- gunwale
    includeGunwale && writeFlat( flipRow( interiorRows[ 0 ] ), flipRow( exteriorRows[ 0 ] ), new Vector3( 0, 1, 0 ) );

    // Stern gunwale
    const sternGunwaleRow = [
      interiorRows[ 0 ][ interiorRows[ 0 ].length - 1 ],
      exteriorRows[ 0 ][ exteriorRows[ 0 ].length - 1 ]
    ];
    includeGunwale && writeFlat( sternGunwaleRow, flipRow( sternGunwaleRow ), new Vector3( 0, 1, 0 ) );

    // Stern interior
    const sternInteriorRow = interiorRows.map( row => row[ row.length - 1 ] );
    includeInterior && writeFlat( flipRow( sternInteriorRow ), sternInteriorRow, new Vector3( -1, 0, 0 ) );

    // Stern exterior
    const sternExteriorRow = exteriorRows.map( row => row[ row.length - 1 ] );
    includeExterior && writeFlat( sternExteriorRow, flipRow( sternExteriorRow ), new Vector3( 1, 0, 0 ) );

    const boatGeometry = new THREE.BufferGeometry();
    boatGeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( positions ), 3 ) );
    boatGeometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( invertNormals ? normals.map( n => -n ) : normals ), 3 ) );
    boatGeometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvs ), 2 ) );
    return boatGeometry;
  }

  /**
   * Returns a string that should be placed below in BoatDesign.js.
   *
   * Run this by typing this in the console:
   * copy( phet.densityBuoyancyCommon.BoatDesign.computeBoatData() )
   */
  public static computeBoatData( samples = 1000 ): string {
    const desiredVolume = 0.001; // one liter

    const discretizationPoints = 1000;

    let externalAreaSum = 0;
    let areaSum = 0;
    let weightedCentroidSum = new Vector3( 0, 0, 0 );
    const sliceAreas: number[] = [];
    const externalSliceAreas: number[] = [];
    const internalSliceAreas: number[] = [];
    const designBounds = Bounds3.NOTHING;
    const designInteriorBottom = -BoatDesign.DESIGN_BOAT_HEIGHT + BoatDesign.DESIGN_WALL_THICKNESS;
    _.range( 0, samples ).forEach( i => {

      // unit area times the multiplier
      const y = ( i / ( samples - 1 ) - 1 ) * BoatDesign.DESIGN_BOAT_HEIGHT;
      const heightRatio = BoatDesign.getHeightRatioFromDesignY( y );
      const externalControlPoints = BoatDesign.getControlPoints( heightRatio, false );
      const internalControlPoints = BoatDesign.getControlPoints( heightRatio, true );
      const externalArea = BoatDesign.getAreaFromControlPoints( externalControlPoints );
      const internalArea = BoatDesign.getAreaFromControlPoints( internalControlPoints );
      const externalCentroid = Utils.centroidOfPolygon( BoatDesign.getDiscretizationFromControlPoints( externalControlPoints, discretizationPoints ) );
      const internalCentroid = Utils.centroidOfPolygon( BoatDesign.getDiscretizationFromControlPoints( internalControlPoints, discretizationPoints ) );

      externalControlPoints.forEach( point => {
        designBounds.addCoordinates( point.x, y, point.y );
        designBounds.addCoordinates( point.x, y, -point.y );
      } );

      const hasInside = y > designInteriorBottom;

      let area = externalArea;
      let weightedCentroid = externalCentroid.timesScalar( externalArea );

      if ( hasInside ) {
        area -= internalArea;
        weightedCentroid = weightedCentroid.minus( internalCentroid.timesScalar( internalArea ) );
      }

      sliceAreas.push( area );
      externalSliceAreas.push( externalArea );
      if ( hasInside ) {
        internalSliceAreas.push( internalArea );
      }
      else {
        internalSliceAreas.push( 0 );
      }

      areaSum += area;
      externalAreaSum += externalArea;

      weightedCentroidSum = weightedCentroidSum.plus( new Vector3( weightedCentroid.x, y * area, 0 ) );
    } );
    const displacedVolume = externalAreaSum / samples * BoatDesign.DESIGN_BOAT_HEIGHT;
    const actualVolume = areaSum / samples * BoatDesign.DESIGN_BOAT_HEIGHT;
    const oneLiterMultiplier = Math.pow( displacedVolume / desiredVolume, -1 / 3 );

    const centroid = weightedCentroidSum.timesScalar( 1 / areaSum );

    const oneLiterBounds = new Bounds3(
      ( designBounds.minX - centroid.x ) * oneLiterMultiplier,
      ( designBounds.minY - centroid.y ) * oneLiterMultiplier,
      ( designBounds.minZ - centroid.z ) * oneLiterMultiplier,
      ( designBounds.maxX - centroid.x ) * oneLiterMultiplier,
      ( designBounds.maxY - centroid.y ) * oneLiterMultiplier,
      ( designBounds.maxZ - centroid.z ) * oneLiterMultiplier
    );
    const oneLiterInteriorBottom = ( designInteriorBottom - centroid.y ) * oneLiterMultiplier;

    const oneLiterHeight = BoatDesign.DESIGN_BOAT_HEIGHT * oneLiterMultiplier;

    const oneLiterDisplacedAreas = externalSliceAreas.map( designArea => designArea * oneLiterMultiplier * oneLiterMultiplier );
    const oneLiterInternalAreas = internalSliceAreas.map( designArea => designArea * oneLiterMultiplier * oneLiterMultiplier );
    const oneLiterDisplacedCumulativeVolumes: number[] = [];
    const oneLiterInternalCumulativeVolumes: number[] = [];
    let cumulativeDisplacedArea = 0;
    oneLiterDisplacedAreas.forEach( area => {
      cumulativeDisplacedArea += area * oneLiterHeight / samples;
      oneLiterDisplacedCumulativeVolumes.push( cumulativeDisplacedArea );
    } );
    let cumulativeInternalArea = 0;
    oneLiterInternalAreas.forEach( area => {
      cumulativeInternalArea += area * oneLiterHeight / samples;
      oneLiterInternalCumulativeVolumes.push( cumulativeInternalArea );
    } );

    return `
// NOTE: machine generated by copy( phet.densityBuoyancyCommon.BoatDesign.computeBoatData() );
// If any parameters about the shape changes, this should be recomputed.

BoatDesign.ONE_LITER_SCALE_MULTIPLIER = ${oneLiterMultiplier};
BoatDesign.DESIGN_CENTROID = new Vector3( ${centroid.x}, ${centroid.y}, ${centroid.z} );
BoatDesign.DESIGN_HULL_VOLUME = ${actualVolume};
BoatDesign.ONE_LITER_DISPLACED_AREAS = [ ${oneLiterDisplacedAreas.join( ', ' )} ];
BoatDesign.ONE_LITER_DISPLACED_VOLUMES = [ ${oneLiterDisplacedCumulativeVolumes.join( ', ' )} ];
BoatDesign.ONE_LITER_INTERNAL_AREAS = [ ${oneLiterInternalAreas.join( ', ' )} ];
BoatDesign.ONE_LITER_INTERNAL_VOLUMES = [ ${oneLiterInternalCumulativeVolumes.join( ', ' )} ];
BoatDesign.ONE_LITER_BOUNDS = new Bounds3( ${oneLiterBounds.minX}, ${oneLiterBounds.minY}, ${oneLiterBounds.minZ}, ${oneLiterBounds.maxX}, ${oneLiterBounds.maxY}, ${oneLiterBounds.maxZ} );
BoatDesign.ONE_LITER_INTERIOR_BOTTOM = ${oneLiterInteriorBottom};
BoatDesign.ONE_LITER_HULL_VOLUME = BoatDesign.DESIGN_HULL_VOLUME * BoatDesign.ONE_LITER_SCALE_MULTIPLIER * BoatDesign.ONE_LITER_SCALE_MULTIPLIER * BoatDesign.ONE_LITER_SCALE_MULTIPLIER;
`;
  }

  /**
   * Replaces the main page with a debug view of the boat, for debugging various curves and properties.
   *
   * To show this, run the following command in the console:
   * phet.densityBuoyancyCommon.BoatDesign.getDebugCanvas()
   */
  public static getDebugCanvas(): HTMLCanvasElement {
    const canvas = document.createElement( 'canvas' );
    const context = canvas.getContext( '2d' )!;

    const width = 800;
    const height = 400;

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale( pixelRatio, pixelRatio );

    const scale = width / 210;

    const mapX = ( x: number ) => ( x + 5 ) * scale;
    const mapY = ( y: number ) => -y * scale + height / 2;

    const cubic = ( points: Vector2[] ) => {
      context.moveTo( mapX( points[ 0 ].x ), mapY( points[ 0 ].y ) );
      context.bezierCurveTo(
        mapX( points[ 1 ].x ), mapY( points[ 1 ].y ),
        mapX( points[ 2 ].x ), mapY( points[ 2 ].y ),
        mapX( points[ 3 ].x ), mapY( points[ 3 ].y )
      );
      context.moveTo( mapX( points[ 0 ].x ), mapY( -points[ 0 ].y ) );
      context.bezierCurveTo(
        mapX( points[ 1 ].x ), mapY( -points[ 1 ].y ),
        mapX( points[ 2 ].x ), mapY( -points[ 2 ].y ),
        mapX( points[ 3 ].x ), mapY( -points[ 3 ].y )
      );
    };

    const boatProfile = ( points: Vector2[] ) => {
      cubic( points );
      context.moveTo( mapX( points[ 3 ].x ), mapY( points[ 3 ].y ) );
      context.lineTo( mapX( points[ 3 ].x ), mapY( -points[ 3 ].y ) );
    };

    context.strokeStyle = 'red';
    context.beginPath();
    boatProfile( BoatDesign.getControlPoints( 1, false ) );
    context.stroke();

    context.strokeStyle = 'blue';
    context.beginPath();
    boatProfile( BoatDesign.getControlPoints( 1, true ) );
    context.stroke();

    context.strokeStyle = 'green';
    context.beginPath();
    boatProfile( BoatDesign.getControlPoints( 0, false ) );
    context.stroke();

    context.strokeStyle = 'magenta';
    context.beginPath();
    boatProfile( BoatDesign.getControlPoints( 0, true ) );
    context.stroke();

    const numSections = 20;
    _.range( 0, numSections ).forEach( i => {
      const ix = 1 - i / ( numSections - 1 );
      const z = 0.06 * ix;

      context.strokeStyle = Color.MAGENTA.blend( Color.ORANGE, ix ).toCSS();
      context.beginPath();
      BoatDesign.getIntersectionVertices( z, 1 ).forEach( ( point, index ) => {
        const method = index > 0 ? 'lineTo' : 'moveTo';
        context[ method ]( 600 + 1000 * point.x, 230 - 1000 * point.y );
      } );
      context.closePath();
      context.stroke();
    } );

    while ( document.body.childNodes[ 0 ] ) {
      document.body.removeChild( document.body.childNodes[ 0 ] );
    }
    document.body.appendChild( canvas );
    document.body.style.background = 'white';

    return canvas;
  }

  // NOTE: machine generated by copy( phet.densityBuoyancyCommon.BoatDesign.computeBoatData() );
  // If any parameters about the shape changes, this should be recomputed.

  private static readonly DESIGN_WALL_THICKNESS = 2.4;
  private static readonly DESIGN_BOAT_HEIGHT = 50;

  // Multiplying the design coordinates by this value will result in a boat whose displaced volume
  // is equal to one liter.
  private static readonly ONE_LITER_SCALE_MULTIPLIER = 0.0011606822810277906;

  // The centroid of the hull of the boat, in design coordinates
  private static readonly DESIGN_CENTROID = new Vector3( 127.01221454497677, -30.985933407134237, 0 );
  private static readonly DESIGN_HULL_VOLUME = 71060.28389217648;
  public static readonly ONE_LITER_DISPLACED_AREAS = [ 0.010980794549714533, 0.011241239130300758, 0.011350054196575645, 0.011433922467865116, 0.01150487732784159, 0.011567579806360967, 0.011624420363301432, 0.01167681904147897, 0.011725701077345939, 0.011771709142337015, 0.011815311161611948, 0.01185686038086956, 0.011896631236879469, 0.011934841974797779, 0.011971669546958066, 0.012007259787454786, 0.012041734573787027, 0.012075196999189528, 0.012107735192025426, 0.01213942519116667, 0.012170333147780375, 0.012200517036897642, 0.012230028005909999, 0.012258911449911663, 0.012287207878615888, 0.01231495362219163, 0.01234218141115773, 0.012368920856757604, 0.012395198851925573, 0.012421039908322358, 0.012446466441473646, 0.012471499013456813, 0.012496156540614098, 0.012520456472261911, 0.012544414945197707, 0.012568046917893974, 0.012591366287550832, 0.01261438599260992, 0.01263711810287746, 0.0126595738990393, 0.012681763943055294, 0.012703698140679924, 0.01272538579715958, 0.012746835666995178, 0.012768055998525115, 0.012789054573972754, 0.012809838745509797, 0.012830415467809672, 0.012850791327499528, 0.012870972569864629, 0.012890965123111957, 0.012910774620460403, 0.012930406420290742, 0.012949865624559761, 0.012969157095657907, 0.012988285471868232, 0.01300725518156591, 0.013026070456281617, 0.013044735342737776, 0.01306325371395486, 0.013081629279513946, 0.013099865595052617, 0.013117966071063114, 0.01313593398105433, 0.01315377246913302, 0.013171484557053916, 0.013189073150783581, 0.01320654104661831, 0.013223890936892621, 0.013241125415311281, 0.013258246981934799, 0.013275258047845524, 0.01329216093951901, 0.013308957902923049, 0.013325651107364889, 0.013342242649105234, 0.01335873455475609, 0.013375128784478097, 0.013391427234991538, 0.013407631742414206, 0.0134237440849381, 0.013439765985356, 0.013455699113448115, 0.013471545088238114, 0.013487305480127222, 0.013502981812914315, 0.013518575565709349, 0.013534088174746954, 0.013549521035106529, 0.01356487550234454, 0.013580152894044578, 0.013595354491290082, 0.013610481540064445, 0.013625535252582813, 0.0136405168085596, 0.01365542735641551, 0.013670268014427497, 0.01368503987182496, 0.013699743989835245, 0.01371438140268121, 0.013728953118533577, 0.013743460120420567, 0.013757903367097035, 0.013772283793875403, 0.013786602313420373, 0.013800859816509298, 0.013815057172760098, 0.013829195231328265, 0.013843274821574719, 0.013857296753705813, 0.013871261819387014, 0.013885170792331565, 0.013899024428865247, 0.013912823468468576, 0.013926568634297452, 0.013940260633683244, 0.013953900158613398, 0.013967487886193428, 0.013981024479091152, 0.013994510585964074, 0.014007946841870568, 0.014021333868665749, 0.014034672275382564, 0.014047962658598949, 0.014061205602791506, 0.014074401680676415, 0.014087551453538075, 0.01410065547154602, 0.01411371427406067, 0.014126728389928319, 0.01413969833776583, 0.014152624626235587, 0.014165507754310885, 0.014178348211532403, 0.014191146478255968, 0.014203903025892015, 0.01421661831713708, 0.01422929280619764, 0.01424192693900666, 0.01425452115343301, 0.014267075879484201, 0.01427959153950253, 0.014292068548355059, 0.014304507313617532, 0.014316908235752516, 0.014329271708282004, 0.014341598117954685, 0.014353887844907985, 0.014366141262825285, 0.014378358739088257, 0.014390540634924648, 0.01440268730555164, 0.014414799100314951, 0.01442687636282381, 0.014438919431081963, 0.014450928637614867, 0.014462904309593225, 0.014474846768952897, 0.014486756332511425, 0.014498633312081287, 0.014510478014579812, 0.014522290742136174, 0.014534071792195284, 0.01454582145761886, 0.014557540026783666, 0.01456922778367711, 0.014580885007990194, 0.014592511975207974, 0.014604108956697575, 0.014615676219793877, 0.014627214027882847, 0.014638722640482792, 0.014650202313323361, 0.014661653298422535, 0.014673075844161625, 0.014684470195358316, 0.014695836593337836, 0.014707175276002297, 0.014718486477898333, 0.014729770430282929, 0.014741027361187698, 0.014752257495481508, 0.014763461054931514, 0.014774638258262794, 0.014785789321216387, 0.01479691445660602, 0.01480801387437341, 0.014819087781642214, 0.014830136382770722, 0.014841159879403282, 0.014852158470520455, 0.01486313235248807, 0.014874081719105033, 0.014885006761650091, 0.014895907668927464, 0.014906784627311409, 0.014917637820789828, 0.014928467431006788, 0.014939273637304126, 0.014950056616762096, 0.014960816544239084, 0.014971553592410458, 0.014982267931806525, 0.014992959730849654, 0.01500362915589057, 0.015014276371243878, 0.015024901539222745, 0.015035504820172893, 0.015046086372505828, 0.01505664635273133, 0.015067184915489258, 0.01507770221358071, 0.015088198397998461, 0.015098673617956795, 0.01510912802092068, 0.01511956175263437, 0.01512997495714936, 0.015140367776851798, 0.015150740352489313, 0.01516109282319729, 0.0151714253265246, 0.015181737998458823, 0.015192030973450945, 0.01520230438443956, 0.015212558362874551, 0.015222793038740374, 0.015233008540578795, 0.015243204995511211, 0.015253382529260543, 0.015263541266172666, 0.015273681329237423, 0.015283802840109273, 0.015293905919127462, 0.015303990685335873, 0.015314057256502454, 0.01532410574913827, 0.015334136278516234, 0.015344148958689404, 0.015354143902509021, 0.015364121221642145, 0.015374081026588993, 0.01538402342669991, 0.015393948530192075, 0.015403856444165864, 0.015413747274620929, 0.015423621126471956, 0.015433478103564163, 0.015443318308688487, 0.015453141843596516, 0.015462948809015152, 0.01547273930466098, 0.015482513429254403, 0.015492271280533544, 0.015502012955267843, 0.015511738549271452, 0.015521448157416403, 0.015531141873645517, 0.015540819790985072, 0.015550482001557321, 0.015560128596592702, 0.015569759666441899, 0.015579375300587667, 0.01558897558765646, 0.01559856061542986, 0.015608130470855821, 0.01561768524005968, 0.01562722500835505, 0.01563674986025447, 0.015646259879479877, 0.015655755148972973, 0.01566523575090532, 0.015674701766688337, 0.0156841532769831, 0.015693590361709985, 0.015703013100058186, 0.015712421570494992, 0.015721815850775017, 0.01573119601794919, 0.015740562148373684, 0.015749914317718612, 0.01575925260097664, 0.01576857707247146, 0.015777887805866097, 0.015787184874171124, 0.015796468349752686, 0.01580573830434048, 0.01581499480903554, 0.015824237934317913, 0.015833467750054248, 0.015842684325505247, 0.015851887729332974, 0.01586107802960808, 0.015870255293816925, 0.015879419588868564, 0.015888570981101635, 0.01589770953629116, 0.0159068353196552, 0.01591594839586146, 0.015925048829033756, 0.015934136682758396, 0.015943212020090476, 0.015952274903560076, 0.015961325395178336, 0.015970363556443493, 0.015979389448346783, 0.015988403131378278, 0.01599740466553264, 0.01600639411031477, 0.016015371524745387, 0.01602433696736656, 0.016033290496247056, 0.01604223216898776, 0.016051162042726864, 0.016060080174145116, 0.016068986619470885, 0.016077881434485214, 0.016086764674526802, 0.016095636394496862, 0.016104496648864004, 0.016113345491668932, 0.016122182976529186, 0.016131009156643714, 0.0161398240847975, 0.016148627813365988, 0.01615742039431958, 0.016166201879227956, 0.01617497231926443, 0.016183731765210173, 0.016192480267458398, 0.016201217876018546, 0.01620994464052031, 0.016218660610217706, 0.016227365833992986, 0.01623606036036063, 0.016244744237471125, 0.01625341751311486, 0.01626208023472581, 0.01627073244938529, 0.016279374203825615, 0.01628800554443369, 0.016296626517254588, 0.016305237167995063, 0.016313837542027015, 0.01632242768439093, 0.01633100763979924, 0.016339577452639663, 0.016348137166978513, 0.016356686826563917, 0.016365226474829048, 0.01637375615489529, 0.016382275909575344, 0.01639078578137632, 0.01639928581250279, 0.0164077760448598, 0.01641625652005581, 0.016424727279405655, 0.016433188363933413, 0.01644163981437528, 0.016450081671182372, 0.01645851397452354, 0.016466936764288086, 0.0164753500800885, 0.01648375396126314, 0.01649214844687887, 0.016500533575733688, 0.016508909386359297, 0.016517275917023667, 0.016525633205733564, 0.016533981290237004, 0.016542320208025763, 0.016550649996337752, 0.016558970692159468, 0.016567282332228327, 0.016575584953035016, 0.016583878590825822, 0.016592163281604882, 0.016600439061136497, 0.016608705964947304, 0.01661696402832852, 0.016625213286338102, 0.01663345377380291, 0.016641685525320832, 0.01664990857526288, 0.01665812295777527, 0.016666328706781478, 0.016674525855984265, 0.016682714438867693, 0.016690894488699086, 0.016699066038531003, 0.016707229121203183, 0.01671538376934444, 0.016723530015374553, 0.016731667891506166, 0.0167397974297466, 0.0167479186618997, 0.01675603161956763, 0.01676413633415268, 0.016772232836859018, 0.016780321158694423, 0.016788401330472023, 0.016796473382812017, 0.016804537346143334, 0.016812593250705315, 0.01682064112654937, 0.016828681003540593, 0.01683671291135938, 0.016844736879503032, 0.01685275293728734, 0.016860761113848117, 0.01686876143814275, 0.016876753938951758, 0.016884738644880243, 0.01689271558435945, 0.01690068478564818, 0.016908646276834294, 0.016916600085836144, 0.016924546240403984, 0.016932484768121415, 0.016940415696406762, 0.01694833905251446, 0.016956254863536434, 0.01696416315640343, 0.016972063957886373, 0.01697995729459769, 0.016987843192992614, 0.016995721679370485, 0.01700359277987602, 0.01701145652050061, 0.01701931292708355, 0.017027162025313295, 0.017035003840728695, 0.017042838398720197, 0.017050665724531046, 0.017058485843258513, 0.01706629877985502, 0.017074104559129364, 0.017081903205747824, 0.01708969474423534, 0.017097479198976605, 0.017105256594217234, 0.017113026954064834, 0.01712079030249013, 0.017128546663328012, 0.01713629606027865, 0.017144038516908527, 0.01715177405665153, 0.01715950270280994, 0.017167224478555513, 0.01717493940693048, 0.01718264751084854, 0.01719034881309591, 0.017198043336332253, 0.01720573110309174, 0.01721341213578392, 0.017221086456694776, 0.017228754087987627, 0.01723641505170408, 0.01724406936976497, 0.017251717063971272, 0.017259358156005027, 0.017266992667430255, 0.017274620619693842, 0.017282242034126417, 0.01728985693194326, 0.017297465334245157, 0.017305067262019257, 0.01731266273613995, 0.017320251777369674, 0.017327834406359807, 0.01733541064365145, 0.01734298050967628, 0.017350544024757334, 0.017358101209109855, 0.017365652082842062, 0.017373196665955944, 0.01738073497834806, 0.017388267039810296, 0.01739579287003065, 0.017403312488593975, 0.017410825914982775, 0.017418333168577892, 0.017425834268659283, 0.017433329234406773, 0.01744081808490073, 0.017448300839122834, 0.01745577751595675, 0.017463248134188883, 0.017470712712509013, 0.017478171269511057, 0.017485623823693702, 0.017493070393461135, 0.017500510997123655, 0.017507945652898416, 0.01751537437891003, 0.01752279719319126, 0.01753021411368363, 0.017537625158238132, 0.01754503034461579, 0.017552429690488373, 0.017559823213438946, 0.017567210930962543, 0.01757459286046676, 0.017581969019272375, 0.01758933942461396, 0.017596704093640447, 0.017604063043415764, 0.017611416290919408, 0.017618763853047007, 0.017626105746610932, 0.017633441988340867, 0.01764077259488435, 0.017648097582807346, 0.017655416968594836, 0.01766273076865133, 0.017670038999301453, 0.01767734167679044, 0.017684638817284718, 0.01769193043687243, 0.01769921655156396, 0.017706497177292464, 0.01771377232991435, 0.017721042025209882, 0.017728306278883596, 0.017735565106564887, 0.01774281852380845, 0.017750066546094803, 0.01775730918883081, 0.0177645464673501, 0.017771778396913636, 0.017779004992710134, 0.017786226269856566, 0.017793442243398645, 0.01780065292831126, 0.01780785833949899, 0.0178150584917965, 0.017822253399969065, 0.017829443078712995, 0.017836627542656063, 0.017843806806358005, 0.01785098088431091, 0.017858149790939682, 0.017865313540602484, 0.017872472147591145, 0.01787962562613163, 0.017886773990384398, 0.01789391725444489, 0.017901055432343917, 0.017908188538048066, 0.01791531658546012, 0.017922439588419475, 0.01792955756070252, 0.017936670516023077, 0.01794377846803275, 0.017950881430321353, 0.017957979416417292, 0.017965072439787937, 0.017972160513840055, 0.017979243651920114, 0.017986321867314744, 0.017993395173251055, 0.018000463582897024, 0.018007527109361873, 0.018014585765696443, 0.018021639564893534, 0.018028688519888272, 0.018035732643558483, 0.018042771948725035, 0.01804980644815218, 0.018056836154547923, 0.01806386108056438, 0.018070881238798058, 0.018077896641790287, 0.018084907302027463, 0.018091913231941488, 0.018098914443909996, 0.018105910950256775, 0.018112902763252028, 0.018119889895112727, 0.01812687235800295, 0.018133850164034175, 0.018140823325265603, 0.018147791853704482, 0.018154755761306426, 0.018161715059975696, 0.01816866976156554, 0.018175619877878493, 0.01818256542066665, 0.018189506401632007, 0.018196442832426742, 0.01820337472465352, 0.018210302089865748, 0.018217224939567945, 0.018224143285215943, 0.01823105713821725, 0.018237966509931265, 0.01824487141166964, 0.018251771854696477, 0.018258667850228696, 0.018265559409436218, 0.018272446543442317, 0.01827932926332385, 0.018286207580111544, 0.018293081504790247, 0.01829995104829924, 0.018306816221532428, 0.01831367703533868, 0.01832053350052202, 0.018327385627841943, 0.018334233428013654, 0.018341076911708287, 0.018347916089553214, 0.018354750972132256, 0.018361581569985966, 0.018368407893611823, 0.018375229953464536, 0.01838204775995627, 0.01838886132345686, 0.01839567065429408, 0.01840247576275388, 0.01840927665908061, 0.018416073353477266, 0.01842286585610572, 0.018429654177086953, 0.018436438326501277, 0.018443218314388575, 0.01844999415074851, 0.018456765845540776, 0.018463533408685315, 0.0184702968500625, 0.018477056179513424, 0.018483811406840057, 0.018490562541805495, 0.018497309594134172, 0.018504052573512054, 0.0185107914895869, 0.018517526351968405, 0.018524257170228476, 0.018530983953901375, 0.018537706712484, 0.018544425455436022, 0.01855114019218012, 0.01855785093210219, 0.018564557684551525, 0.018571260458841037, 0.018577959264247438, 0.018584654110011433, 0.018591345005337934, 0.018598031959396247, 0.01860471498132026, 0.018611394080208614, 0.01861806926512495, 0.018624740545098033, 0.018631407929121997, 0.018638071426156474, 0.018644731045126817, 0.01865138679492429, 0.018658038684406207, 0.01866468672239616, 0.018671330917684158, 0.018677971279026862, 0.018684607815147695, 0.018691240534737037, 0.018697869446452457, 0.018704494558918813, 0.018711115880728442, 0.01871773342044138, 0.01872434718658546, 0.018730957187656532, 0.018737563432118597, 0.018744165928404027, 0.01875076468491365, 0.018757359710017, 0.018763951012052405, 0.01877053859932721, 0.018777122480117894, 0.01878370266267027, 0.01879027915519959, 0.018796851965890767, 0.01880342110289848, 0.01880998657434736, 0.018816548388332133, 0.01882310655291777, 0.018829661076139658, 0.018836211966003723, 0.01884275923048662, 0.018849302877535837, 0.01885584291506987, 0.01886237935097839, 0.018868912193122346, 0.018875441449334136, 0.018881967127417763, 0.018888489235148943, 0.018895007780275287, 0.01890152277051642, 0.018908034213564125, 0.018914542117082496, 0.018921046488708064, 0.018927547336049934, 0.018934044666689933, 0.018940538488182744, 0.01894702880805604, 0.01895351563381061, 0.01895999897292053, 0.018966478832833217, 0.018972955220969666, 0.0189794281447245, 0.018985897611466136, 0.018992363628536908, 0.018998826203253195, 0.019005285342905548, 0.019011741054758825, 0.01901819334605231, 0.019024642223999855, 0.019031087695789956, 0.019037529768585946, 0.019043968449526077, 0.019050403745723643, 0.01905683566426711, 0.01906326421222025, 0.019069689396622236, 0.01907611122448778, 0.019082529702807244, 0.019088944838546746, 0.01909535663864832, 0.01910176511002999, 0.019108170259585878, 0.019114572094186377, 0.01912097062067822, 0.0191273658458846, 0.019133757776605264, 0.019140146419616685, 0.019146531781672124, 0.01915291386950174, 0.019159292689812743, 0.01916566824928943, 0.01917204055459339, 0.01917840961236352, 0.01918477542921621, 0.019191138011745386, 0.019197497366522653, 0.019203853500097394, 0.01921020641899687, 0.01921655612972633, 0.019222902638769118, 0.01922924595258676, 0.019235586077619084, 0.019241923020284307, 0.019248256786979164, 0.01925458738407896, 0.019260914817937725, 0.019267239094888273, 0.019273560221242315, 0.019279878203290572, 0.019286193047302853, 0.01929250475952814, 0.019298813346194727, 0.019305118813510286, 0.019311421167661942, 0.019317720414816435, 0.019324016561120146, 0.01933030961269923, 0.019336599575659676, 0.01934288645608745, 0.019349170260048527, 0.019355450993589048, 0.019361728662735347, 0.019368003273494073, 0.0193742748318523, 0.019380543343777572, 0.019386808815218017, 0.019393071252102437, 0.019399330660340396, 0.019405587045822282, 0.019411840414419443, 0.019418090771984215, 0.019424338124350054, 0.01943058247733161, 0.01943682383672479, 0.01944306220830687, 0.01944929759783656, 0.019455530011054104, 0.019461759453681338, 0.019467985931421804, 0.01947420944996082, 0.01948043001496553, 0.01948664763208505, 0.01949286230695047, 0.019499074045175004, 0.019505282852354047, 0.019511488734065212, 0.019517691695868488, 0.019523891743306234, 0.01953008888190332, 0.01953628311716718, 0.019542474454587903, 0.01954866289963826, 0.019554848457773857, 0.01956103113443314, 0.019567210935037535, 0.01957338786499145, 0.019579561929682424, 0.019585733134481146, 0.019591901484741537, 0.01959806698580087, 0.019604229642979767, 0.019610389461582337, 0.01961654644689621, 0.019622700604192626, 0.01962885193872649, 0.019635000455736476, 0.019641146160445044, 0.019647289058058556, 0.01965342915376734, 0.01965956645274573, 0.019665700960152164, 0.019671832681129237, 0.01967796162080377, 0.019684087784286906, 0.01969021117667412, 0.01969633180304534, 0.019702449668464978, 0.01970856477798203, 0.019714677136630096, 0.0197207867494275, 0.019726893621377306, 0.01973299775746741, 0.0197390991626706, 0.01974519784194461, 0.019751293800232207, 0.019757387042461216, 0.019763477573544627, 0.019769565398380623, 0.019775650521852668, 0.01978173294882954, 0.019787812684165424, 0.019793889732699948, 0.019799964099258254, 0.019806035788651078, 0.019812104805674764, 0.019818171155111378, 0.01982423484172871, 0.019830295870280398, 0.01983635424550592, 0.019842409972130725, 0.01984846305486621, 0.019854513498409856, 0.019860561307445224, 0.019866606486642055, 0.01987264904065631, 0.019878688974130216, 0.01988472629169235, 0.019890760997957665, 0.019896793097527565, 0.019902822594989968, 0.019908849494919334, 0.019914873801876738, 0.019920895520409935, 0.019926914655053383, 0.01993293121032833, 0.01993894519074285, 0.019944956600791902, 0.019950965444957378, 0.019956971727708165, 0.019962975453500193, 0.01996897662677648, 0.019974975251967196, 0.01998097133348971, 0.019986964875748654, 0.019992955883135953, 0.019998944360030874, 0.0200049303108001, 0.020010913739797787, 0.02001689465136557, 0.02002287304983266, 0.02002884893951585, 0.02003482232471961, 0.020040793209736115, 0.020046761598845282, 0.020052727496314836, 0.02005869090640036, 0.020064651833345326, 0.020070610281381168, 0.020076566254727295, 0.020082519757591177, 0.020088470794168374, 0.020094419368642574, 0.02010036548518566, 0.020106309147957746, 0.020112250361107215, 0.020118189128770784, 0.020124125455073534, 0.020130059344128957, 0.020135990800039028, 0.020141919826894204, 0.020147846428773514, 0.020153770609744565, 0.02015969237386361, 0.0201656117251756, 0.0201715286677142, 0.020177443205501865, 0.020183355342549853, 0.02018926508285828, 0.020195172430416183, 0.020201077389201526, 0.020206979963181285, 0.020212880156311452, 0.020218777972537093, 0.0202246734157924, 0.020230566490000716, 0.020236457199074596, 0.020242345546915834, 0.020248231537415493, 0.02025411517445398, 0.020259996461901054, 0.020265875403615886, 0.020271752003447108, 0.020277626265232808, 0.020283498192800634, 0.02028936778996778, 0.02029523506054106, 0.02030110000831692, 0.02030696263708151, 0.020312822950610702, 0.020318680952670122, 0.02032453664701521, 0.02033039003739124, 0.020336241127533367, 0.02034208992116667, 0.020347936422006184, 0.020353780633756934, 0.020359622560113987, 0.02036546220476246, 0.020371299571377607, 0.020377134663624785, 0.02038296748515958, 0.02038879803962776, 0.020394626330665355, 0.020400452361898705, 0.020406276136944446, 0.0204120976594096, 0.02041791693289159, 0.020423733960978258, 0.020429548747247922, 0.020435361295269416, 0.0204411716086021, 0.020446979690795924, 0.02045278554539144, 0.02045858917591985, 0.020464390585903037, 0.02047018977885359, 0.020475986758274854, 0.02048178152766097, 0.020487574090496865, 0.020493364450258348, 0.020499152610412092, 0.020504938574415706, 0.020510722345717717, 0.020516503927757675, 0.020522283323966134, 0.02052806053776468, 0.020533835572566002, 0.020539608431773902, 0.020545379118783316, 0.020551147636980384, 0.020556913989742426, 0.020562678180438033, 0.020568440212427055, 0.02057420008906066, 0.020579957813681347, 0.020585713389622985, 0.02059146682021085, 0.020597218108761643, 0.020602967258583522, 0.020608714272976163, 0.020614459155230743, 0.02062020190862999, 0.020625942536448248, 0.02063168104195144, 0.020637417428397156, 0.020643151699034655, 0.020648883857104894, 0.020654613905840585, 0.020660341848466168, 0.02066606768819792, 0.020671791428243904, 0.02067751307180405, 0.02068323262207017, 0.020688950082225977, 0.02069466545544714, 0.02070037874490127, 0.020706089953747987, 0.020711799085138937, 0.020717506142217797, 0.020723211128120356, 0.020728914045974482, 0.02073461489890019, 0.020740313690009657, 0.02074601042240726, 0.02075170509918957, 0.020757397723445415 ];
  public static readonly ONE_LITER_DISPLACED_VOLUMES = [ 6.372606832730097e-7, 0.0000012896360370398267, 0.00000194832637677335, 0.0000026118839373281795, 0.000003279559300319384, 0.000003950873546100287, 0.000004625486483245417, 0.0000053031403312560445, 0.00000598363100491124, 0.000006666791715857411, 0.000007352482831363054, 0.00000804058521899784, 0.000008730995673026226, 0.000009423623653376952, 0.000010118388889250664, 0.000010815219573200478, 0.000011514050970832195, 0.000012214824330676156, 0.000012917486015714182, 0.000013621986801776659, 0.000014328281303718352, 0.00001503632750092359, 0.000015746086341070257, 0.000016457521406300316, 0.000017170598629701043, 0.000017885286052748883, 0.00001860155361640695, 0.00001931937298010063, 0.00002003871736396293, 0.00002075956141063937, 0.000021481881063640645, 0.00002220565345977939, 0.000022930856833661405, 0.00002365747043254811, 0.00002438547444018567, 0.000025114849908421944, 0.00002584557869561649, 0.000026577643410999863, 0.00002731102736426313, 0.00002804571451976197, 0.000028781689454806043, 0.000029518937321576686, 0.000030257443812276977, 0.00003099719512716969, 0.00003173817794520263, 0.000032480379396958004, 0.000033223787039694827, 0.000033968388834280404, 0.00003471417312383112, 0.00003546112861390295, 0.000036209244354090115, 0.0000369585097209057, 0.00003770891440183168, 0.00003846044838043755, 0.00003921310192247735, 0.000039966865562883754, 0.00004072173009358628, 0.00004147768655208756, 0.0000422347262107382, 0.00004299284056665609, 0.000043752021332241404, 0.00004451226042624256, 0.000045273549965332896, 0.000046035882256160925, 0.000046799249787840616, 0.0000475636452248508, 0.000048329061400315494, 0.0000490954913096393, 0.00004986292810447406, 0.00005063136508699498, 0.00005140079570446608, 0.00005217121354407637, 0.00005294261232802984, 0.00005371498590887322, 0.00005448832826504706, 0.000055262633496646546, 0.0000560378958213795, 0.00005681410957070992, 0.000057591269186176304, 0.0000583693692158746, 0.00005914840431109656, 0.000059928369223114694, 0.000060709258800105726, 0.00006149106798420497, 0.00006227379180868461, 0.00006305742539524911, 0.00006384196395144182, 0.00006462740276815665, 0.00006541373721724972, 0.00006620096274924569, 0.00006698907489113398, 0.00006777806924425058, 0.00006856794148224101, 0.00006935868734910063, 0.00007015030265728847, 0.00007094278328591115, 0.0000717361251789735, 0.00007253032434369281, 0.00007332537684887376, 0.00007412127882334121, 0.00007491802645442837, 0.00007571561598651759, 0.0000765140437196317, 0.00007731330600807356, 0.00007811339925911175, 0.00007891431993171029, 0.00007971606453530071, 0.00008051862962859455, 0.00008132201181843454, 0.00008212620775868305, 0.00008293121414914604, 0.00008373702773453124, 0.00008454364530343905, 0.00008535106368738501, 0.00008615927975985234, 0.00008696829043537361, 0.00008777809266864028, 0.00008858868345363903, 0.00008940005982281388, 0.00009021221884625309, 0.00009102515763090001, 0.00009183887331978676, 0.0000926533630912902, 0.00009346862415840899, 0.00009428465376806144, 0.00009510144920040288, 0.00009591900776816232, 0.00009673732681599738, 0.00009755640371986694, 0.00009837623588642104, 0.00009919682075240719, 0.00010001815578409265, 0.00010084023847670216, 0.00010166306635387055, 0.00010248663696710963, 0.00010331094789528911, 0.00010413599674413092, 0.00010496178114571642, 0.00010578829875800629, 0.00010661554726437257, 0.00010744352437314238, 0.00010827222781715313, 0.00010910165535331865, 0.00010993180476220607, 0.00011076267384762301, 0.0001115942604362148, 0.00011242656237707138, 0.00011325957754134363, 0.00011409330382186881, 0.00011492773913280485, 0.00011576288140927323, 0.0001165987286070101, 0.00011743527870202565, 0.00011827252969027106, 0.0001191104795873133, 0.00011994912642801714, 0.0001207884682662344, 0.0001216285031745002, 0.00012246922924373586, 0.00012331064458295847, 0.00012415274731899677, 0.00012499553559621333, 0.00012583900757623268, 0.0001266831614376753, 0.00012752799537589732, 0.0001283735076027359, 0.00012921969634625979, 0.00013006655985052528, 0.0001309140963753372, 0.0001317623041960149, 0.00013261118160316313, 0.00013346072690244756, 0.00013431093841437491, 0.0001351618144740775, 0.00013601335343110227, 0.00013686555364920391, 0.00013771841350614228, 0.00013857193139348356, 0.00013942610571640574, 0.00014028093489350756, 0.0001411364173566214, 0.00014199255155062962, 0.00014284933593328476, 0.0001437067689750328, 0.00014456484915884008, 0.0001454235749800234, 0.00014628294494608337, 0.00014714295757654075, 0.00014800361140277613, 0.00014886490496787233, 0.00014972683682645983, 0.00015058940554456502, 0.00015145260969946125, 0.00015231644787952256, 0.00015318091868408006, 0.00015404602072328094, 0.00015491175261794998, 0.0001557781129994535, 0.00015664510050956572, 0.0001575127138003376, 0.0001583809515339679, 0.00015924981238267633, 0.00016011929502857927, 0.0001609893981635673, 0.000161860120489185, 0.00016273146071651287, 0.00016360341756605103, 0.00016447598976760517, 0.00016534917606017422, 0.00016622297519184006, 0.00016709738591965894, 0.00016797240700955479, 0.00016884803723621423, 0.00016972427538298343, 0.0001706011202417666, 0.000171478570612926, 0.00017235662530518388, 0.00017323528313552568, 0.00017411454292910503, 0.00017499440351915015, 0.00017587486374687181, 0.00017675592246137268, 0.00017763757851955818, 0.00017851983078604868, 0.00017940267813309316, 0.00018028611944048413, 0.00018117015359547388, 0.0001820547794926921, 0.00018293999603406468, 0.00018382580212873383, 0.00018471219669297938, 0.00018559917865014123, 0.00018648674693054308, 0.00018737490047141726, 0.00018826363821683063, 0.0001891529591176117, 0.00019004286213127866, 0.00019093334622196875, 0.0001918244103603684, 0.00019271605352364456, 0.00019360827469537694, 0.00019450107286549128, 0.00019539444703019367, 0.00019628839619190562, 0.00019718291935920027, 0.00019807801554673938, 0.00019897368377521125, 0.0001998699230712696, 0.00020076673246747318, 0.00020166411100222637, 0.00020256205771972049, 0.000203460571669876, 0.00020435965190828553, 0.00020525929749615765, 0.0002061595075002614, 0.00020706028099287164, 0.00020796161705171509, 0.0002088635147599172, 0.00020976597320594966, 0.0002106689914835786, 0.00021157256869181362, 0.00021247670393485733, 0.00021338139632205572, 0.0002142866449678491, 0.00021519244899172372, 0.00021609880751816403, 0.00021700571967660565, 0.0002179131846013887, 0.00021882120143171211, 0.00021972976931158825, 0.0002206388873897982, 0.0002215485548198477, 0.00022245877075992363, 0.0002233695343728509, 0.00022428084482605014, 0.00022519270129149575, 0.00022610510294567457, 0.000227018048969545, 0.00022793153854849672, 0.0002288455708723108, 0.00022976014513512055, 0.00023067526053537247, 0.00023159091627578812, 0.00023250711156332614, 0.00023342384560914484, 0.00023434111762856536, 0.00023525892684103506, 0.00023617727247009159, 0.00023709615374332724, 0.00023801556989235377, 0.00023893552015276772, 0.000239856003764116, 0.00024077701996986202, 0.00024169856801735227, 0.00024262064715778312, 0.0002435432566461681, 0.00024446639574130565, 0.0002453900637057471, 0.0002463142598057652, 0.0002472389833113228, 0.00024816423349604226, 0.00024909000963717456, 0.0002500163110155697, 0.00025094313691564646, 0.0002518704866253634, 0.0002527983594361894, 0.00025372675464307515, 0.0002546556715444246, 0.0002555851094420671, 0.0002565150676412291, 0.0002574455454505074, 0.0002583765421818413, 0.00025930805715048625, 0.00026024008967498707, 0.0002611726390771517, 0.00026210570468202535, 0.0002630392858178647, 0.00026397338181611266, 0.00026490799201137305, 0.000265843115741386, 0.0002667787523470033, 0.00026771490117216397, 0.00026865156156387045, 0.0002695887328721648, 0.000270526414450105, 0.00027146460565374185, 0.0002724033058420961, 0.00027334251437713544, 0.000274282230623752, 0.0002752224539497403, 0.000276163183725775, 0.00027710441932538916, 0.00027804616012495274, 0.00027898840550365114, 0.0002799311548434642, 0.00028087440752914516, 0.0002818181629482001, 0.0002827624204908674, 0.00028370717955009746, 0.0002846524395215328, 0.00028559819980348807, 0.00028654445979693047, 0.0002874912189054603, 0.00028843847653529177, 0.00028938623209523397, 0.00029033448499667195, 0.00029128323465354815, 0.0002922324804823438, 0.00029318222190206087, 0.0002941324583342037, 0.00029508318920276133, 0.00029603441393418964, 0.00029698613195739375, 0.0002979383427037108, 0.0002988910456068926, 0.00029984424010308857, 0.00030079792563082904, 0.00030175210163100837, 0.00030270676754686843, 0.0003036619228239823, 0.000304617566910238, 0.00030557369925582247, 0.00030653031931320544, 0.00030748742653712404, 0.00030844502038456694, 0.000309403100314759, 0.0003103616657891458, 0.00031132071627137876, 0.00031228025122729993, 0.0003132402701249271, 0.0003142007724344392, 0.0003151617576281616, 0.0003161232251805517, 0.0003170851745681846, 0.00031804760526973896, 0.0003190105167659829, 0.00031997390853976006, 0.0003209377800759758, 0.00032190213086158366, 0.0003228669603855717, 0.00032383226813894906, 0.0003247980536147329, 0.0003257643163079349, 0.0003267310557155485, 0.00032769827133653583, 0.0003286659626718149, 0.0003296341292242469, 0.00033060277049862377, 0.0003315718860016556, 0.0003325414752419582, 0.0003335115377300411, 0.00033448207297829516, 0.0003354530805009808, 0.00033642455981421586, 0.00033739651043596396, 0.00033836893188602264, 0.00033934182368601187, 0.0003403151853593626, 0.00034128901643130526, 0.00034226331642885836, 0.0003432380848808176, 0.0003442133213177445, 0.00034518902527195557, 0.00034616519627751123, 0.0003471418338702052, 0.0003481189375875535, 0.00034909650696878425, 0.00035007454155482667, 0.000351053040888301, 0.00035203200451350785, 0.0003530114319764182, 0.0003539913228246631, 0.0003549716766075235, 0.0003559524928759204, 0.0003569337711824048, 0.000357915511081148, 0.0003588977121279316, 0.0003598803738801382, 0.0003608634958967414, 0.0003618470777382967, 0.0003628311189669316, 0.0003638156191463367, 0.0003648005778417562, 0.0003657859946199786, 0.00036677186904932784, 0.0003677582006996541, 0.0003687449891423248, 0.0003697322339502158, 0.00037071993469770247, 0.000371708090960651, 0.0003726967023164097, 0.00037368576834380043, 0.00037467528862311, 0.00037566526273608166, 0.00037665569026590687, 0.0003776465707972167, 0.00037863790391607385, 0.00037962968920996425, 0.0003806219262677889, 0.000381614614679856, 0.0003826077540378727, 0.00038360134393493735, 0.00038459538396553146, 0.00038558987372551206, 0.00038658481281210374, 0.0003875802008238911, 0.0003885760373608111, 0.0003895723220241454, 0.0003905690544165129, 0.00039156623414186235, 0.00039256386080546474, 0.0003935619340139062, 0.00039456045337508055, 0.0003955594184981822, 0.00039655882899369886, 0.0003975586844734045, 0.0003985589845503522, 0.0003995597288388672, 0.00040056091695454, 0.0004015625485142194, 0.0004025646231360055, 0.0004035671404392433, 0.0004045701000445155, 0.00040557350157363614, 0.00040657734464964366, 0.0004075816288967946, 0.000408586353940557, 0.0004095915194076036, 0.0004105971249258059, 0.00041160317012422723, 0.0004126096546331168, 0.00041361657808390323, 0.0004146239401091883, 0.0004156317403427407, 0.00041663997841949, 0.00041764865397552045, 0.0004186577666480648, 0.00041966731607549854, 0.0004206773018973336, 0.00042168772375421256, 0.0004226985812879029, 0.0004237098741412909, 0.0004247216019583759, 0.00042573376438426457, 0.00042674636106516516, 0.00042775939164838185, 0.00042877285578230907, 0.00042978675311642587, 0.00043080108330129037, 0.0004318158459885343, 0.0004328310408308574, 0.00043384666748202207, 0.0004348627255968479, 0.00043587921483120634, 0.00043689613484201536, 0.0004379134852872342, 0.0004389312658258579, 0.00043994947611791243, 0.00044096811582444923, 0.00044198718460754016, 0.0004430066821302725, 0.00044402660805674355, 0.000445046962052056, 0.0004460677437823127, 0.00044708895291461153, 0.00044811058911704095, 0.00044913265205867467, 0.0004501551414095669, 0.00045117805684074755, 0.0004522013980242175, 0.00045322516463294364, 0.00045424935634085433, 0.0004552739728228346, 0.0004562990137547215, 0.00045732447881329945, 0.00045835036767629566, 0.0004593766800223756, 0.0004604034155311383, 0.000461430573883112, 0.0004624581547597496, 0.00046348615784342424, 0.00046451458281742477, 0.00046554342936595144, 0.0004665726971741117, 0.0004676023859279155, 0.00046863249531427134, 0.00046966302502098175, 0.00047069397473673913, 0.00047172534415112165, 0.0004727571329545888, 0.0004737893408384775, 0.00047482196749499774, 0.00047585501261722857, 0.000476888475899114, 0.0004779223570354591, 0.0004789566557219257, 0.0004799913716550285, 0.00048102650453213115, 0.0004820620540514423, 0.0004830980199120116, 0.0004841344018137258, 0.00048517119945730495, 0.00048620841254429855, 0.0004872460407770816, 0.000488284083858851, 0.0004893225414936216, 0.0004903614133862224, 0.0004914006992422933, 0.0004924403987682807, 0.0004934805116714342, 0.000494521037659803, 0.000495561976442232, 0.0004966033277283587, 0.000497645091228609, 0.0004986872666541939, 0.000499729853717106, 0.0005007728521301161, 0.0005018162616067693, 0.0005028600818613821, 0.0005039043126090383, 0.000504948953565586, 0.0005059940044476343, 0.0005070394649725492, 0.0005080853348584513, 0.0005091316138242115, 0.0005101783015894482, 0.0005112253978745237, 0.0005122729024005413, 0.0005133208148893415, 0.0005143691350634994, 0.0005154178626463209, 0.0005164669973618399, 0.0005175165389348145, 0.0005185664870907249, 0.0005196168415557691, 0.0005206676020568606, 0.0005217187683216249, 0.0005227703400783964, 0.0005238223170562158, 0.0005248746989848261, 0.0005259274855946707, 0.0005269806766168895, 0.0005280342717833163, 0.0005290882708264758, 0.0005301426734795805, 0.000531197479476528, 0.0005322526885518978, 0.0005333083004409486, 0.0005343643148796153, 0.000535420731604506, 0.0005364775503528996, 0.0005375347708627423, 0.0005385923928726454, 0.0005396504161218821, 0.0005407088403503849, 0.0005417676652987426, 0.000542826890708198, 0.0005438865163206446, 0.0005449465418786243, 0.0005460069671253243, 0.000547067791804575, 0.0005481290156608465, 0.0005491906384392469, 0.0005502526598855187, 0.000551315079746037, 0.0005523778977678061, 0.0005534411136984577, 0.0005545047272862477, 0.0005555687382800538, 0.0005566331464293732, 0.0005576979514843197, 0.0005587631531956213, 0.0005598287513146178, 0.0005608947455932581, 0.000561961135784098, 0.0005630279216402974, 0.0005640951029156181, 0.0005651626793644212, 0.0005662306507416648, 0.0005672990168029015, 0.0005683677773042759, 0.0005694369320025226, 0.0005705064806549633, 0.0005715764230195049, 0.0005726467588546368, 0.0005737174879194288, 0.0005747886099735287, 0.00057586012477716, 0.0005769320320911196, 0.0005780043316767755, 0.0005790770232960644, 0.0005801501067114899, 0.0005812235816861197, 0.0005822974479835838, 0.000583371705368072, 0.0005844463536043317, 0.000585521392457666, 0.0005865968216939311, 0.0005876726410795346, 0.0005887488503814329, 0.0005898254493671291, 0.0005909024378046715, 0.0005919798154626503, 0.0005930575821101968, 0.0005941357375169802, 0.0005952142814532062, 0.0005962932136896146, 0.0005973725339974776, 0.0005984522421485971, 0.0005995323379153033, 0.0006006128210704522, 0.000601693691387424, 0.0006027749486401207, 0.0006038565926029643, 0.0006049386230508946, 0.0006060210397593678, 0.0006071038425043538, 0.0006081870310623348, 0.000609270605210303, 0.0006103545647257586, 0.0006114389093867084, 0.0006125236389716632, 0.0006136087532596367, 0.0006146942520301426, 0.0006157801350631935, 0.000616866402139299, 0.0006179530530394631, 0.0006190400875451833, 0.000620127505438448, 0.0006212153065017352, 0.0006223034905180103, 0.0006233920572707244, 0.0006244810065438124, 0.0006255703381216918, 0.0006266600517892599, 0.0006277501473318926, 0.0006288406245354429, 0.0006299314831862384, 0.0006310227230710804, 0.0006321143439772411, 0.0006332063456924631, 0.0006342987280049566, 0.0006353914907033983, 0.0006364846335769295, 0.0006375781564151545, 0.0006386720590081385, 0.0006397663411464068, 0.000640861002620942, 0.0006419560432231833, 0.0006430514627450243, 0.0006441472609788114, 0.0006452434377173425, 0.0006463399927538649, 0.000647436925882074, 0.0006485342368961115, 0.0006496319255905642, 0.0006507299917604615, 0.0006518284352012749, 0.0006529272557089157, 0.0006540264530797336, 0.0006551260271105153, 0.0006562259775984827, 0.0006573263043412914, 0.0006584270071370293, 0.000659528085784215, 0.000660629540081796, 0.0006617313698291479, 0.0006628335748260719, 0.000663936154872794, 0.0006650391097699634, 0.0006661424393186508, 0.0006672461433203469, 0.0006683502215769614, 0.0006694546738908208, 0.0006705595000646677, 0.0006716646999016585, 0.0006727702732053629, 0.0006738762197797616, 0.0006749825394292454, 0.0006760892319586135, 0.0006771962971730724, 0.0006783037348782341, 0.000679411544880115, 0.0006805197269851343, 0.0006816282810001126, 0.0006827372067322707, 0.0006838465039892283, 0.000684956172579002, 0.0006860662123100047, 0.0006871766229910439, 0.0006882874044313202, 0.0006893985564404263, 0.0006905100788283454, 0.0006916219714054499, 0.0006927342339825002, 0.0006938468663706433, 0.0006949598683814115, 0.0006960732398267209, 0.0006971869805188706, 0.0006983010902705406, 0.0006994155688947914, 0.0007005304162050622, 0.0007016456320151697, 0.0007027612161393067, 0.0007038771683920414, 0.0007049934885883153, 0.0007061101765434425, 0.0007072272320731085, 0.0007083446549933685, 0.0007094624451206468, 0.000710580602271735, 0.000711699126263791, 0.0007128180169143376, 0.0007139372740412619, 0.0007150568974628133, 0.0007161768869976029, 0.0007172972424646018, 0.0007184179636831403, 0.0007195390504729066, 0.0007206605026539456, 0.0007217823200466577, 0.0007229045024717976, 0.0007240270497504732, 0.0007251499617041446, 0.0007262732381546227, 0.0007273968789240679, 0.0007285208838349895, 0.0007296452527102442, 0.0007307699853730349, 0.0007318950816469098, 0.000733020541355761, 0.0007341463643238238, 0.0007352725503756752, 0.000736399099336233, 0.0007375260110307546, 0.0007386532852848359, 0.0007397809219244103, 0.0007409089207757475, 0.0007420372816654527, 0.0007431660044204649, 0.0007442950888680566, 0.0007454245348358323, 0.0007465543421517273, 0.000747684510644007, 0.0007488150401412656, 0.0007499459304724253, 0.0007510771814667348, 0.000752208792953769, 0.0007533407647634272, 0.0007544730967259324, 0.0007556057886718302, 0.0007567388404319883, 0.0007578722518375944, 0.0007590060227201564, 0.0007601401529115003, 0.00076127464224377, 0.0007624094905494261, 0.0007635446976612445, 0.000764680263412316, 0.000765816187636045, 0.0007669524701661485, 0.0007680891108366551, 0.0007692261094819041, 0.0007703634659365449, 0.0007715011800355353, 0.0007726392516141409, 0.0007737776805079344, 0.0007749164665527944, 0.0007760556095849043, 0.0007771951094407515, 0.0007783349659571268, 0.0007794751789711227, 0.0007806157483201333, 0.0007817566738418529, 0.0007828979553742749, 0.0007840395927556914, 0.000785181585824692, 0.0007863239344201628, 0.0007874666383812859, 0.0007886096975475379, 0.0007897531117586894, 0.0007908968808548039, 0.0007920410046762374, 0.0007931854830636368, 0.0007943303158579394, 0.0007954755029003721, 0.0007966210440324502, 0.0007977669390959769, 0.000798913187933042, 0.0008000597903860217, 0.0008012067462975769, 0.0008023540555106528, 0.0008035017178684785, 0.000804649733214565, 0.0008057981013927054, 0.0008069468222469735, 0.0008080958956217233, 0.0008092453213615877, 0.0008103950993114783, 0.000811545229316584, 0.0008126957112223704, 0.0008138465448745791, 0.0008149977301192265, 0.0008161492668026035, 0.0008173011547712745, 0.000818453393872076, 0.0008196059839521169, 0.0008207589248587768, 0.0008219122164397055, 0.0008230658585428223, 0.0008242198510163151, 0.0008253741937086395, 0.0008265288864685184, 0.0008276839291449406, 0.0008288393215871607, 0.0008299950636446978, 0.0008311511551673352, 0.0008323075960051189, 0.0008334643860083576, 0.0008346215250276215, 0.0008357790129137419, 0.00083693684951781, 0.0008380950346911761, 0.0008392535682854496, 0.0008404124501524974, 0.0008415716801444437, 0.000842731258113669, 0.0008438911839128093, 0.0008450514573947556, 0.000846212078412653, 0.0008473730468199001, 0.000848534362470148, 0.0008496960252173001, 0.0008508580349155106, 0.0008520203914191845, 0.0008531830945829766, 0.0008543461442617907, 0.0008555095403107791, 0.0008566732825853417, 0.0008578373709411253, 0.0008590018052340231, 0.0008601665853201737, 0.0008613317110559609, 0.0008624971822980122, 0.000863662998903199, 0.0008648291607286353, 0.0008659956676316772, 0.0008671625194699223, 0.0008683297161012089, 0.0008694972573836154, 0.0008706651431754596, 0.000871833373335298, 0.0008730019477219252, 0.0008741708661943731, 0.0008753401286119105, 0.000876509734834042, 0.0008776796847205076, 0.0008788499781312825, 0.0008800206149265755, 0.000881191594966829, 0.0008823629181127183, 0.0008835345842251506, 0.0008847065931652649, 0.0008858789447944308, 0.0008870516389742482, 0.0008882246755665467, 0.0008893980544333846, 0.0008905717754370488, 0.0008917458384400537, 0.0008929202433051409, 0.0008940949898952782, 0.0008952700780736595, 0.0008964455077037038, 0.0008976212786490545, 0.0008987973907735792, 0.0008999738439413687, 0.0009011506380167366, 0.0009023277728642188, 0.0009035052483485724, 0.0009046830643347756, 0.0009058612206880269, 0.0009070397172737445, 0.0009082185539575659, 0.000909397730605347, 0.0009105772470831615, 0.0009117571032573007, 0.0009129372989942725, 0.0009141178341608012, 0.0009152987086238263, 0.0009164799222505027, 0.0009176614749081996, 0.0009188433664645, 0.0009200255967872004, 0.0009212081657443097, 0.0009223910732040492, 0.0009235743190348517, 0.000924757903105361, 0.0009259418252844314, 0.000927126085441127, 0.0009283106834447212, 0.0009294956191646964, 0.0009306808924707431, 0.0009318665032327592, 0.0009330524513208502, 0.0009342387366053278, 0.0009354253589567099, 0.0009366123182457198, 0.0009377996143432857, 0.0009389872471205401, 0.0009401752164488197, 0.0009413635221996642, 0.0009425521642448161, 0.0009437411424562203, 0.0009449304567060233, 0.0009461201068665728, 0.0009473100928104172, 0.0009485004144103049, 0.0009496910715391842, 0.0009508820640702022, 0.0009520733918767046, 0.0009532650548322353, 0.0009544570528105358, 0.0009556493856855443, 0.0009568420533313958, 0.0009580350556224212, 0.0009592283924331468, 0.0009604220636382939, 0.0009616160691127785, 0.0009628104087317105, 0.0009640050823703932, 0.0009652000899043226, 0.0009663954312091878, 0.0009675911061608694, 0.0009687871146354398, 0.0009699834565091622, 0.0009711801316584903, 0.0009723771399600679, 0.0009735744812907285, 0.0009747721555274941, 0.000975970162547576, 0.000977168502228373, 0.000978367174447472, 0.0009795661790826466, 0.0009807655160118571, 0.0009819651851132505, 0.0009831651862651587, 0.0009843655193460994, 0.0009855661842347748, 0.0009867671808100715, 0.00098796850895106, 0.0009891701685369942, 0.0009903721594473106, 0.0009915744815616285, 0.000992777134759749, 0.0009939801189216544, 0.000995183433927509, 0.0009963870796576566, 0.000997591055992622, 0.000998795362813109, 0.0010000000000000015 ];
  public static readonly ONE_LITER_INTERNAL_AREAS = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.011612033891158382, 0.011631414736291496, 0.01165061537329418, 0.011669641182189714, 0.011688497280516357, 0.011707188540913864, 0.01172571960722339, 0.011744094909251632, 0.01176231867633211, 0.011780394949801386, 0.011798327594494347, 0.011816120309351273, 0.01183377663721913, 0.011851299973920685, 0.011868693576657196, 0.011885960571803533, 0.011903103962148663, 0.011920126633628866, 0.011937031361596575, 0.011953820816663283, 0.011970497570151475, 0.011987064099186965, 0.012003522791460348, 0.012019875949683343, 0.012036125795763684, 0.01205227447471991, 0.012068324058355678, 0.012084276548711307, 0.012100133881308924, 0.012115897928206049, 0.012131570500871311, 0.012147153352894744, 0.012162648182544141, 0.012178056635178137, 0.012193380305525518, 0.0122086207398399, 0.012223779437937862, 0.012238857855128273, 0.012253857404039713, 0.012268779456352545, 0.012283625344441699, 0.012298396362935605, 0.012313093770196577, 0.012327718789727361, 0.012342272611508269, 0.012356756393269165, 0.012371171261699973, 0.012385518313603478, 0.012399798616993564, 0.012414013212142175, 0.012428163112577786, 0.012442249306038163, 0.01245627275537991, 0.012470234399447193, 0.012484135153901819, 0.012497975912016833, 0.01251175754543552, 0.012525480904897551, 0.012539146820934243, 0.012552756104534194, 0.012566309547781138, 0.012579807924465178, 0.012593251990668894, 0.012606642485329523, 0.01261998013077836, 0.01263326563325859, 0.012646499683422503, 0.012659682956809125, 0.012672816114303232, 0.012685899802576549, 0.012698934654512054, 0.012711921289612113, 0.012724860314391203, 0.012737752322753995, 0.012750597896359303, 0.012763397604970743, 0.01277615200679453, 0.012788861648805017, 0.012801527067058638, 0.012814148786996509, 0.012826727323736494, 0.012839263182354881, 0.012851756858158342, 0.01286420883694645, 0.012876619595265221, 0.01288898960065201, 0.01290131931187214, 0.01291360917914762, 0.012925859644378215, 0.012938071141355251, 0.012950244095968379, 0.012962378926405642, 0.012974476043347047, 0.012986535850151928, 0.01299855874304036, 0.013010545111268838, 0.013022495337300375, 0.013034409796969388, 0.013046288859641405, 0.013058132888367876, 0.013069942240036268, 0.0130817172655156, 0.013093458309797553, 0.013105165712133406, 0.013116839806166885, 0.013128480920063041, 0.013140089376633413, 0.013151665493457476, 0.01316320958300063, 0.01317472195272872, 0.013186202905219336, 0.013197652738269946, 0.0132090717450029, 0.013220460213967632, 0.013231818429239808, 0.013243146670517932, 0.013254445213217132, 0.01326571432856047, 0.01327695428366771, 0.013288165341641707, 0.013299347761652492, 0.01331050179901906, 0.013321627705289016, 0.013332725728316121, 0.013343796112335769, 0.013354839098038532, 0.013365854922641746, 0.013376843819959305, 0.013387806020469625, 0.013398741751381855, 0.01340965123670049, 0.013420534697288242, 0.013431392350927407, 0.013442224412379697, 0.013453031093444534, 0.01346381260301597, 0.013474569147138182, 0.01348530092905956, 0.01349600814928561, 0.013506691005630416, 0.01351734969326701, 0.013527984404776445, 0.013538595330195736, 0.013549182657064682, 0.013559746570471525, 0.01357028725309763, 0.013580804885261052, 0.01359129964495912, 0.013601771707910047, 0.013612221247593561, 0.013622648435290647, 0.013633053440122354, 0.01364343642908773, 0.013653797567100919, 0.01366413701702742, 0.013674454939719553, 0.013684751494051092, 0.013695026836951209, 0.013705281123437605, 0.01371551450664896, 0.01372572713787668, 0.013735919166595908, 0.013746090740495936, 0.013756242005509924, 0.013766373105843993, 0.013776484184005712, 0.013786575380831952, 0.013796646835516225, 0.013806698685635358, 0.013816731067175689, 0.01382674411455867, 0.013836737960665995, 0.013846712736864136, 0.013856668573028462, 0.013866605597566806, 0.01387652393744257, 0.0138864237181974, 0.013896305063973336, 0.013906168097534604, 0.013916012940288889, 0.013925839712308255, 0.013935648532349614, 0.01394543951787482, 0.013955212785070309, 0.013964968448866482, 0.013974706622956563, 0.013984427419815197, 0.013994130950716638, 0.014003817325752635, 0.014013486653849931, 0.014023139042787451, 0.014032774599213163, 0.014042393428660649, 0.014051995635565294, 0.014061581323280255, 0.014071150594092079, 0.014080703549236065, 0.014090240288911312, 0.014099760912295516, 0.014109265517559477, 0.014118754201881386, 0.014128227061460764, 0.014137684191532255, 0.014147125686379094, 0.014156551639346367, 0.014165962142854037, 0.014175357288409714, 0.014184737166621214, 0.014194101867208929, 0.014203451479017902, 0.014212786090029766, 0.01422210578737445, 0.01423141065734164, 0.014240700785392128, 0.014249976256168886, 0.014259237153507994, 0.014268483560449354, 0.014277715559247244, 0.014286933231380703, 0.014296136657563673, 0.014305325917755074, 0.014314501091168627, 0.014323662256282546, 0.01433280949084905, 0.014341942871903756, 0.014351062475774874, 0.01436016837809228, 0.014369260653796406, 0.014378339377147045, 0.014387404621731924, 0.014396456460475241, 0.014405494965645976, 0.014414520208866112, 0.014423532261118718, 0.014432531192755895, 0.014441517073506617, 0.014450489972484408, 0.014459449958194924, 0.014468397098543435, 0.014477331460842135, 0.01448625311181738, 0.014495162117616825, 0.014504058543816376, 0.01451294245542713, 0.01452181391690214, 0.014530672992143117, 0.014539519744506978, 0.014548354236812359, 0.014557176531345983, 0.01456598668986893, 0.01457478477362286, 0.014583570843336077, 0.014592344959229541, 0.0146011071810228, 0.014609857567939791, 0.01461859617871459, 0.014627323071597075, 0.014636038304358471, 0.014644741934296872, 0.014653434018242617, 0.01466211461256363, 0.01467078377317069, 0.014679441555522565, 0.01468808801463115, 0.014696723205066467, 0.014705347180961621, 0.0147139599960177, 0.014722561703508573, 0.01473115235628562, 0.014739732006782438, 0.01474830070701942, 0.014756858508608315, 0.014765405462756728, 0.014773941620272483, 0.014782467031568025, 0.014790981746664714, 0.01479948581519702, 0.014807979286416743, 0.014816462209197101, 0.014824934632036815, 0.014833396603064085, 0.014841848170040585, 0.014850289380365308, 0.014858720281078437, 0.014867140918865145, 0.014875551340059323, 0.014883951590647251, 0.014892341716271282, 0.014900721762233378, 0.014909091773498718, 0.014917451794699117, 0.014925801870136552, 0.014934142043786514, 0.014942472359301363, 0.014950792860013698, 0.014959103588939553, 0.014967404588781683, 0.014975695901932722, 0.014983977570478342, 0.01499224963620032, 0.015000512140579654, 0.01500876512479954, 0.01501700862974839, 0.015025242696022763, 0.015033467363930257, 0.015041682673492415, 0.015049888664447527, 0.015058085376253456, 0.015066272848090376, 0.015074451118863515, 0.015082620227205846, 0.01509078021148075, 0.015098931109784632, 0.015107072959949522, 0.015115205799545632, 0.015123329665883914, 0.015131444596018494, 0.015139550626749211, 0.015147647794624, 0.015155736135941346, 0.015163815686752614, 0.01517188648286443, 0.015179948559840992, 0.015188001953006347, 0.0151960466974467, 0.015204082828012588, 0.015212110379321136, 0.01522012938575822, 0.01522813988148063, 0.015236141900418205, 0.01524413547627592, 0.015252120642536001, 0.01526009743245994, 0.015268065879090558, 0.015276026015254, 0.01528397787356171, 0.015291921486412412, 0.015299856885994048, 0.015307784104285651, 0.015315703173059294, 0.015323614123881937, 0.015331516988117258, 0.015339411796927514, 0.015347298581275322, 0.01535517737192546, 0.01536304819944662, 0.01537091109421317, 0.015378766086406849, 0.015386613206018522, 0.015394452482849808, 0.015402283946514802, 0.015410107626441665, 0.015417923551874324, 0.015425731751874014, 0.015433532255320917, 0.01544132509091572, 0.015449110287181184, 0.015456887872463658, 0.015464657874934635, 0.015472420322592243, 0.015480175243262735, 0.01548792266460196, 0.015495662614096833, 0.015503395119066763, 0.015511120206665075, 0.015518837903880447, 0.015526548237538266, 0.015534251234302038, 0.015541946920674739, 0.015549635323000171, 0.015557316467464291, 0.015564990380096533, 0.015572657086771118, 0.015580316613208342, 0.015587968984975862, 0.015595614227489965, 0.01560325236601679, 0.015610883425673615, 0.015618507431430026, 0.015626124408109187, 0.015633734380388998, 0.015641337372803304, 0.01564893340974305, 0.01565652251545746, 0.01566410471405519, 0.015671680029505454, 0.015679248485639147, 0.015686810106149987, 0.01569436491459557, 0.015701912934398533, 0.01570945418884754, 0.015716988701098455, 0.01572451649417532, 0.015732037590971432, 0.015739552014250393, 0.015747059786647127, 0.015754560930668873, 0.01576205546869623, 0.01576954342298413, 0.01577702481566282, 0.015784499668738853, 0.015791968004096036, 0.01579942984349641, 0.015806885208581166, 0.015814334120871614, 0.01582177660177009, 0.01582921267256088, 0.015836642354411123, 0.015844065668371734, 0.015851482635378274, 0.01585889327625183, 0.015866297611699907, 0.015873695662317285, 0.015881087448586878, 0.015888472990880573, 0.015895852309460095, 0.0159032254244778, 0.015910592355977544, 0.015917953123895465, 0.015925307748060818, 0.01593265624819674, 0.015939998643921087, 0.01594733495474719, 0.015954665200084636, 0.015961989399240057, 0.015969307571417853, 0.015976619735721002, 0.015983925911151775, 0.01599122611661247, 0.01599852037090617, 0.01600580869273745, 0.01601309110071314, 0.01602036761334296, 0.016027638249040313, 0.016034903026122944, 0.01604216196281362, 0.01604941507724084, 0.01605666238743952, 0.016063903911351665, 0.016071139666827022, 0.016078369671623755, 0.01608559394340911, 0.016092812499760033, 0.01610002535816387, 0.016107232536018944, 0.01611443405063523, 0.01612162991923497, 0.01612882015895329, 0.016136004786838812, 0.01614318381985428, 0.016150357274877146, 0.016157525168700195, 0.0161646875180321, 0.016171844339498045, 0.016178995649640298, 0.01618614146491877, 0.016193281801711628, 0.01620041667631582, 0.016207546104947658, 0.01621467010374338, 0.016221788688759686, 0.016228901875974304, 0.016236009681286523, 0.016243112120517735, 0.016250209209411958, 0.016257300963636374, 0.016264387398781856, 0.016271468530363476, 0.016278544373821036, 0.016285614944519564, 0.016292680257749815, 0.016299740328728805, 0.01630679517260026, 0.016313844804435155, 0.01632088923923217, 0.01632792849191819, 0.01633496257734878, 0.01634199151030867, 0.016349015305512214, 0.01635603397760386, 0.016363047541158627, 0.01637005601068255, 0.01637705940061314, 0.01638405772531985, 0.0163910509991045, 0.016398039236201745, 0.016405022450779485, 0.016412000656939343, 0.016418973868717067, 0.016425942100082972, 0.016432905364942366, 0.016439863677135968, 0.016446817050440325, 0.01645376549856825, 0.016460709035169212, 0.01646764767382973, 0.01647458142807382, 0.01648151031136337, 0.01648843433709855, 0.01649535351861819, 0.016502267869200192, 0.016509177402061904, 0.016516082130360526, 0.016522982067193475, 0.016529877225598753, 0.016536767618555364, 0.01654365325898365, 0.016550534159745667, 0.01655741033364559, 0.01656428179343, 0.01657114855178834, 0.0165780106213532, 0.016584868014700695, 0.01659172074435084, 0.01659856882276787, 0.01660541226236059, 0.016612251075482757, 0.016619085274433364, 0.01662591487145702, 0.016632739878744265, 0.016639560308431934, 0.01664637617260344, 0.01665318748328914, 0.01665999425246666, 0.016666796492061185, 0.016673594213945816, 0.016680387429941882, 0.01668717615181923, 0.016693960391296562, 0.016700740160041742, 0.016707515469672113, 0.016714286331754768, 0.01672105275780689, 0.01672781475929605, 0.016734572347640465, 0.016741325534209366, 0.016748074330323225, 0.016754818747254083, 0.01676155879622582, 0.016768294488414468, 0.01677502583494847, 0.01678175284690899, 0.01678847553533015, 0.016795193911199362, 0.01680190798545757, 0.016808617768999532, 0.01681532327267411, 0.016822024507284494, 0.016828721483588528, 0.01683541421229895, 0.01684210270408364, 0.016848786969565904, 0.016855467019324735, 0.016862142863895056, 0.016868814513768003, 0.016875481979391142, 0.016882145271168752, 0.016888804399462054, 0.016895459374589493, 0.01690211020682695, 0.016908756906407998, 0.016915399483524166, 0.016922037948325135, 0.01692867231091903, 0.01693530258137262, 0.01694192876971157, 0.016948550885920694, 0.016955168939944136, 0.01696178294168566, 0.01696839290100883, 0.016974998827737276, 0.016981600731654892, 0.016988198622506095, 0.016994792509996, 0.01700138240379068, 0.017007968313517377, 0.017014550248764703, 0.01702112821908288, 0.01702770223398394, 0.017034272302941935, 0.017040838435393182, 0.01704740064073642, 0.01705395892833306, 0.017060513307507377, 0.017067063787546723, 0.017073610377701717, 0.017080153087186464, 0.017086691925178747, 0.017093226900820234, 0.01709975802321667, 0.017106285301438078, 0.017112808744518957, 0.017119328361458467, 0.017125844161220625, 0.01713235615273452, 0.017138864344894467, 0.017145368746560214, 0.01715186936655714, 0.017158366213676415, 0.01716485929667521, 0.017171348624276876, 0.017177834205171112, 0.01718431604801415, 0.01719079416142897, 0.017197268554005427, 0.01720373923430045, 0.017210206210838228, 0.017216669492110388, 0.017223129086576135, 0.017229585002662463, 0.01723603724876432, 0.01724248583324476, 0.017248930764435108, 0.017255372050635175, 0.017261809700113366, 0.017268243721106885, 0.017274674121821886, 0.017281100910433635, 0.01728752409508668, 0.017293943683895006, 0.01730035968494219, 0.017306772106281575, 0.017313180955936425, 0.017319586241900067, 0.01732598797213606, 0.01733238615457836, 0.017338780797131435, 0.01734517190767048, 0.017351559494041498, 0.01735794356406151, 0.017364324125518676, 0.01737070118617245, 0.017377074753753715, 0.01738344483596496, 0.017389811440480393, 0.017396174574946105, 0.01740253424698023, 0.01740889046417303, 0.017415243234087108, 0.017421592564257498, 0.01742793846219183, 0.01743428093537047, 0.01744061999124664, 0.017446955637246575, 0.017453287880769653, 0.017459616729188523, 0.017465942189849242, 0.017472264270071432, 0.017478582977148386, 0.017484898318347198, 0.017491210300908923, 0.017497518932048685, 0.017503824218955806, 0.01751012616879394, 0.017516424788701218, 0.017522720085790346, 0.017529012067148738, 0.017535300739838666, 0.017541586110897355, 0.017547868187337126, 0.017554146976145508, 0.017560422484285375, 0.01756669471869504, 0.01757296368628841, 0.01757922939395508, 0.017585491848560477, 0.01759175105694594, 0.017598007025928883, 0.017604259762302888, 0.017610509272837808, 0.017616755564279926, 0.017622998643352025, 0.017629238516753524, 0.017635475191160585, 0.01764170867322624, 0.01764793896958049, 0.0176541660868304, 0.017660390031560252, 0.017666610810331617, 0.017672828429683495, 0.017679042896132376, 0.01768525421617242, 0.017691462396275486, 0.017697667442891318, 0.01770386936244756, 0.01771006816134995, 0.017716263845982374, 0.017722456422706975, 0.017728645897864274, 0.01773483227777325, 0.017741015568731474, 0.017747195777015168, 0.017753372908879347, 0.017759546970557885, 0.017765717968263643, 0.017771885908188564, 0.017778050796503738, 0.01778421263935955, 0.017790371442885734, 0.017796527213191516, 0.017802679956365655, 0.017808829678476575, 0.017814976385572456, 0.017821120083681325, 0.01782726077881115, 0.017833398476949914, 0.017839533184065753, 0.017845664906107, 0.017851793649002322, 0.017857919418660755, 0.017864042220971852, 0.017870162061805736, 0.017876278947013217, 0.017882392882425834, 0.017888503873856, 0.017894611927097064, 0.017900717047923398, 0.017906819242090467, 0.017912918515334955, 0.017919014873374817, 0.017925108321909387, 0.01793119886661944, 0.017937286513167297, 0.017943371267196907, 0.0179494531343339, 0.017955532120185726, 0.017961608230341687, 0.01796768147037302, 0.01797375184583305, 0.017979819362257163, 0.01798588402516296, 0.017991945840050323, 0.01799800481240149, 0.018004060947681123, 0.0180101142513364, 0.018016164728797093, 0.018022212385475644, 0.018028257226767236, 0.01803429925804989, 0.018040338484684507, 0.018046374912014978, 0.018052408545368232, 0.018058439390054342, 0.01806446745136657, 0.018070492734581455, 0.018076515244958888, 0.01808253498774218, 0.018088551968158152, 0.018094566191417166, 0.01810057766271325, 0.01810658638722413, 0.01811259237011133, 0.018118595616520215, 0.018124596131580083, 0.018130593920404225, 0.018136588988089997, 0.018142581339718893, 0.018148570980356618, 0.01815455791505314, 0.018160542148842763, 0.01816652368674421, 0.01817250253376068, 0.018178478694879922, 0.018184452175074275, 0.01819042297930077, 0.018196391112501185, 0.018202356579602095, 0.018208319385514957, 0.018214279535136157, 0.018220237033347096, 0.01822619188501423, 0.018232144094989168, 0.01823809366810869, 0.018244040609194843, 0.018249984923055, 0.018255926614481915, 0.018261865688253782, 0.018267802149134305, 0.01827373600187277, 0.01827966725120407, 0.0182855959018488, 0.018291521958513315, 0.01829744542588977, 0.01830336630865619, 0.018309284611476538, 0.01831520033900076, 0.01832111349586487, 0.018327024086690957, 0.018332932116087292, 0.018338837588648384, 0.018344740508954998, 0.018350640881574252, 0.018356538711059658, 0.018362434001951172, 0.01836832675877526, 0.01837421698604496, 0.018380104688259936, 0.018385989869906506, 0.01839187253545773, 0.01839775268937346, 0.01840363033610038, 0.018409505480072065, 0.018415378125709054, 0.018421248277418877, 0.01842711593959611, 0.018432981116622463, 0.018438843812866784, 0.018444704032685152, 0.018450561780420902, 0.018456417060404694, 0.01846226987695455, 0.018468120234375933, 0.01847396813696175, 0.018479813588992457, 0.018485656594736076, 0.018491497158448257, 0.018497335284372318, 0.01850317097673931, 0.018509004239768055, 0.018514835077665204, 0.018520663494625278, 0.01852648949483072, 0.018532313082451943, 0.018538134261647386, 0.018543953036563553, 0.018549769411335053, 0.018555583390084677, 0.01856139497692341, 0.018567204175950498, 0.018573010991253504, 0.018578815426908323, 0.01858461748697927, 0.018590417175519087, 0.018596214496568998, 0.018602009454158797, 0.01860780205230681, 0.01861359229502004, 0.018619380186294124, 0.01862516573011343, 0.018630948930451086, 0.018636729791269027, 0.018642508316518022, 0.018648284510137756, 0.01865405837605684, 0.018659829918192858, 0.01866559914045243, 0.01867136604673123, 0.018677130640914037, 0.018682892926874813, 0.018688652908476683, 0.018694410589572018, 0.01870016597400247, 0.018705919065599, 0.018711669868181943, 0.018717418385561027, 0.01872316462153544, 0.018728908579893837, 0.0187346502644144, 0.018740389678864884, 0.018746126827002652, 0.01875186171257471, 0.018757594339317736, 0.018763324710958165, 0.018769052831212173, 0.01877477870378574, 0.018780502332374705, 0.01878622372066478, 0.018791942872331605, 0.018797659791040762, 0.01880337448044786, 0.01880908694419852, 0.018814797185928447, 0.018820505209263465, 0.01882621101781953, 0.01883191461520281, 0.018837616005009668, 0.01884331519082676, 0.01884901217623101, 0.01885470696478971, 0.01886039956006049, 0.01886608996559141, 0.018871778184920966, 0.01887746422157814, 0.01888314807908243, 0.01888882976094387, 0.018894509270663107, 0.01890018661173139, 0.018905861787630634, 0.01891153480183344, 0.01891720565780314, 0.018922874358993848, 0.01892854090885043, 0.01893420531080863, 0.018939867568295018, 0.018945527684727088, 0.018951185663513267, 0.018956841508052928, 0.018962495221736455, 0.01896814680794528, 0.018973796270051864, 0.018979443611419816, 0.018985088835403837, 0.018990731945349813, 0.018996372944594813, 0.019002011836467155, 0.019007648624286402, 0.019013283311363427, 0.0190189159010004, 0.019024546396490892, 0.019030174801119827, 0.01903580111816356, 0.019041425350889905, 0.019047047502558163, 0.019052667576419133, 0.019058285575715164, 0.01906390150368019, 0.019069515363539753, 0.019075127158511018, 0.019080736891802834, 0.019086344566615728, 0.01909195018614198, 0.0190975537535656, 0.019103155272062404, 0.019108754744800026, 0.019114352174937926, 0.019119947565627477, 0.01912554092001192, 0.019131132241226444, 0.019136721532398208, 0.01914230879664635, 0.01914789403708204, 0.019153477256808493, 0.019159058458920998, 0.01916463764650696, 0.019170214822645908, 0.019175789990409524, 0.019181363152861706, 0.019186934313058554, 0.019192503474048415, 0.0191980706388719, 0.019203635810561944, 0.019209198992143784, 0.019214760186635028, 0.01922031939704565, 0.019225876626378056, 0.019231431877627072, 0.01923698515377998, 0.019242536457816563, 0.019248085792709112, 0.01925363316142248, 0.019259178566914042, 0.019264722012133813 ];
  public static readonly ONE_LITER_INTERNAL_VOLUMES = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6.73894099208086e-7, 0.0000013489129485930396, 0.0000020250460899356664, 0.0000027022833772416565, 0.000003380614961508499, 0.000004060031276513015, 0.0000047405230255332315, 0.000005422081168927084, 0.000006104696912498131, 0.000006788361696585318, 0.000007473067185819859, 0.00000815880525949769, 0.000008845568002520734, 0.000009533347696864476, 0.000010222136813533194, 0.00001091192800496756, 0.000011602714097872443, 0.000012294488086435466, 0.000012987243125909375, 0.000013680972526533486, 0.000014375669747771539, 0.000015071328392845071, 0.000015767942203543135, 0.00001646550505529061, 0.000017164010952458833, 0.00001786345402390338, 0.00001856382851871512, 0.000019265128802171564, 0.00001996734935187653, 0.000020670484754077032, 0.00002137452970014707, 0.00002207947898322868, 0.000022785327495021373, 0.000023492070222711582, 0.000024199702246034418, 0.000024908218734460445, 0.00002561761494450076, 0.00002632788621712402, 0.000027039027975279523, 0.00002775103572152083, 0.0000284639050357247, 0.0000291776315729005, 0.00002989221106108554, 0.00003060763929932204, 0.00003132391215571165, 0.00003204102556554387, 0.00003275897552949464, 0.00003347775811189188, 0.00003419736943904474, 0.000034917805697633655, 0.00003563906313315827, 0.000036361138048440714, 0.00003708402680218165, 0.00003780772580756673, 0.00003853223153092123, 0.000039257540490410736, 0.00003998364925478587, 0.0000407105544421692, 0.000041438252718882413, 0.00004216674079831223, 0.00004289601543981322, 0.00004362607344764621, 0.00004435691166995058, 0.000045088526997749285, 0.000045820916363985146, 0.000046554076742587174, 0.000047288005147565776, 0.00004802269863213567, 0.00004875815428786543, 0.00004949436924385266, 0.000050231340665923755, 0.00005096906575585739, 0.00005170754175063077, 0.00005244676592168783, 0.00005318673557422855, 0.000053927448046518656, 0.00005466890070921886, 0.00005541109096473305, 0.00005615401624657468, 0.00005689767401875071, 0.00005764206177516251, 0.0000583871770390231, 0.000059133017362290185, 0.00005987958032511443, 0.000060626863535302406, 0.00006137486462779381, 0.0000621235812641524, 0.00006287301113207013, 0.00006362315194488423, 0.00006437400144110664, 0.0000651255573839654, 0.00006587781756095776, 0.00006663077978341438, 0.00006738444188607456, 0.00006813880172667184, 0.00006889385718552997, 0.00006964960616516855, 0.00007040604658991842, 0.00007116317640554623, 0.00007192099357888796, 0.00007267949609749131, 0.00007343868196926627, 0.00007419854922214417, 0.00007495909590374448, 0.00007572032008104938, 0.00007648221984008581, 0.0000772447932856148, 0.00007800803854082784, 0.00007877195374705004, 0.00007953653706345005, 0.00008030178666675632, 0.0000810677007509797, 0.0000818342775271422, 0.00008260151522301145, 0.00008336941208284123, 0.00008413796636711735, 0.00008490717635230909, 0.00008567704033062592, 0.00008644755660977938, 0.00008721872351274993, 0.00008799053937755876, 0.00008876300255704426, 0.00008953611141864316, 0.00009030986434417615, 0.00009108425972963794, 0.00009185929598499147, 0.00009263497153396639, 0.00009341128481386153, 0.00009418823427535134, 0.00009496581838229616, 0.0000957440356115562, 0.00009652288445280924, 0.00009730236340837193, 0.00009808247099302434, 0.00009886320573383819, 0.00009964456617000816, 0.00010042655085268651, 0.00010120915834482086, 0.00010199238722099498, 0.00010277623606727262, 0.00010356070348104419, 0.0001043457880708764, 0.00010513148845636458, 0.00010591780326798778, 0.00010670473114696646, 0.00010749227074512285, 0.00010828042072474375, 0.00010906917975844592, 0.00010985854652904373, 0.00011064851972941932, 0.00011143909806239496, 0.00011223028024060771, 0.00011302206498638627, 0.00011381445103162999, 0.00011460743711768997, 0.00011540102199525223, 0.00011619520442422292, 0.00011698998317361538, 0.00011778535702143932, 0.00011858132475459168, 0.00011937788516874946, 0.00012017503706826436, 0.00012097277926605905, 0.00012177111058352533, 0.00012257002985042385, 0.0001233695359047856, 0.00012416962759281489, 0.00012497030376879396, 0.0001257715632949893, 0.00012657340504155915, 0.00012737582788646283, 0.0001281788307153713, 0.00012898241242157932, 0.00012978657190591876, 0.0001305913080766736, 0.000131396619849496, 0.00013220250614732378, 0.0001330089659002993, 0.00013381599804568943, 0.00013462360152780676, 0.00013543177529793223, 0.00013624051831423868, 0.0001370498295417158, 0.00013785970795209598, 0.00013867015252378155, 0.00013948116224177292, 0.00014029273609759784, 0.0001411048730892418, 0.00014191757222107936, 0.00014273083250380652, 0.00014354465295437414, 0.00014435903259592232, 0.0001451739704577157, 0.00014598946557507972, 0.00014680551698933786, 0.00014762212374774968, 0.00014843928490344986, 0.00014925699951538803, 0.00015007526664826952, 0.0001508940853724969, 0.00015171345476411242, 0.00015253337390474118, 0.0001533538418815351, 0.00015417485778711776, 0.00015499642071952998, 0.00015581852978217603, 0.0001566411840837708, 0.00015746438273828747, 0.00015828812486490612, 0.00015911240958796282, 0.0001599372360368996, 0.000160762603346215, 0.00016158851065541533, 0.00016241495710896648, 0.0001632419418562466, 0.00016406946405149908, 0.00016489752285378658, 0.00016572611742694525, 0.0001665552469395398, 0.0001673849105648191, 0.00016821510748067238, 0.000169045836869586, 0.00016987709791860066, 0.00017070888981926945, 0.00017154121176761602, 0.00017237406296409375, 0.0001732074426135451, 0.00017404134992516168, 0.0001748757841124446, 0.0001757107443931657, 0.00017654622998932877, 0.0001773822401271318, 0.00017821877403692918, 0.00017905583095319483, 0.00017989341011448546, 0.00018073151076340442, 0.00018157013214656603, 0.00018240927351456028, 0.00018324893412191795, 0.00018408911322707623, 0.00018492981009234473, 0.00018577102398387188, 0.00018661275417161175, 0.00018745499992929126, 0.00018829776053437783, 0.0001891410352680473, 0.00018998482341515244, 0.00019082912426419163, 0.00019167393710727796, 0.00019251926124010883, 0.00019336509596193572, 0.0001942114405755344, 0.00019505829438717554, 0.00019590565670659559, 0.00019675352684696797, 0.0001976019041248747, 0.0001984507878602783, 0.00019930017737649394, 0.00020015007200016208, 0.0002010004710612213, 0.00020185137389288135, 0.0002027027798315968, 0.00020355468821704073, 0.00020440709839207867, 0.00020526000970274322, 0.00020611342149820842, 0.0002069673331307649, 0.00020782174395579493, 0.000208676653331748, 0.00020953206062011652, 0.00021038796518541188, 0.00021124436639514068, 0.00021210126361978133, 0.0002129586562327608, 0.00021381654361043173, 0.0002146749251320497, 0.00021553380017975076, 0.00021639316813852928, 0.00021725302839621592, 0.00021811338034345595, 0.00021897422337368766, 0.0002198355568831212, 0.00022069738027071745, 0.00022155969293816727, 0.00022242249428987076, 0.00022328578373291707, 0.00022414956067706406, 0.00022501382453471842, 0.0002258785747209159, 0.00022674381065330176, 0.00022760953175211143, 0.00022847573744015138, 0.00022934242714278013, 0.00023020960028788956, 0.0002310772563058863, 0.00023194539462967334, 0.00023281401469463198, 0.00023368311593860368, 0.0002345526978018723, 0.00023542275972714645, 0.0002362933011595421, 0.00023716432154656522, 0.00023803582033809473, 0.00023890779698636553, 0.0002397802509459517, 0.00024065318167374995, 0.00024152658862896322, 0.00024240047127308426, 0.0002432748290698797, 0.00024414966148537395, 0.0002450249679878334, 0.0002459007480477509, 0.0002467770011378302, 0.0002476537267329706, 0.00024853092431025166, 0.00024940859334891835, 0.00025028673333036595, 0.0002511653437381255, 0.000252044424057849, 0.00025292397377729497, 0.0002538039923863142, 0.0002546844793768355, 0.00025556543424285155, 0.00025644685648040506, 0.00025732874558757494, 0.0002582111010644626, 0.00025909392241317845, 0.00025997720913782847, 0.00026086096074450085, 0.0002617451767412529, 0.0002626298566380979, 0.0002635149999469924, 0.0002644006061818231, 0.00026528667485839437, 0.0002661732054944156, 0.00026706019760948884, 0.0002679476507250962, 0.0002688355643645879, 0.00026972393805317006, 0.00027061277131789263, 0.0002715020636876375, 0.0002723918146931067, 0.0002732820238668108, 0.00027417269074305725, 0.0002750638148579389, 0.0002759553957493226, 0.00027684743295683796, 0.0002777399260218661, 0.0002786328744875288, 0.0002795262778986772, 0.0002804201358018811, 0.0002813144477454182, 0.0002822092132792633, 0.00028310443195507767, 0.00028400010332619874, 0.0002848962269476295, 0.0002857928023760283, 0.0002866898291696984, 0.0002875873068885781, 0.00028848523509423043, 0.0002893836133498334, 0.00029028244122017004, 0.0002911817182716184, 0.0002920814440721421, 0.0002929816181912805, 0.0002938822402001393, 0.000294783309671381, 0.0002956848261792154, 0.0002965867892993905, 0.000297489198609183, 0.00029839205368738936, 0.0002992953541143167, 0.00030019909947177355, 0.0003011032893430612, 0.00030200792331296485, 0.00030291300096774447, 0.0003038185218951265, 0.00030472448568429495, 0.000305630891925883, 0.00030653774021196443, 0.0003074450301360451, 0.0003083527612930546, 0.00030926093327933825, 0.00031016954569264846, 0.00031107859813213687, 0.00031198809019834605, 0.0003128980214932017, 0.0003138083916200045, 0.0003147192001834223, 0.00031563044678948216, 0.0003165421310455628, 0.0003174542525603868, 0.00031836681094401273, 0.0003192798058078279, 0.0003201932367645407, 0.000321107103428173, 0.000322021405414053, 0.00032293614233880764, 0.00032385131382035544, 0.00032476691947789924, 0.00032568295893191894, 0.00032659943180416454, 0.00032751633771764896, 0.00032843367629664097, 0.00032935144716665844, 0.0003302696499544612, 0.0003311882842880443, 0.0003321073497966312, 0.0003330268461106672, 0.00033394677286181237, 0.00033486712968293516, 0.00033578791620810585, 0.0003367091320725898, 0.0003376307769128412, 0.0003385528503664964, 0.0003394753520723676, 0.0003403982816704367, 0.00034132163880184866, 0.00034224542310890547, 0.0003431696342350599, 0.00034409427182490934, 0.00034501933552418966, 0.00034594482497976917, 0.0003468707398396426, 0.0003477970797529252, 0.00034872384436984656, 0.0003496510333417451, 0.0003505786463210618, 0.00035150668296133486, 0.0003524351429171935, 0.00035336402584435254, 0.00035429333139960664, 0.0003552230592408246, 0.0003561532090269438, 0.0003570837804179648, 0.00035801477307494556, 0.00035894618665999623, 0.00035987802083627357, 0.0003608102752679755, 0.00036174294962033595, 0.0003626760435596194, 0.00036360955675311554, 0.00036454348886913424, 0.00036547783957700016, 0.00036641260854704776, 0.00036734779545061593, 0.0003682833999600431, 0.00036921942174866215, 0.0003701558604907953, 0.0003710927158617493, 0.00037202998753781016, 0.0003729676751962387, 0.0003739057785152652, 0.000374844297174085, 0.00037578323085285314, 0.0003767225792326802, 0.000377662341995627, 0.00037860251882470034, 0.00037954310940384805, 0.00038048411341795433, 0.00038142553055283535, 0.00038236736049523446, 0.0003833096029328177, 0.0003842522575541693, 0.0003851953240487873, 0.00038613880210707874, 0.0003870826914203556, 0.0003880269916808303, 0.00038897170258161127, 0.00038991682381669853, 0.0003908623550809796, 0.0003918082960702251, 0.0003927546464810844, 0.0003937014060110817, 0.0003946485743586114, 0.0003955961512229343, 0.00039654413630417333, 0.0003974925293033094, 0.0003984413299221774, 0.00039939053786346206, 0.00040034015283069396, 0.00040129017452824554, 0.0004022406026613271, 0.00040319143693598285, 0.00040414267705908704, 0.00040509432273833995, 0.0004060463736822641, 0.0004069988296002004, 0.0004079516902023043, 0.00040890495519954205, 0.0004098586243036868, 0.000410812697227315, 0.0004117671736838026, 0.00041272205338732133, 0.00041367733605283507, 0.0004146330213960962, 0.0004155891091336419, 0.0004165455989827907, 0.00041750249066163875, 0.00041845978388905625, 0.00041941747838468397, 0.0004203755738689299, 0.00042133407006296535, 0.0004222929666887219, 0.00042325226346888776, 0.0004242119601269043, 0.00042517205638696284, 0.0004261325519740009, 0.0004270934466136994, 0.0004280547400324787, 0.0004290164319574957, 0.00042997852211664047, 0.00043094101023853285, 0.0004319038960525193, 0.00043286717928866966, 0.00043383085967777386, 0.00043479493695133874, 0.00043575941084158495, 0.0004367242810814438, 0.0004376895474045539, 0.00043865520954525846, 0.00043962126723860165, 0.000440587720220326, 0.0004415545682268692, 0.00044252181099536074, 0.00044348944826361946, 0.0004444574797701501, 0.00044542590525414036, 0.00044639472445545826, 0.00044736393711464873, 0.000448333542972931, 0.00044930354177219565, 0.0004502739332550015, 0.000451244717164573, 0.0004522158932447972, 0.00045318746124022095, 0.0004541594208960481, 0.0004551317719581366, 0.00045610451417299583, 0.00045707764728778377, 0.0004580511710503042, 0.0004590250852090039, 0.0004599993895129702, 0.00046097408371192797, 0.00046194916755623697, 0.0004629246407968893, 0.00046390050318550666, 0.0004648767544743377, 0.0004658533944162553, 0.00046683042276475425, 0.00046780783927394823, 0.0004687856436985676, 0.0004697638357939565, 0.0004707424153160706, 0.0004717213820214744, 0.0004727007356673385, 0.00047368047601143766, 0.00047466060281214765, 0.0004756411158284432, 0.00047662201481989537, 0.00047760329954666905, 0.0004785849697695207, 0.00047956702524979577, 0.00048054946574942626, 0.0004815322910309284, 0.0004825155008574004, 0.0004834990949925197, 0.00048448307320054097, 0.00048546743524629366, 0.0004864521808951796, 0.0004874373099131707, 0.0004884228220668067, 0.000489408717123193, 0.0004903949948499977, 0.0004913816550154507, 0.0004923686973883398, 0.0004933561217380097, 0.0004943439278343592, 0.0004953321154478394, 0.0004963206843494507, 0.0004973096343107416, 0.0004982989651038058, 0.0004992886765012804, 0.0005002787682763435, 0.0005012692402027124, 0.0005022600920546409, 0.0005032513236069179, 0.0005042429346348646, 0.0005052349249143331, 0.0005062272942217036, 0.0005072200423338829, 0.0005082131690283019, 0.000509206674082914, 0.0005102005572761926, 0.0005111948183871294, 0.0005121894571952323, 0.0005131844734805233, 0.0005141798670235366, 0.0005151756376053166, 0.0005161717850074159, 0.0005171683090118934, 0.0005181652094013122, 0.0005191624859587378, 0.0005201601384677361, 0.0005211581667123716, 0.0005221565704772054, 0.0005231553495472931, 0.0005241545037081833, 0.0005251540327459155, 0.0005261539364470181, 0.0005271542145985069, 0.0005281548669878828, 0.0005291558934031306, 0.0005301572936327163, 0.0005311590674655861, 0.000532161214691164, 0.0005331637350993504, 0.0005341666284805201, 0.0005351698946255205, 0.00053617353332567, 0.000537177544372756, 0.0005381819275590334, 0.0005391866826772226, 0.0005401918095205079, 0.0005411973078825359, 0.0005422031775574134, 0.0005432094183397062, 0.0005442160300244369, 0.0005452230124070836, 0.0005462303652835779, 0.0005472380884503035, 0.0005482461817040944, 0.0005492546448422333, 0.0005502634776624498, 0.0005512726799629188, 0.0005522822515422591, 0.0005532921921995316, 0.0005543025017342376, 0.0005553131799463173, 0.0005563242266361482, 0.0005573356416045436, 0.0005583474246527508, 0.0005593595755824498, 0.0005603720941957513, 0.0005613849802951957, 0.0005623982336837509, 0.0005634118541648116, 0.000564425841542197, 0.0005654401956201495, 0.0005664549162033333, 0.0005674700030968332, 0.0005684854561061521, 0.0005695012750372104, 0.0005705174596963443, 0.0005715340098903045, 0.0005725509254262538, 0.0005735682061117669, 0.0005745858517548281, 0.0005756038621638302, 0.0005766222371475729, 0.0005776409765152614, 0.0005786600800765049, 0.0005796795476413156, 0.0005806993790201066, 0.000581719574023691, 0.0005827401324632801, 0.0005837610541504826, 0.0005847823388973025, 0.0005858039865161383, 0.0005868259968197813, 0.0005878483696214142, 0.0005888711047346099, 0.0005898942019733303, 0.0005909176611519246, 0.000591941482085128, 0.0005929656645880606, 0.0005939902084762258, 0.0005950151135655094, 0.0005960403796721776, 0.0005970660066128765, 0.0005980919942046301, 0.0005991183422648392, 0.0006001450506112805, 0.0006011721190621049, 0.000602199547435836, 0.0006032273355513697, 0.0006042554832279719, 0.000605283990285278, 0.0006063128565432914, 0.000607342081822382, 0.0006083716659432852, 0.0006094016087271009, 0.0006104319099952917, 0.0006114625695696821, 0.0006124935872724571, 0.0006135249629261612, 0.0006145566963536969, 0.0006155887873783236, 0.0006166212358236566, 0.0006176540415136657, 0.0006186872042726738, 0.0006197207239253562, 0.0006207546002967393, 0.0006217888332121992, 0.0006228234224974605, 0.0006238583679785958, 0.0006248936694820234, 0.0006259293268345073, 0.0006269653398631554, 0.0006280017083954185, 0.0006290384322590893, 0.0006300755112823009, 0.0006311129452935264, 0.0006321507341215768, 0.0006331888775956009, 0.0006342273755450834, 0.0006352662277998443, 0.0006363054341900374, 0.0006373449945461496, 0.0006383849086989996, 0.0006394251764797367, 0.0006404657977198403, 0.0006415067722511179, 0.0006425480999057049, 0.0006435897805160629, 0.0006446318139149791, 0.0006456741999355651, 0.0006467169384112558, 0.0006477600291758083, 0.0006488034720633009, 0.0006498472669081323, 0.0006508914135450202, 0.0006519359118090006, 0.0006529807615354265, 0.0006540259625599671, 0.0006550715147186067, 0.0006561174178476438, 0.0006571636717836898, 0.0006582102763636683, 0.0006592572314248141, 0.0006603045368046721, 0.0006613521923410963, 0.0006624001978722488, 0.0006634485532365991, 0.0006644972582729226, 0.0006655463128203002, 0.0006665957167181171, 0.0006676454698060617, 0.0006686955719241248, 0.0006697460229125987, 0.0006707968226120762, 0.0006718479708634496, 0.0006728994675079097, 0.0006739513123869452, 0.0006750035053423414, 0.0006760560462161794, 0.0006771089348508352, 0.000678162171088979, 0.0006792157547735738, 0.0006802696857478748, 0.0006813239638554286, 0.000682378588940072, 0.0006834335608459314, 0.0006844888794174217, 0.0006855445444992455, 0.0006866005559363921, 0.0006876569135741367, 0.0006887136172580398, 0.0006897706668339457, 0.0006908280621479824, 0.0006918858030465599, 0.0006929438893763699, 0.0006940023209843848, 0.000695061097717857, 0.0006961202194243177, 0.0006971796859515764, 0.0006982394971477197, 0.0006992996528611108, 0.0007003601529403885, 0.0007014209972344662, 0.0007024821855925317, 0.0007035437178640456, 0.0007046055938987408, 0.0007056678135466218, 0.0007067303766579635, 0.0007077932830833111, 0.0007088565326734786, 0.0007099201252795482, 0.0007109840607528695, 0.000712048338945059, 0.0007131129597079988, 0.0007141779228938362, 0.0007152432283549826, 0.000716308875944113, 0.0007173748655141649, 0.000718441196918338, 0.0007195078700100929, 0.0007205748846431508, 0.0007216422406714922, 0.0007227099379493565, 0.0007237779763312413, 0.0007248463556719015, 0.0007259150758263483, 0.000726984136649849, 0.0007280535379979256, 0.0007291232797263547, 0.0007301933616911665, 0.0007312637837486435, 0.0007323345457553207, 0.0007334056475679842, 0.0007344770890436709, 0.0007355488700396674, 0.0007366209904135096, 0.0007376934500229815, 0.0007387662487261153, 0.0007398393863811896, 0.0007409128628467297, 0.0007419866779815061, 0.0007430608316445345, 0.0007441353236950744, 0.0007452101539926288, 0.0007462853223969437, 0.0007473608287680068, 0.0007484366729660471, 0.0007495128548515346, 0.000750589374285179, 0.0007516662311279292, 0.0007527434252409728, 0.0007538209564857353, 0.0007548988247238794, 0.0007559770298173043, 0.0007570555716281452, 0.0007581344500187722, 0.0007592136648517902, 0.0007602932159900378, 0.0007613731032965871, 0.0007624533266347423, 0.0007635338858680399, 0.0007646147808602473, 0.0007656960114753627, 0.0007667775775776142, 0.000767859479031459, 0.000768941715701583, 0.0007700242874529004, 0.0007711071941505523, 0.0007721904356599069, 0.0007732740118465581, 0.0007743579225763256, 0.0007754421677152538, 0.0007765267471296111, 0.0007776116606858899, 0.000778696908250805, 0.000779782489691294, 0.0007808684048745161, 0.0007819546536678513, 0.0007830412359389004, 0.000784128151555484, 0.000785215400385642, 0.0007863029822976327, 0.0007873908971599327, 0.0007884791448412361, 0.0007895677252104538, 0.0007906566381367128, 0.000791745883489356, 0.0007928354611379411, 0.0007939253709522405, 0.0007950156128022405, 0.0007961061865581407, 0.0007971970920903532, 0.0007982883292695025, 0.0007993798979664245, 0.0008004717980521664, 0.0008015640293979856, 0.0008026565918753493, 0.000803749485355934, 0.000804842709711625, 0.0008059362648145157, 0.0008070301505369072, 0.0008081243667513073, 0.0008092189133304306, 0.0008103137901471975, 0.0008114089970747337, 0.0008125045339863698, 0.0008136004007556405, 0.0008146965972562844, 0.0008157931233622432, 0.0008168899789476609, 0.000817987163886884, 0.0008190846780544604, 0.000820182521325139, 0.000821280693573869, 0.0008223791946757996, 0.0008234780245062795, 0.0008245771829408561, 0.0008256766698552753, 0.0008267764851254807, 0.0008278766286276131, 0.0008289771002380103, 0.0008300778998332061, 0.0008311790272899301, 0.0008322804824851071, 0.0008333822652958567, 0.0008344843755994925, 0.0008355868132735218, 0.0008366895781956452, 0.0008377926702437558, 0.0008388960892959388, 0.0008399998352304713, 0.0008411039079258212, 0.0008422083072606473, 0.0008433130331137983, 0.0008444180853643128, 0.0008455234638914185, 0.0008466291685745316, 0.0008477351992932567, 0.0008488415559273856, 0.000849948238356898, 0.0008510552464619598, 0.0008521625801229232, 0.0008532702392203263, 0.0008543782236348923, 0.0008554865332475293, 0.0008565951679393296, 0.0008577041275915693, 0.000858813412085708, 0.0008599230213033883, 0.0008610329551264347, 0.0008621432134368542, 0.0008632537961168351, 0.0008643647030487467, 0.0008654759341151386, 0.0008665874891987409, 0.0008676993681824631, 0.000868811570949394, 0.0008699240973828012, 0.00087103694736613, 0.0008721501207830043, 0.0008732636175172248, 0.0008743774374527695, 0.0008754915804737925, 0.000876606046464624, 0.0008777208353097698, 0.0008788359468939111, 0.0008799513811019033, 0.0008810671378187765, 0.0008821832169297342, 0.0008832996183201536, 0.0008844163418755845, 0.0008855333874817496, 0.0008866507550245432, 0.0008877684443900315, 0.000888886455464452 ];
  public static readonly ONE_LITER_BOUNDS = new Bounds3( -0.15132071936070812, -0.022069290184621743, -0.060819751525856225, 0.08750126678357006, 0.03596482386676778, 0.060819751525856225 );
  public static readonly ONE_LITER_INTERIOR_BOTTOM = -0.019283652710155048;
  public static readonly ONE_LITER_HULL_VOLUME = BoatDesign.DESIGN_HULL_VOLUME * BoatDesign.ONE_LITER_SCALE_MULTIPLIER * BoatDesign.ONE_LITER_SCALE_MULTIPLIER * BoatDesign.ONE_LITER_SCALE_MULTIPLIER;
}

densityBuoyancyCommon.register( 'BoatDesign', BoatDesign );