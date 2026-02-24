// Copyright 2019-2026, University of Colorado Boulder

/**
 * The base type for 3D views of any type of mass.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Disposable from '../../../../axon/js/Disposable.js';
import Emitter from '../../../../axon/js/Emitter.js';
import Multilink from '../../../../axon/js/Multilink.js';
import Property from '../../../../axon/js/Property.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Bounds2 from '../../../../dot/js/Bounds2.js';
import ConvexHull2 from '../../../../dot/js/ConvexHull2.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import Shape from '../../../../kite/js/Shape.js';
import { THREEModelViewTransform } from '../../../../mobius/js/MobiusScreenView.js';
import ModelViewTransform2 from '../../../../phetcommon/js/view/ModelViewTransform2.js';
import GrabDragInteraction from '../../../../scenery-phet/js/accessibility/grab-drag/GrabDragInteraction.js';
import WASDCueNode from '../../../../scenery-phet/js/accessibility/nodes/WASDCueNode.js';
import HighlightPath from '../../../../scenery/js/accessibility/HighlightPath.js';
import InteractiveHighlighting, { InteractiveHighlightingOptions } from '../../../../scenery/js/accessibility/voicing/InteractiveHighlighting.js';
import KeyboardDragListener from '../../../../scenery/js/listeners/KeyboardDragListener.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Path, { InputShape, PathOptions } from '../../../../scenery/js/nodes/Path.js';
import sharedSoundPlayers from '../../../../tambo/js/sharedSoundPlayers.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import Mass from '../model/Mass.js';
import MassTag from '../model/MassTag.js';
import MassDecorationLayer from './MassDecorationLayer.js';
import MassTagNode from './MassTagNode.js';
import MassThreeMesh from './MassThreeMesh.js';

const INVERT_Y_TRANSFORM = ModelViewTransform2.createSinglePointScaleInvertedYMapping( Vector2.ZERO, Vector2.ZERO, 1 );

// Empty shape to use when 3d objects are not focused
const emptyShapeProperty = new Property( Shape.rectangle( 0, 0, 0, 0 ) );

export default abstract class MassView extends Disposable {

  public readonly massMesh: MassThreeMesh;

  private readonly massTagNode: Node | null = null;
  protected readonly tagOffsetProperty: Property<Vector3> = new Property<Vector3>( Vector3.ZERO );

  // The focusablePath.shapeProperty is controlled by the following two Property instances. If either is true, the
  // focusablePath will be highlighted.
  public readonly isCursorOverProperty = new Property( false );
  public readonly isKeyboardFocusedProperty = new Property( false );

  // The focusableShape for when the mouse or keyboard has focused the shape. It's an alternative to the emptyShapeProperty above
  public readonly focusableShapeProperty = new Property( new Shape() );

  public readonly focusablePath: InteractiveHighlightingPath | null = null;
  private readonly grabDragInteraction: GrabDragInteraction | null = null;

  public readonly sceneNodeRenderedEmitter = new Emitter();

  protected constructor( public readonly mass: Mass,
                         initialGeometry: THREE.BufferGeometry,
                         protected readonly modelViewTransform: THREEModelViewTransform,
                         interactionCueParentNode: Node,
                         isDisposable = true ) {

    super( {
      isDisposable: isDisposable
    } );

    this.massMesh = new MassThreeMesh( mass, initialGeometry );

    if ( mass.tag !== MassTag.NONE ) {

      this.massTagNode = new MassTagNode( this.mass.tag );

      const repositionMassTagNode = () => {
        assert && assert( this.massTagNode, 'do not reposition massTagNode if you do not have a massTag' );
        this.massTagNode!.translation = modelViewTransform.modelToViewPoint( Vector3.from( mass.matrix.translation ).plus( this.tagOffsetProperty.value ).plusXYZ( 0, 0, 0.0001 ) );
      };

      this.tagOffsetProperty.lazyLink( repositionMassTagNode, { disposer: this } );

      // This will call repositionMassTagNode during startup, when Sim.ts calls layout()
      this.sceneNodeRenderedEmitter.addListener( repositionMassTagNode, { disposer: this } );
      mass.transformedEmitter.addListener( repositionMassTagNode, { disposer: this } );
    }

    // sound generation
    const grabSoundPlayer = sharedSoundPlayers.get( 'grab' );
    const releaseSoundPlayer = sharedSoundPlayers.get( 'release' );

    if ( mass.canMove ) {
      const focusHighlightPath = new HighlightPath( this.focusableShapeProperty );
      const interactiveHighlightPath = new HighlightPath( this.focusableShapeProperty );

      this.focusablePath = new InteractiveHighlightingPath( this.focusableShapeProperty, {
        // Prefer HighlightPath to HighlightFromNode here, since we must accommodate the empty shape when not highlighted
        focusHighlight: focusHighlightPath,
        interactiveHighlight: interactiveHighlightPath,
        inputEnabledProperty: mass.inputEnabledProperty
      } );

      // Scenery provides isFocused() as a method, but we must convert it to a Property so we can observe changes.
      this.focusablePath.addInputListener( {
        focus: () => {
          this.isKeyboardFocusedProperty.value = true;
        },
        blur: () => {
          this.isKeyboardFocusedProperty.value = false;
        }
      } );

      // If the cursor is over the mass, or if the mass has keyboard focus, show the interactive highlight.
      Multilink.multilink( [ this.isCursorOverProperty, this.isKeyboardFocusedProperty ], ( isCursorOver, isKeyboardFocused ) => {

        this.focusablePath!.shapeProperty = isCursorOver || isKeyboardFocused ?
                                            this.focusableShapeProperty : emptyShapeProperty;
      } );

      const endKeyboardInteraction = () => {

        // When this function is called, it should only be done because keyboard is in control of input. This prevents
        // multi-input bugs like https://github.com/phetsims/density-buoyancy-common/issues/356
        assert && assert( mass.interruptedEmitter.hasListener( endKeyboardInteraction ), 'must have this listener to call it' );
        mass.interruptedEmitter.removeListener( endKeyboardInteraction );

        releaseSoundPlayer.play();
        mass.endDrag();
      };

      const keyboardDragListener = new KeyboardDragListener( {

        // In model units per second
        dragSpeed: 3,
        shiftDragSpeed: 0.5,

        // This is needed for keyboard but not for mouse/touch because keyboard input applies deltas, not absolute positions
        transform: INVERT_Y_TRANSFORM,
        drag: ( event, listener ) => {
          mass.grabDragUsageTracker.shouldShowDragCue = false;
          mass.updateDrag( mass.matrix.translation.add( listener.modelDelta ) );
        },
        tandem: Tandem.OPT_OUT
      } );

      const dragCueBoundsProperty = new Property( Bounds2.create( mass.getBounds() ) );

      const wasdCueNode = new WASDCueNode( dragCueBoundsProperty );
      this.grabDragInteraction = new GrabDragInteraction( this.focusablePath, keyboardDragListener, interactionCueParentNode, {
        grabCueOffset: new Vector2( 0, DensityBuoyancyCommonConstants.MARGIN_SMALL ),
        onGrab: inputType => {

          // Do not start a mass drag from GrabDragInteraction unless it is from keyboard input.
          if ( inputType === 'pointer' ) {
            return;
          }

          // We want the newer interaction to take precedent, so tabbing to the item should interrupt the previous mouse drag (if applicable).
          mass.interruptedEmitter.emit();

          mass.interruptedEmitter.addListener( endKeyboardInteraction );
          grabSoundPlayer.play();
          mass.startDrag( mass.matrix.translation );
        },
        onRelease: () => {

          // This is an awkward metric to determine if the GrabDrag is in control of input at this time. It is easier
          // than manually tracking other forms of input (like mouse/touch).
          mass.interruptedEmitter.hasListener( endKeyboardInteraction ) && endKeyboardInteraction();
        },
        dragCueNode: wasdCueNode,
        grabDragUsageTracker: mass.grabDragUsageTracker,
        tandem: Tandem.OPT_OUT,
        objectToGrabString: this.mass.accessibleName
      } );

      const massTransformedListener = () => {

        if ( this.focusablePath && this.grabDragInteraction && !this.focusablePath.isDisposed ) {

          const shiftedBbox = mass.getBounds();

          // To support dragging while zoomed in, KeyboardDragListener will keep the position of the focusablePath in view.
          this.focusablePath.center = modelViewTransform.modelToViewPoint( shiftedBbox.center );

          // The points that make up the corners of the Bounds3 in THREE.js space, applied onto a 2d plane for scenery.
          const massViewPoints = [
            modelViewTransform.modelToViewPoint( new Vector3( shiftedBbox.minX, shiftedBbox.minY, shiftedBbox.minZ ) ),
            modelViewTransform.modelToViewPoint( new Vector3( shiftedBbox.minX, shiftedBbox.minY, shiftedBbox.maxZ ) ),
            modelViewTransform.modelToViewPoint( new Vector3( shiftedBbox.minX, shiftedBbox.maxY, shiftedBbox.minZ ) ),
            modelViewTransform.modelToViewPoint( new Vector3( shiftedBbox.minX, shiftedBbox.maxY, shiftedBbox.maxZ ) ),
            modelViewTransform.modelToViewPoint( new Vector3( shiftedBbox.maxX, shiftedBbox.minY, shiftedBbox.minZ ) ),
            modelViewTransform.modelToViewPoint( new Vector3( shiftedBbox.maxX, shiftedBbox.minY, shiftedBbox.maxZ ) ),
            modelViewTransform.modelToViewPoint( new Vector3( shiftedBbox.maxX, shiftedBbox.maxY, shiftedBbox.minZ ) ),
            modelViewTransform.modelToViewPoint( new Vector3( shiftedBbox.maxX, shiftedBbox.maxY, shiftedBbox.maxZ ) )
          ];

          // Update the shape based on the current view of the mass in 3d space
          const shape = Shape.polygon( ConvexHull2.grahamScan( massViewPoints, false ) );

          this.focusableShapeProperty.value = shape;

          dragCueBoundsProperty.value = shape.bounds;
        }
      };

      // Update the focusablePath shape when the mass is transformed. We are uncertain why we need to update this after
      // both the mass.transformedEmitter and the sceneNodeRenderedEmitter, but both are required or the shape will
      // lag or advance by a frame, see https://github.com/phetsims/density-buoyancy-common/issues/209
      this.sceneNodeRenderedEmitter.addListener( massTransformedListener, { disposer: this } );
      mass.transformedEmitter.addListener( massTransformedListener, { disposer: this } );

      this.disposeEmitter.addListener( () => {

        // In order to handle sequencing issues during disposal, start by blurring the focusablePath.
        // This ensures the downstream disposals will not try to use intermediate states that could cause problems.
        // see https://github.com/phetsims/density-buoyancy-common/issues/399
        this.focusablePath!.blur();

        this.grabDragInteraction!.dispose();
        keyboardDragListener.dispose();
        this.focusablePath!.dispose();
        focusHighlightPath.dispose();
        interactiveHighlightPath.dispose();
        wasdCueNode.dispose();
      } );
    }
    const resetListener = () => {

      // After reset, do not assume the cursor is over an object. It will be updated the next time the cursor moves.
      this.isCursorOverProperty.reset();

      // NOTE: Do not reset the focus state (isKeyboardFocusedProperty) because it may persist through a reset (like
      // with global keyboard shortcuts) https://github.com/phetsims/density-buoyancy-common/issues/399

      this.grabDragInteraction && this.grabDragInteraction.reset();
    };

    const positionListener = () => {
      const position = mass.matrix.translation;

      // LHS is NOT a Vector2, don't try to simplify this
      this.massMesh.position.x = position.x;
      this.massMesh.position.y = position.y;
    };

    this.mass.transformedEmitter.addListener( positionListener, { disposer: this } );
    this.mass.resetEmitter.addListener( resetListener, { disposer: this } );

    this.addDisposable( this.isCursorOverProperty,
      this.isKeyboardFocusedProperty,
      this.focusableShapeProperty );

    // Last, after declaring everything.
    positionListener();
  }

  // Override in subclasses to add subclass-specific behavior
  public step( dt: number ): void {

    // no-op by default
  }

  /**
   * Called after construction of the MassView, for supporting adding supplemental, non-THREE content to the screen view
   * to render the Mass. Please note this uses the term "decorate" as in adding a visual decoration,
   * as opposed to the software engineering term "decorator pattern".
   */
  public decorate( decorationLayer: MassDecorationLayer ): void {
    this.massTagNode && decorationLayer.massTagsLayer.addChild( this.massTagNode );
  }

  public undecorate( decorationLayer: MassDecorationLayer ): void {
    this.massTagNode && decorationLayer.massTagsLayer.removeChild( this.massTagNode );
  }

  public override dispose(): void {
    this.massMesh.dispose();

    this.massTagNode && this.massTagNode.dispose();

    this.sceneNodeRenderedEmitter.dispose();

    super.dispose();
  }
}

/**
 * Intermediate class to create a Path with InteractiveHighlightingNode.
 * @mixes InteractiveHighlighting
 */
class InteractiveHighlightingPath extends InteractiveHighlighting( Path ) {
  public constructor( shape: InputShape | TReadOnlyProperty<InputShape>, options?: InteractiveHighlightingOptions & PathOptions ) {
    super( shape, options );
  }
}

densityBuoyancyCommon.register( 'MassView', MassView );