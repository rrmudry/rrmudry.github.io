// Copyright 2020-2025, University of Colorado Boulder

/**
 * DebugView shows a 2d version of the model in a semi-transparent overlay. Enable it with ?showDebug
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Bounds2 from '../../../../dot/js/Bounds2.js';
import Matrix3 from '../../../../dot/js/Matrix3.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Shape from '../../../../kite/js/Shape.js';
import arrayRemove from '../../../../phet-core/js/arrayRemove.js';
import ModelViewTransform2 from '../../../../phetcommon/js/view/ModelViewTransform2.js';
import DragListener from '../../../../scenery/js/listeners/DragListener.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Path from '../../../../scenery/js/nodes/Path.js';
import Rectangle from '../../../../scenery/js/nodes/Rectangle.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyModel from '../model/DensityBuoyancyModel.js';
import Mass from '../model/Mass.js';

// constants
const scratchMatrix = new Matrix3();
const LINE_WIDTH = 0.1;

export default class DebugView extends Node {

  protected model: DensityBuoyancyModel;
  private layoutBounds: Bounds2;
  protected readonly modelViewTransform: ModelViewTransform2;
  private readonly poolPath: Path;
  protected readonly massNodes: DebugMassNode[];

  // proportional to the area at that level that is displaced in the pool
  private readonly poolAreaPath: Path;

  // proportional to the volume up to that level that is displaced in the pool
  private readonly poolVolumePath: Path;

  public constructor( model: DensityBuoyancyModel, layoutBounds: Bounds2 ) {
    super();

    this.model = model;
    this.layoutBounds = layoutBounds;
    this.modelViewTransform = ModelViewTransform2.createSinglePointScaleInvertedYMapping( Vector2.ZERO, this.layoutBounds.center, 600 );

    this.addChild( Rectangle.bounds( layoutBounds, {
      fill: 'rgba(255,255,255,0.5)'
    } ) );
    this.poolPath = new Path( null, {
      fill: 'rgba(0,128,255,0.5)',
      stroke: 'black',
      lineWidth: LINE_WIDTH
    } );
    this.addChild( this.poolPath );

    const modelPoolShape = Shape.polygon( model.groundPoints );
    const viewPoolShape = this.modelViewTransform.modelToViewShape( modelPoolShape );

    this.addChild( new Path( viewPoolShape, {
      fill: 'rgba(161,101,47,0.5)',
      stroke: 'black',
      lineWidth: LINE_WIDTH
    } ) );

    this.massNodes = [];

    const onMassAdded = ( mass: Mass ) => {
      const massNode = this.createDebugMassNode( model, mass, this.modelViewTransform );
      this.addChild( massNode );
      this.massNodes.push( massNode );
    };
    model.visibleMasses.addItemAddedListener( onMassAdded );
    model.visibleMasses.forEach( onMassAdded );

    model.visibleMasses.addItemRemovedListener( mass => {
      const massNode = _.find( this.massNodes, massNode => massNode.mass === mass )!;
      arrayRemove( this.massNodes, massNode );
      this.removeChild( massNode );
      massNode.dispose();
    } );

    this.poolAreaPath = new Path( null, {
      stroke: 'red'
    } );
    this.addChild( this.poolAreaPath );

    this.poolVolumePath = new Path( null, {
      stroke: 'green'
    } );
    this.addChild( this.poolVolumePath );
  }

  protected createDebugMassNode( model: DensityBuoyancyModel, mass: Mass, modelViewTransform: ModelViewTransform2 ): DebugMassNode {
    return new DebugMassNode( mass, modelViewTransform );
  }

  /**
   * Steps forward in time.
   */
  public step( dt: number ): void {
    if ( !this.visible ) {
      return;
    }

    let poolShape = Shape.bounds( new Bounds2(
      this.model.poolBounds.minX, this.model.poolBounds.minY,
      this.model.poolBounds.maxX, this.model.pool.fluidYInterpolatedProperty.value
    ) );
    this.model.visibleMasses.forEach( mass => {
      poolShape = this.mutatePoolShape( mass, poolShape );
    } );
    poolShape = this.modelViewTransform.modelToViewShape( poolShape );
    this.poolPath.shape = poolShape;

    const poolYValues = _.range( this.model.pool.stepBottom, this.model.pool.stepTop, 0.002 );

    const poolAreaShape = new Shape();
    poolYValues.map( y => new Vector2( this.model.pool.getDisplacedArea( y ), y ) ).forEach( point => {
      poolAreaShape.lineTo( this.modelViewTransform.modelToViewX( this.model.pool.bounds.maxX ) + point.x * 2000, this.modelViewTransform.modelToViewY( point.y ) );
    } );
    this.poolAreaPath.shape = poolAreaShape;

    const poolVolumeShape = new Shape();
    poolYValues.map( y => new Vector2( this.model.pool.getDisplacedVolume( y ), y ) ).forEach( point => {
      poolVolumeShape.lineTo( this.modelViewTransform.modelToViewX( this.model.pool.bounds.maxX ) + point.x * 10000, this.modelViewTransform.modelToViewY( point.y ) );
    } );
    this.poolVolumePath.shape = poolVolumeShape;
  }

  protected mutatePoolShape( mass: Mass, poolShape: Shape ): Shape {
    try {
      poolShape = poolShape.shapeDifference( mass.shapeProperty.value.transformed( mass.matrix ) );
    }
    catch( e ) {
      console.log( e );
    }
    return poolShape;
  }
}

export class DebugMassNode extends Node {

  public readonly mass: Mass;
  private readonly dragListener: DragListener;

  public constructor( mass: Mass, modelViewTransform: ModelViewTransform2 ) {
    super( {
      cursor: 'pointer'
    } );

    let path = new Path( null, {
      fill: 'rgba(160,255,100,0.5)',
      stroke: 'black',
      lineWidth: LINE_WIDTH
    } );
    this.addChild( path );

    const intersectionPath = new Path( null, {
      stroke: 'black',
      lineWidth: LINE_WIDTH
    } );
    this.addChild( intersectionPath );

    this.mass = mass;

    const shapeListener = ( shape: Shape ) => {
      const matrix = scratchMatrix.set( modelViewTransform.getMatrix() );

      // Zero out the translation
      matrix.set02( 0 );
      matrix.set12( 0 );

      path = this.getPathForMass( mass, path, intersectionPath, shape, matrix );
    };
    mass.shapeProperty.link( shapeListener );
    this.disposeEmitter.addListener( () => {
      mass.shapeProperty.unlink( shapeListener );
    } );

    const transformListener = () => {
      const viewMatrix = scratchMatrix.set( modelViewTransform.getMatrix() ).multiplyMatrix( mass.matrix );
      this.translation = viewMatrix.translation;
      this.rotation = viewMatrix.rotation;
    };
    mass.transformedEmitter.addListener( transformListener );
    this.disposeEmitter.addListener( () => {
      mass.transformedEmitter.removeListener( transformListener );
    } );
    transformListener();

    this.dragListener = new DragListener( {
      transform: modelViewTransform,
      applyOffset: false,
      start: ( event, listener ) => {
        mass.startDrag( listener.modelPoint );
      },
      drag: ( event, listener ) => {
        mass.updateDrag( listener.modelPoint );
      },
      end: () => {
        mass.endDrag();
      },
      tandem: Tandem.OPT_OUT
    } );
    this.addInputListener( this.dragListener );
  }

  protected getPathForMass( mass: Mass, path: Path, intersectionPath: Path, shape: Shape, matrix: Matrix3 ): Path {
    path.shape = shape.transformed( matrix );
    return path;
  }
}

densityBuoyancyCommon.register( 'DebugView', DebugView );