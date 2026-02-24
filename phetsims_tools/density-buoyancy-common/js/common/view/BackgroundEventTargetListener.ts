// Copyright 2024-2025, University of Colorado Boulder

/**
 * BackgroundEventTargetListener supports dragging masses around the screen and changing the cursor when it is over a
 * draggable mass.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Bounds2 from '../../../../dot/js/Bounds2.js';
import Plane3 from '../../../../dot/js/Plane3.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import ThreeIsometricNode from '../../../../mobius/js/ThreeIsometricNode.js';
import arrayRemove from '../../../../phet-core/js/arrayRemove.js';
import Pointer from '../../../../scenery/js/input/Pointer.js';
import SceneryEvent from '../../../../scenery/js/input/SceneryEvent.js';
import TInputListener from '../../../../scenery/js/input/TInputListener.js';
import sharedSoundPlayers from '../../../../tambo/js/sharedSoundPlayers.js';
import EventType from '../../../../tandem/js/EventType.js';
import PhetioAction from '../../../../tandem/js/PhetioAction.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyModel from '../model/DensityBuoyancyModel.js';
import Mass from '../model/Mass.js';
import DensityBuoyancyScreenView from './DensityBuoyancyScreenView.js';
import MassView from './MassView.js';

export default class BackgroundEventTargetListener implements TInputListener {
  private readonly draggedMasses: Mass[] = [];

  private readonly startDragAction: PhetioAction<[ Mass, Vector2 ]>;
  private readonly updateDragAction: PhetioAction<[ Mass, Vector2 ]>;
  private readonly endDragAction: PhetioAction<[ Mass ]>;
  private readonly grabSoundPlayer = sharedSoundPlayers.get( 'grab' );
  private readonly releaseSoundPlayer = sharedSoundPlayers.get( 'release' );

  // Using a "create" function here because that makes it easier to implement TInputListener
  public constructor( private readonly massViews: MassView[],
                      private readonly getMassViewUnderPoint: DensityBuoyancyScreenView<DensityBuoyancyModel>['getMassViewUnderPoint'],
                      private readonly getRayFromScreenPoint: ThreeIsometricNode['getRayFromScreenPoint'],
                      private readonly modelToGlobalViewPoint: ( point: Vector3 ) => Vector2,
                      private readonly updatePointerOver: ( pointer: Pointer ) => void,
                      tandem: Tandem ) {

    this.startDragAction = new PhetioAction( ( mass: Mass, position: Vector2 ) => mass.startDrag( position ), {
      tandem: tandem.createTandem( 'startDragAction' ),
      phetioDocumentation: 'Starts the dragging of a mass',
      phetioReadOnly: true,
      phetioEventType: EventType.USER,
      parameters: [ {
        name: 'mass',
        phetioType: Mass.MassIO
      }, {
        name: 'position',
        phetioType: Vector2.Vector2IO
      } ]
    } );

    this.updateDragAction = new PhetioAction( ( mass: Mass, position: Vector2 ) => mass.updateDrag( position ), {
      tandem: tandem.createTandem( 'updateDragAction' ),
      phetioDocumentation: 'Continues the dragging of a mass',
      phetioReadOnly: true,
      phetioEventType: EventType.USER,
      parameters: [ {
        name: 'mass',
        phetioType: Mass.MassIO
      }, {
        name: 'position',
        phetioType: Vector2.Vector2IO
      } ]
    } );

    this.endDragAction = new PhetioAction( ( mass: Mass ) => mass.endDrag(), {
      tandem: tandem.createTandem( 'endDragAction' ),
      phetioDocumentation: 'Continues the dragging of a mass',
      phetioReadOnly: true,
      phetioEventType: EventType.USER,
      parameters: [ {
        name: 'mass',
        phetioType: Mass.MassIO
      } ]
    } );
  }

  public move( event: SceneryEvent<MouseEvent | TouchEvent | PointerEvent> ): void {
    this.updatePointerOver( event.pointer ); // Update for mouse and touch
  }

  public down( event: SceneryEvent<MouseEvent | TouchEvent | PointerEvent> ): void {
    if ( !event.canStartPress() ) { return; }

    const pointer = event.pointer;
    const massEntry = this.getMassViewUnderPoint( pointer.point );

    if ( massEntry && massEntry.massView.mass.canMove ) {
      const mass = massEntry.massView.mass;

      // Newer interactions take precedent, so clean up any old ones first. This also makes mouse/keyboard
      // cross-interaction much simpler.
      mass.interruptedEmitter.emit();

      this.grabSoundPlayer.play();

      const initialRay = this.getRayFromScreenPoint( pointer.point );
      const initialT = massEntry.t;
      if ( initialT === null ) {
        return;
      }
      const initialPosition = initialRay.pointAtDistance( initialT );
      const initialPlane = new Plane3( Vector3.Z_UNIT, initialPosition.z );

      this.startDragAction.execute( mass, Vector2.from( initialPosition ) );
      pointer.cursor = 'pointer';

      const endDrag = () => {
        pointer.removeInputListener( listener );
        arrayRemove( this.draggedMasses, mass );
        mass.interruptedEmitter.removeListener( endDrag );
        pointer.cursor = null;
        this.releaseSoundPlayer.play();
        this.endDragAction.execute( mass );
      };

      const listener: TInputListener = {
        // end drag on either up or cancel (not supporting full cancel behavior)
        up: endDrag,
        cancel: endDrag,
        interrupt: endDrag,

        move: () => {
          const ray = this.getRayFromScreenPoint( pointer.point );
          const position = initialPlane.intersectWithRay( ray );

          this.updateDragAction.execute( mass, Vector2.from( position ) );
        },

        createPanTargetBounds: () => {
          return this.draggedMasses.reduce( ( bounds: Bounds2, mass: Mass ): Bounds2 => {
            const massView = _.find( this.massViews, massView => massView.mass === mass )!;
            const bbox = new THREE.Box3().setFromObject( massView.massMesh );

            // Include all 8 corners of the bounding box
            bounds = bounds.withPoint( this.modelToGlobalViewPoint( new Vector3( bbox.min.x, bbox.min.y, bbox.min.z ) ) );
            bounds = bounds.withPoint( this.modelToGlobalViewPoint( new Vector3( bbox.min.x, bbox.min.y, bbox.max.z ) ) );
            bounds = bounds.withPoint( this.modelToGlobalViewPoint( new Vector3( bbox.min.x, bbox.max.y, bbox.min.z ) ) );
            bounds = bounds.withPoint( this.modelToGlobalViewPoint( new Vector3( bbox.min.x, bbox.max.y, bbox.max.z ) ) );
            bounds = bounds.withPoint( this.modelToGlobalViewPoint( new Vector3( bbox.max.x, bbox.min.y, bbox.min.z ) ) );
            bounds = bounds.withPoint( this.modelToGlobalViewPoint( new Vector3( bbox.max.x, bbox.min.y, bbox.max.z ) ) );
            bounds = bounds.withPoint( this.modelToGlobalViewPoint( new Vector3( bbox.max.x, bbox.max.y, bbox.min.z ) ) );
            bounds = bounds.withPoint( this.modelToGlobalViewPoint( new Vector3( bbox.max.x, bbox.max.y, bbox.max.z ) ) );

            return bounds;
          }, Bounds2.NOTHING );
        }
      };
      pointer.reserveForDrag();
      pointer.addInputListener( listener, true );
      this.draggedMasses.push( mass );

      mass.interruptedEmitter.addListener( endDrag );
    }
  }

  // Support interruption by subtree
  public interrupt(): void {
    this.draggedMasses.slice().forEach( mass => mass.interruptedEmitter.emit() );
  }
}

densityBuoyancyCommon.register( 'BackgroundEventTargetListener', BackgroundEventTargetListener );