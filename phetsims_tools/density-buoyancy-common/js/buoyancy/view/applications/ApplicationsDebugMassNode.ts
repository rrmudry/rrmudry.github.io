// Copyright 2024-2025, University of Colorado Boulder

/**
 * ApplicationsDebugMassNode extends DebugMassNode to provide specialized visual representations
 * for masses in the Buoyancy simulation, particularly focusing on the boat's interactions with fluid.
 * It includes additional handling for visualizing the fluid displaced by the boat and its intersection with other objects.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Bounds2 from '../../../../../dot/js/Bounds2.js';
import Matrix3 from '../../../../../dot/js/Matrix3.js';
import Shape from '../../../../../kite/js/Shape.js';
import ModelViewTransform2 from '../../../../../phetcommon/js/view/ModelViewTransform2.js';
import Path from '../../../../../scenery/js/nodes/Path.js';
import Cube from '../../../common/model/Cube.js';
import DensityBuoyancyModel from '../../../common/model/DensityBuoyancyModel.js';
import Mass from '../../../common/model/Mass.js';
import { DebugMassNode } from '../../../common/view/DebugView.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import Boat from '../../model/applications/Boat.js';

// Constants
const scratchMatrix = new Matrix3();
const LINE_WIDTH = 0.1;

export default class ApplicationsDebugMassNode extends DebugMassNode {

  /**
   * Constructs an ApplicationsDebugMassNode, extending the standard DebugMassNode.
   * This node is designed to provide additional visualizations for masses, with special handling for boats.
   *
   * @param model - The DensityBuoyancyModel instance that drives the simulation.
   * @param mass - The specific Mass object to be visualized by this node.
   * @param modelViewTransform - The transformation applied between model and view coordinates.
   */
  public constructor( private model: DensityBuoyancyModel, mass: Mass, private readonly modelViewTransform: ModelViewTransform2 ) {
    assert && assert( !!modelViewTransform, 'modelViewTransform must be provided' );

    super( mass, modelViewTransform );

    this.specialBoatCase( mass );
  }

  /**
   * Applies special visualization logic for Boat objects.
   * This includes creating visual paths for the displaced fluid volume and handling intersections with other objects.
   *
   * @param mass - the boat
   */
  protected specialBoatCase( mass: Mass ): void {

    // Ensure the visualization logic only applies if the mass is a Boat and the modelViewTransform is available.
    if ( mass instanceof Boat && this.modelViewTransform ) {
      // Path for the visual representation of the fluid displaced by the boat.
      const fluidPath = new Path( null, {
        fill: 'rgba(0,128,255,0.5)',
        stroke: 'black',
        lineWidth: LINE_WIDTH
      } );
      this.addChild( fluidPath );

      // Path for the visual representation of the boat's hit area, non-interactive.
      const hitPath = new Path( null, {
        stroke: 'red',
        pickable: false
      } );
      this.addChild( hitPath );

      // Listener to update the hit area path based on the boat's displaced volume.
      const displacementListener = ( volume: number ) => {
        const matrix = scratchMatrix.set( this.modelViewTransform.getMatrix() );

        // Zero out the translation components to isolate scaling effects.
        matrix.set02( 0 );
        matrix.set12( 0 );

        // Calculate the scaling factor based on the displaced volume.
        const multiplier = Math.pow( volume / 0.001, 1 / 3 );
        const basinShape = mass.basin.oneLiterShape.transformed( Matrix3.scaling( multiplier ) );

        // Update the hit area path with the transformed shape.
        hitPath.shape = basinShape.transformed( matrix );
      };
      mass.maxVolumeDisplacedProperty.link( displacementListener );

      // Ensure the listener is removed when this node is disposed.
      this.disposeEmitter.addListener( () => {
        mass.maxVolumeDisplacedProperty.unlink( displacementListener );
      } );

      // @ts-expect-error - The block is assumed to be present in the model.
      const block: Cube = this.model.block;
      const fluidListener = () => {
        const y = mass.basin.fluidYInterpolatedProperty.value;

        // Only proceed if there is some fluid volume present.
        if ( mass.basin.fluidVolumeProperty.value > 0 ) {
          const matrix = scratchMatrix.set( this.modelViewTransform.getMatrix() );

          // Zero out the translation components to isolate scaling effects.
          matrix.set02( 0 );
          matrix.set12( 0 );

          // Invert the boat's transformation matrix for intersection calculations.
          const invertedMatrix = mass.matrix.inverted();

          // Calculate the scaling factor based on the maximum displaced volume.
          const multiplier = Math.pow( mass.maxVolumeDisplacedProperty.value / 0.001, 1 / 3 );
          const basinShape = mass.basin.oneLiterShape.transformed( Matrix3.scaling( multiplier ) );

          // Define a rectangle shape representing the fluid level, then transform it by the inverted matrix.
          const rectangleShape = Shape.bounds( new Bounds2( -10, -10, 10, y ) ).transformed( invertedMatrix );

          // Calculate the intersection of the rectangle with the basin shape.
          let fluidShape = rectangleShape.shapeIntersection( basinShape );

          // Assume the presence of a block and subtract its shape from the fluid shape.
          try {
            const blockShape = block.shapeProperty.value.transformed( block.matrix ).transformed( invertedMatrix );
            fluidShape = fluidShape.shapeDifference( blockShape );
          }
          catch( e ) {
            console.log( e );
          }

          // Apply the final transformation to the fluid shape and update the fluid path.
          fluidPath.shape = fluidShape.transformed( matrix );
        }
        else {
          // Clear the fluid path if no fluid volume is present.
          fluidPath.shape = null;
        }
      };
      mass.basin.fluidYInterpolatedProperty.link( fluidListener );
      block.shapeProperty.lazyLink( fluidListener );
      block.transformedEmitter.addListener( fluidListener );

      // Ensure the listeners are removed when this node is disposed.
      this.disposeEmitter.addListener( () => {
        mass.basin.fluidYInterpolatedProperty.unlink( fluidListener );
        block.shapeProperty.unlink( fluidListener );
        block.transformedEmitter.removeListener( fluidListener );
      } );
    }
  }

  /**
   * Overrides the method to provide a customized path for Boat objects.
   * The path accounts for the intersection of the boat with the fluid and other objects.
   *
   * @param mass - The Mass object to be visualized.
   * @param path - The Path object that will represent the mass's visual shape.
   * @param intersectionPath - The Path object that will represent intersection areas.
   * @param shape - The Shape object representing the mass's geometry.
   * @param matrix - The transformation matrix to apply to the shape.
   * @returns The updated Path object representing the mass.
   */
  protected override getPathForMass( mass: Mass, path: Path, intersectionPath: Path, shape: Shape, matrix: Matrix3 ): Path {
    if ( mass instanceof Boat ) {

      // Apply a scaling factor to the boat's basin shape based on the maximum displaced volume.
      const multiplier = Math.pow( mass.maxVolumeDisplacedProperty.value / 0.001, 1 / 3 );
      const basinShape = mass.basin.oneLiterShape.transformed( Matrix3.scaling( multiplier ) );

      // Subtract the basin shape from the mass shape to create the path, then apply the transformation matrix.
      path.shape = shape.shapeDifference( basinShape ).transformed( matrix );
      intersectionPath.shape = shape.transformed( matrix );
    }
    else {

      // For non-Boat objects, apply the transformation matrix directly to the mass shape.
      path.shape = shape.transformed( matrix );
    }
    return path;
  }
}

densityBuoyancyCommon.register( 'ApplicationsDebugMassNode', ApplicationsDebugMassNode );