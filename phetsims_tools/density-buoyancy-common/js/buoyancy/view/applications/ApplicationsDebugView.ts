// Copyright 2024-2025, University of Colorado Boulder

/**
 * ApplicationsDebugView extends DebugView to provide a 2D visual representation of the model, displayed as a semi-transparent overlay.
 * This class is specifically used to illustrate the boat's shape, displaced area, and displaced volume within the simulation.
 *
 * The view overlays a visual representation of the displaced area (in red) and displaced volume (in green) of the boat,
 * allowing for a clear and immediate understanding of how these properties change over time as the simulation progresses.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Bounds2 from '../../../../../dot/js/Bounds2.js';
import Matrix3 from '../../../../../dot/js/Matrix3.js';
import Vector2 from '../../../../../dot/js/Vector2.js';
import Shape from '../../../../../kite/js/Shape.js';
import ModelViewTransform2 from '../../../../../phetcommon/js/view/ModelViewTransform2.js';
import Path from '../../../../../scenery/js/nodes/Path.js';
import DensityBuoyancyModel from '../../../common/model/DensityBuoyancyModel.js';
import Mass from '../../../common/model/Mass.js';
import DebugView, { DebugMassNode } from '../../../common/view/DebugView.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import Boat from '../../model/applications/Boat.js';
import BuoyancyApplicationsModel from '../../model/applications/BuoyancyApplicationsModel.js';
import ApplicationsDebugMassNode from './ApplicationsDebugMassNode.js';

export default class ApplicationsDebugView extends DebugView {

  // Path representing the area displaced by the boat, illustrated with a red stroke.
  // This path visually scales proportionally to the displaced area at different vertical levels of the boat.
  private readonly boatAreaPath: Path;

  // Path representing the volume displaced by the boat, illustrated with a green stroke.
  // This path visually scales proportionally to the displaced volume at different vertical levels of the boat.
  private readonly boatVolumePath: Path;

  public constructor( model: BuoyancyApplicationsModel, layoutBounds: Bounds2 ) {
    super( model, layoutBounds );

    // Initialize and add the path for the displaced area.
    this.boatAreaPath = new Path( null, {
      stroke: 'red'
    } );
    this.addChild( this.boatAreaPath );

    // Initialize and add the path for the displaced volume.
    this.boatVolumePath = new Path( null, {
      stroke: 'green'
    } );
    this.addChild( this.boatVolumePath );
  }

  /**
   * Advances the state of the view to the next time step.
   *
   * @param dt - The time step duration to advance the simulation.
   */
  public override step( dt: number ): void {
    super.step( dt );

    // Handle the visual representation of the boat, if it is currently visible in the simulation.
    const boat = this.model.visibleMasses.find( mass => mass instanceof Boat );
    if ( boat instanceof Boat ) {

      // Generate a range of y-values across the boat's vertical profile for displacement calculations.
      const boatYValues = _.range( boat.stepBottom, boat.stepTop, 0.002 );

      // Locate the visual node that corresponds to the boat's mass in the simulation.
      const boatNode = _.find( this.massNodes, massNode => massNode.mass === boat )!;

      // Generate the shape representing the displaced area of the boat at various y levels.
      const boatAreaShape = new Shape();
      boatYValues.map( y => new Vector2( boat.basin.getDisplacedArea( y ), y ) ).forEach( point => {
        boatAreaShape.lineTo( boatNode.right + point.x * 2000, this.modelViewTransform.modelToViewY( point.y ) );
      } );
      this.boatAreaPath.shape = boatAreaShape;

      // Generate the shape representing the displaced volume of the boat at various y levels.
      const boatVolumeShape = new Shape();
      boatYValues.map( y => new Vector2( boat.basin.getDisplacedVolume( y ), y ) ).forEach( point => {
        boatVolumeShape.lineTo( boatNode.right + point.x * 10000, this.modelViewTransform.modelToViewY( point.y ) );
      } );
      this.boatVolumePath.shape = boatVolumeShape;
    }
    else {

      // Clear the paths if the boat is not visible.
      this.boatAreaPath.shape = null;
      this.boatVolumePath.shape = null;
    }
  }

  /**
   * Creates a specialized debug mass node for the given mass within the model.
   *
   * @param model - The model instance containing the simulation data.
   * @param mass - The specific mass for which the debug node is created.
   * @param modelViewTransform - The transformation applied between the model and view coordinates.
   * @returns The debug mass node for the specified mass.
   */
  protected override createDebugMassNode( model: DensityBuoyancyModel, mass: Mass, modelViewTransform: ModelViewTransform2 ): DebugMassNode {
    return new ApplicationsDebugMassNode( model, mass, modelViewTransform );
  }

  /**
   * Modifies the given pool shape by subtracting the shape of the specified mass.
   * For boat masses, it further subtracts the shape of the displaced volume at a given scale.
   *
   * @param mass - The mass whose shape will be subtracted from the pool shape.
   * @param poolShape - The current shape of the pool to be mutated.
   * @returns The mutated pool shape with the mass subtracted.
   */
  protected override mutatePoolShape( mass: Mass, poolShape: Shape ): Shape {
    try {
      poolShape = poolShape.shapeDifference( mass.shapeProperty.value.transformed( mass.matrix ) );
      if ( mass instanceof Boat ) {
        const multiplier = Math.pow( mass.maxVolumeDisplacedProperty.value / 0.001, 1 / 3 );
        poolShape = poolShape.shapeDifference( mass.basin.oneLiterShape.transformed( Matrix3.scaling( multiplier ) ).transformed( mass.matrix ) );
      }
    }
    catch( e ) {
      console.log( e );
    }
    return poolShape;
  }
}

densityBuoyancyCommon.register( 'ApplicationsDebugView', ApplicationsDebugView );