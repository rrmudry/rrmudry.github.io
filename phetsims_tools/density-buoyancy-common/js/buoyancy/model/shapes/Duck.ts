// Copyright 2019-2025, University of Colorado Boulder

/**
 * An adjustable Duck
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Bounds3 from '../../../../../dot/js/Bounds3.js';
import ConvexHull2 from '../../../../../dot/js/ConvexHull2.js';
import Utils from '../../../../../dot/js/Utils.js';
import Vector2 from '../../../../../dot/js/Vector2.js';
import Vector3 from '../../../../../dot/js/Vector3.js';
import Shape from '../../../../../kite/js/Shape.js';
import optionize, { EmptySelfOptions } from '../../../../../phet-core/js/optionize.js';
import { MassShape } from '../../../common/model/MassShape.js';
import PhysicsEngine from '../../../common/model/PhysicsEngine.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import { flatDuckData } from './DuckData.js';
import Ellipsoid, { EllipsoidOptions } from './Ellipsoid.js';

type SelfOptions = EmptySelfOptions;
export type DuckOptions = SelfOptions & EllipsoidOptions;

export default class Duck extends Ellipsoid {
  public constructor( engine: PhysicsEngine, size: Bounds3, providedConfig: DuckOptions ) {

    const options = optionize<DuckOptions, EmptySelfOptions, EllipsoidOptions>()( {
      body: engine.createFromVertices( Duck.getDuckVertices( size.width, size.height ), false ),
      shape: Duck.getDuckShape( size.width, size.height ),
      volume: Ellipsoid.getVolume( size ),
      massShape: MassShape.DUCK
    }, providedConfig );

    super( engine, size, options );
  }

  /**
   * Updates the size of the duck.
   */
  protected override updateSize( size: Bounds3 ): void {
    const vertices = Duck.getDuckVertices( size.width, size.height );
    this.engine.updateFromVertices( this.body, vertices, true );
    this.sizeProperty.value = size;
    this.shapeProperty.value = Duck.getDuckShape( size.width, size.height );

    this.volumeProperty.value = Duck.getVolume( size );

    this.forceOffsetProperty.value = new Vector3( 0, 0, size.maxZ );
    this.massLabelOffsetProperty.value = new Vector3( 0, size.minY * 0.5, size.maxZ * 0.7 );

    // Keep the body centered, see https://github.com/phetsims/buoyancy/issues/148
    this.bodyOffsetProperty.value = Utils.centroidOfPolygon( vertices ).negated();
    this.writeData();
  }

  /**
   * Returns a duck shape
   */
  private static getDuckShape( width: number, height: number ): Shape {
    return Shape.polygon( Duck.getDuckVertices( width, height ) );
  }

  /**
   * Returns vertices for a duck
   */
  private static getDuckVertices( width: number, height: number ): Vector2[] {
    const vertices = this.getFlatGeometry();

    // Scale the vertices to the given width and height
    const vector2s = vertices.map( vertex => vertex.componentTimes( new Vector2( width, height ) ) );

    return ConvexHull2.grahamScan( vector2s, false );
  }

  private static getFlatGeometry(): Vector2[] {
    return flatDuckData;
  }
}

densityBuoyancyCommon.register( 'Duck', Duck );