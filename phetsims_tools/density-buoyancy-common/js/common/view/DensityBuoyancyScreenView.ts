// Copyright 2019-2025, University of Colorado Boulder

/**
 * The main base ScreenView for all Density/Buoyancy screens.
 *
 * This class is responsible for add THREE.js view for the primary objects of the sim. This includes, the pool,
 * masses (blocks/scales/etc), and the ground. It also adds the scenery input listener that wires into the THREE stage.
 *
 * Subtypes are responsible for adding the necessary masses, and creating scenery controls to adjust these.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Agustín Vallejo (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import createObservableArray, { ObservableArray } from '../../../../axon/js/createObservableArray.js';
import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import DynamicProperty from '../../../../axon/js/DynamicProperty.js';
import Emitter from '../../../../axon/js/Emitter.js';
import Property from '../../../../axon/js/Property.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Bounds2 from '../../../../dot/js/Bounds2.js';
import Plane3 from '../../../../dot/js/Plane3.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import MobiusQueryParameters from '../../../../mobius/js/MobiusQueryParameters.js';
import MobiusScreenView, { MobiusScreenViewOptions } from '../../../../mobius/js/MobiusScreenView.js';
import ThreeUtils from '../../../../mobius/js/ThreeUtils.js';
import { BufferGeometry } from '../../../../perennial-alias/node_modules/@types/three/index.js';
import arrayRemove from '../../../../phet-core/js/arrayRemove.js';
import optionize from '../../../../phet-core/js/optionize.js';
import platform from '../../../../phet-core/js/platform.js';
import PickRequired from '../../../../phet-core/js/types/PickRequired.js';
import { QueryStringMachine } from '../../../../query-string-machine/js/QueryStringMachineModule.js';
import ResetAllButton from '../../../../scenery-phet/js/buttons/ResetAllButton.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import Mouse from '../../../../scenery/js/input/Mouse.js';
import Pointer from '../../../../scenery/js/input/Pointer.js';
import ManualConstraint from '../../../../scenery/js/layout/constraints/ManualConstraint.js';
import AlignBox, { AlignBoxXAlign, AlignBoxYAlign } from '../../../../scenery/js/layout/nodes/AlignBox.js';
import animatedPanZoomSingleton from '../../../../scenery/js/listeners/animatedPanZoomSingleton.js';
import Image from '../../../../scenery/js/nodes/Image.js';
import { ImageableImage } from '../../../../scenery/js/nodes/Imageable.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Rectangle from '../../../../scenery/js/nodes/Rectangle.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import Color from '../../../../scenery/js/util/Color.js';
import ColorProperty from '../../../../scenery/js/util/ColorProperty.js';
import LinearGradient from '../../../../scenery/js/util/LinearGradient.js';
import Checkbox from '../../../../sun/js/Checkbox.js';
import { PhetioObjectOptions } from '../../../../tandem/js/PhetioObject.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import DisplayProperties from '../../buoyancy/view/DisplayProperties.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import DensityBuoyancyCommonQueryParameters from '../DensityBuoyancyCommonQueryParameters.js';
import Cuboid from '../model/Cuboid.js';
import DensityBuoyancyModel from '../model/DensityBuoyancyModel.js';
import Mass from '../model/Mass.js';
import Scale from '../model/Scale.js';
import BackgroundEventTargetListener from './BackgroundEventTargetListener.js';
import CuboidView from './CuboidView.js';
import DebugView from './DebugView.js';
import DensityBuoyancyCommonColors from './DensityBuoyancyCommonColors.js';
import FluidLevelIndicator from './FluidLevelIndicator.js';
import MassDecorationLayer from './MassDecorationLayer.js';
import MassView from './MassView.js';
import BarrierMesh from './mesh/BarrierMesh.js';
import FluidMesh from './mesh/FluidMesh.js';
import GroundFrontMesh from './mesh/GroundFrontMesh.js';
import GroundTopMesh from './mesh/GroundTopMesh.js';
import PoolMesh from './mesh/PoolMesh.js';
import ScaleView from './ScaleView.js';

// constants
const MARGIN = DensityBuoyancyCommonConstants.MARGIN_SMALL;

type SelfOptions = {
  cameraLookAt?: Vector3;
  cameraZoom?: number;
  canShowForces?: boolean;
  initialForceScale?: number;
  supportsDepthLines?: boolean;
  forcesInitiallyDisplayed?: boolean;
  massValuesInitiallyDisplayed?: boolean;
} & PickRequired<PhetioObjectOptions, 'tandem'>;

export type DensityBuoyancyScreenViewOptions = SelfOptions & MobiusScreenViewOptions;

export type PointedAtMassView = {
  massView: MassView;
  t: number;
};

export default class DensityBuoyancyScreenView<Model extends DensityBuoyancyModel> extends MobiusScreenView {

  protected readonly model: Model;
  protected readonly popupLayer: Node;
  protected readonly resetAllButton: Node;

  // The sky background
  private readonly skyRectangle: Rectangle;

  private readonly massDecorationLayer = new MassDecorationLayer();

  protected readonly massViews: ObservableArray<MassView>;

  private readonly debugView?: DebugView;

  // There is an invisible barrier that prevents objects from being dragged behind control panels.
  // Subtypes can provide their own values to control the barrier sizing.
  private readonly leftBarrierViewPointPropertyProperty: Property<TReadOnlyProperty<Vector2>>;
  protected readonly rightBarrierViewPointPropertyProperty: Property<TReadOnlyProperty<Vector2>>;

  protected readonly resetEmitter = new Emitter();

  protected readonly displayProperties: DisplayProperties;

  public constructor( model: Model, providedOptions: DensityBuoyancyScreenViewOptions ) {

    const scaleIncrease = 3.5;

    const options = optionize<DensityBuoyancyScreenViewOptions, SelfOptions, MobiusScreenViewOptions>()( {
      sceneNodeOptions: {
        parentMatrixProperty: animatedPanZoomSingleton.listener.matrixProperty,
        cameraPosition: new Vector3( 0, 0.2, 2 ).timesScalar( scaleIncrease ),
        viewOffset: new Vector2( 0, 0 ),
        getPhetioMouseHit: point => {
          const pointedAtMass = this.getMassViewUnderPoint( this.localToGlobalPoint( point ), 'autoselect' );
          return pointedAtMass ? pointedAtMass.massView.mass.getPhetioMouseHitTarget() : pointedAtMass;
        },

        // So the sky background will show through
        backgroundColorProperty: new ColorProperty( Color.TRANSPARENT ),

        threeRendererOptions: {

          // Reduce memory usage on mobile safari to prevent crashing by turning off antialiasing, see https://github.com/phetsims/density-buoyancy-common/issues/316.
          antialias: QueryStringMachine.containsKey( 'threeRendererAntialias' ) ? MobiusQueryParameters.threeRendererAntialias :
                     platform.mobileSafari ? false :
                     MobiusQueryParameters.threeRendererAntialias
        },

        // Reduce the pixel ratio on mobile safari to preserve memory and prevent crashing, see https://github.com/phetsims/density-buoyancy-common/issues/316
        threeRendererPixelRatio:
          QueryStringMachine.containsKey( 'threeRendererPixelRatio' ) ? MobiusQueryParameters.threeRendererPixelRatio :
          platform.mobileSafari ? ( window.devicePixelRatio ? window.devicePixelRatio * 0.5 : 1 ) :
          MobiusQueryParameters.threeRendererPixelRatio
      },
      cameraLookAt: DensityBuoyancyCommonConstants.DENSITY_CAMERA_LOOK_AT,
      cameraZoom: 1.75 * scaleIncrease,

      initialForceScale: 1 / 16,

      canShowForces: false,
      supportsDepthLines: false,
      forcesInitiallyDisplayed: false,
      massValuesInitiallyDisplayed: true
    }, providedOptions );

    const tandem = options.tandem;

    super( options );

    this.model = model;

    this.displayProperties = new DisplayProperties( options.tandem.createTandem( 'displayProperties' ), {
      canShowForces: options.canShowForces,
      supportsDepthLines: options.supportsDepthLines,
      forcesInitiallyDisplayed: options.forcesInitiallyDisplayed,
      massValuesInitiallyDisplayed: options.massValuesInitiallyDisplayed,
      initialForceScale: options.initialForceScale
    } );

    this.popupLayer = new Node();
    this.skyRectangle = new Rectangle( 0, 0, 1, 1, {
      pickable: false,
      fill: new LinearGradient( 0, 0, 0, 1 )
        .addColorStop( 0, DensityBuoyancyCommonColors.skyTopProperty )
        .addColorStop( 1, DensityBuoyancyCommonColors.skyBottomProperty )
    } );

    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    this.visibleBoundsProperty.link( visibleBounds => {
      this.skyRectangle.setRect( visibleBounds.left, visibleBounds.top, visibleBounds.width, visibleBounds.height );

      this.skyRectangle.fill = new LinearGradient( visibleBounds.centerX, visibleBounds.top, visibleBounds.centerX, visibleBounds.centerY )
        .addColorStop( 0, DensityBuoyancyCommonColors.skyTopProperty )
        .addColorStop( 1, DensityBuoyancyCommonColors.skyBottomProperty );
    } );
    this.addChild( this.skyRectangle );
    this.skyRectangle.moveToBack();

    this.addChild( this.massDecorationLayer );

    this.massViews = createObservableArray<MassView>();

    this.sceneNode.stage.threeCamera.zoom = options.cameraZoom;
    this.sceneNode.stage.threeCamera.up = new THREE.Vector3( 0, 0, -1 );
    this.sceneNode.stage.threeCamera.lookAt( ThreeUtils.vectorToThree( options.cameraLookAt ) );
    this.sceneNode.stage.threeCamera.updateMatrixWorld( true );
    this.sceneNode.stage.threeCamera.updateProjectionMatrix();

    const updatePointerOver = ( pointer: Pointer ) => {

      // When the mouse hovers over a mass, show the cursor hand
      const massUnderPointerEntry = this.getMassViewUnderPoint( pointer.point );
      if ( pointer instanceof Mouse ) {
        this.sceneNode.backgroundEventTarget.cursor = massUnderPointerEntry ? 'pointer' : null;
      }

      // This also needs to support touch, see https://github.com/phetsims/density-buoyancy-common/issues/363
      this.massViews.forEach( massView => {
        massView.isCursorOverProperty.value = massView === massUnderPointerEntry?.massView;
      } );
    };

    // Clear out the cursor if we don't have a pointer, see https://github.com/phetsims/density-buoyancy-common/issues/363
    const clearPointerOver = () => {
      this.sceneNode.backgroundEventTarget.cursor = null;
      this.massViews.forEach( massView => {
        massView.isCursorOverProperty.value = false;
      } );
    };

    const backgroundEventTargetListener = new BackgroundEventTargetListener(
      this.massViews,
      this.getMassViewUnderPoint.bind( this ),
      this.sceneNode.getRayFromScreenPoint.bind( this.sceneNode ),
      point => this.localToGlobalPoint( this.modelToViewPoint( point ) ),
      updatePointerOver,
      this.tandem.createTandem( 'backgroundEventTargetListener' )
    );
    this.sceneNode.backgroundEventTarget.addInputListener( backgroundEventTargetListener );

    // On re-layout or zoom, update the cursor also
    // This instance lives for the lifetime of the simulation, so we don't need to remove these listeners
    this.transformEmitter.addListener( clearPointerOver );
    animatedPanZoomSingleton.listener.matrixProperty.lazyLink( clearPointerOver );

    const ambientLight = new THREE.AmbientLight( 0x333333 );
    this.sceneNode.stage.threeScene.add( ambientLight );

    const sunLight = new THREE.DirectionalLight( 0xffffff, 1 );
    sunLight.position.set( -0.7, 1.5, 0.8 );
    this.sceneNode.stage.threeScene.add( sunLight );

    const moonLight = new THREE.DirectionalLight( 0xffffff, 0.2 );
    moonLight.position.set( 2.0, -1.0, 1.0 );
    this.sceneNode.stage.threeScene.add( moonLight );

    this.sceneNode.stage.threeScene.add( new GroundFrontMesh( model.poolBounds, model.groundBounds ) );
    this.sceneNode.stage.threeScene.add( new GroundTopMesh( model.poolBounds, model.groundBounds ) );
    this.sceneNode.stage.threeScene.add( new PoolMesh( model.poolBounds ) );

    // Debug barrier
    if ( DensityBuoyancyCommonQueryParameters.showBarrier ) {
      this.sceneNode.stage.threeScene.add( new BarrierMesh( model.invisibleBarrierBoundsProperty ) );
    }

    const fluidMesh = new FluidMesh( model.pool.fluidMaterialProperty, model.pool.fluidYInterpolatedProperty, this.fillFluidGeometry.bind( this ) );
    this.sceneNode.stage.threeScene.add( fluidMesh );
    fluidMesh.renderOrder = 10;

    const onMassAdded = ( mass: Mass ) => {
      const massView = this.getMassViewFromMass( mass );
      this.sceneNode.stage.threeScene.add( massView.massMesh );
      this.massViews.push( massView );
      massView.focusablePath && this.sceneNode.backgroundEventTarget.addChild( massView.focusablePath );
      massView.decorate( this.massDecorationLayer );
    };

    model.visibleMasses.addItemAddedListener( onMassAdded );
    model.visibleMasses.forEach( onMassAdded );

    const onMassRemoved = ( mass: Mass ) => {
      const massView = _.find( this.massViews, massView => massView.mass === mass )!;

      // Remove the mass view
      this.sceneNode.stage.threeScene.remove( massView.massMesh );
      arrayRemove( this.massViews, massView );

      // BottleView and BoatView persist to avoid memory leaks, see https://github.com/phetsims/density-buoyancy-common/issues/168#issuecomment-2293655205 and the following comment
      if ( massView.isDisposable ) {
        massView.dispose();
      }
      else {
        massView.focusablePath && this.sceneNode.backgroundEventTarget.removeChild( massView.focusablePath );
        massView.undecorate( this.massDecorationLayer );
      }
    };
    model.visibleMasses.addItemRemovedListener( onMassRemoved );

    const fluidLevelIndicator = new FluidLevelIndicator( model.pool.fluidLevelVolumeProperty );
    this.addChild( fluidLevelIndicator );

    // Update the fluid level indicator's position
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    model.pool.fluidYInterpolatedProperty.link( fluidY => {
      const modelPoint = new Vector3( model.poolBounds.minX, fluidY, model.poolBounds.maxZ );
      fluidLevelIndicator.translation = this.modelToViewPoint( modelPoint );
    } );

    this.resetAllButton = new ResetAllButton( {
      listener: () => {
        model.reset();
        this.resetEmitter.emit();
      },
      tandem: tandem.createTandem( 'resetAllButton' )
    } );
    this.addAlignBox( this.resetAllButton, 'right', 'bottom' );

    this.resetEmitter.addListener( () => {
      this.displayProperties.reset();
    } );

    if ( DensityBuoyancyCommonQueryParameters.showDebug ) {
      const debugVisibleProperty = new BooleanProperty( true );

      this.debugView = this.createDebugView();
      this.debugView.visibleProperty = debugVisibleProperty;
      this.popupLayer.addChild( this.debugView );
      this.addChild( new Checkbox( debugVisibleProperty, new Text( 'Debug', { font: new PhetFont( 12 ) } ) ) );
    }

    // DerivedProperty doesn't need disposal, since everything here lives for the lifetime of the simulation
    this.leftBarrierViewPointPropertyProperty = new Property<TReadOnlyProperty<Vector2>>( new DerivedProperty( [ this.visibleBoundsProperty ], visibleBounds => visibleBounds.leftCenter ), {
      tandem: Tandem.OPT_OUT
    } );
    // DerivedProperty doesn't need disposal, since everything here lives for the lifetime of the simulation
    this.rightBarrierViewPointPropertyProperty = new Property<TReadOnlyProperty<Vector2>>( new DerivedProperty( [ this.visibleBoundsProperty ], visibleBounds => visibleBounds.rightCenter ), {
      tandem: Tandem.OPT_OUT
    } );

    // leftBarrierViewPointPropertyProperty and rightBarrierViewPointPropertyProperty are Property<Property>, and we need to listen
    // to when the value.value changes
    // This instance lives for the lifetime of the simulation, so we don't need to remove these listeners
    new DynamicProperty( this.leftBarrierViewPointPropertyProperty ).lazyLink( () => this.resizeBarrier() );
    new DynamicProperty( this.rightBarrierViewPointPropertyProperty ).lazyLink( () => this.resizeBarrier() );
  }

  protected setRightBarrierViewPoint( rightBoxBoundsProperty: TReadOnlyProperty<Bounds2> ): void {
    // Set the property for the right barrier viewpoint.
    // DerivedProperty doesn't need disposal, since everything here lives for the lifetime of the simulation
    this.rightBarrierViewPointPropertyProperty.value = new DerivedProperty( [ this.visibleBoundsProperty, rightBoxBoundsProperty ], ( visibleBounds, boxBounds ) => {

      // We might not have a box, see https://github.com/phetsims/density/issues/110
      return new Vector2( isFinite( boxBounds.left ) ? boxBounds.left : visibleBounds.right, visibleBounds.centerY );
    } );
  }

  protected createDebugView(): DebugView {
    return new DebugView( this.model, this.layoutBounds );
  }

  protected getMassViewFromMass( mass: Mass ): MassView {
    if ( mass instanceof Cuboid ) {
      return new CuboidView( mass, this, this.displayProperties, this.popupLayer );
    }
    else if ( mass instanceof Scale ) {
      return new ScaleView( mass, this, this.model.gravityProperty, this.popupLayer );
    }
    else {
      throw new Error( 'massView is falsy' );
    }
  }

  protected fillFluidGeometry( y: number, fluidPositionArray: Float32Array, fluidGeometry: BufferGeometry, wasFilled: boolean ): boolean {
    wasFilled = FluidMesh.fillFluidVertexArray( y, 0, 0, 0, this.model.poolBounds, fluidPositionArray, wasFilled );
    fluidGeometry.attributes.position.needsUpdate = true;
    fluidGeometry.computeBoundingSphere();

    return wasFilled;
  }

  /**
   * There is an invisible barrier that prevents objects from being dragged behind control panels.
   */
  private resizeBarrier(): void {
    const stage = this.sceneNode.stage;
    if ( stage.canvasWidth && stage.canvasHeight ) {
      const leftRay = this.sceneNode.getRayFromScreenPoint( this.localToGlobalPoint( this.leftBarrierViewPointPropertyProperty.value.value ) );
      const rightRay = this.sceneNode.getRayFromScreenPoint( this.localToGlobalPoint( this.rightBarrierViewPointPropertyProperty.value.value ) );
      const topRay = this.sceneNode.getRayFromScreenPoint( this.localToGlobalPoint( this.visibleBoundsProperty.value.centerTop ) );
      const leftPoint = new Plane3( Vector3.Z_UNIT, 0.09 ).intersectWithRay( leftRay );
      const rightPoint = new Plane3( Vector3.Z_UNIT, 0.09 ).intersectWithRay( rightRay );
      const topPoint = new Plane3( Vector3.Z_UNIT, 0.09 ).intersectWithRay( topRay );
      this.model.invisibleBarrierBoundsProperty.value = this.model.invisibleBarrierBoundsProperty.value.setMaxY( topPoint.y + 0.06 ).setMinX( leftPoint.x + 0.01 ).withMaxX( rightPoint.x - 0.01 );

      // rescue any dragged blocks that were trapped by the invisible barrier
      this.massViews.forEach( massView => {
        const fullyContains = this.model.invisibleBarrierBoundsProperty.value.containsBounds( massView.mass.getBounds() );

        if ( !fullyContains && massView.mass.canMove && massView.mass.userControlledProperty.value ) {
          massView.mass.resetPosition();
        }
      } );
    }
  }

  /**
   * Returns the interactive mass under the pointer that is closest to the ray origin.
   */
  private getMassViewUnderPoint( point: Vector2, mode: 'autoselect' | 'input' = 'input' ): PointedAtMassView | null {
    const ray = this.sceneNode.getRayFromScreenPoint( point );

    const entries: PointedAtMassView[] = [];
    this.massViews.forEach( massView => {
      const raycaster = new THREE.Raycaster( ThreeUtils.vectorToThree( ray.position ), ThreeUtils.vectorToThree( ray.direction ) );
      const intersections: THREE.Intersection<THREE.Group>[] = [];

      if ( massView.massMesh ) {
        raycaster.intersectObject( massView.massMesh, true, intersections );
      }

      const t = intersections.length ? intersections[ 0 ].distance : null;

      // Visit everything when in autoselect, but for input events, the mass must be movable and enabled.
      const isMassSelectable = mode === 'autoselect' || ( massView.mass.canMove && massView.mass.inputEnabledProperty.value );

      // Only visit masses that can move.
      if ( t !== null && isMassSelectable ) {
        entries.push( {
          massView: massView,
          t: t
        } );
      }
    } );

    const closestEntry = this.getMinClosestEntry( entries );

    return closestEntry ? { massView: closestEntry.massView, t: closestEntry.t } : null;
  }

  protected getMinClosestEntry( entries: PointedAtMassView[] ): PointedAtMassView | undefined {
    return _.minBy( entries, entry => entry.t );
  }

  public override layout( viewBounds: Bounds2 ): void {
    super.layout( viewBounds );

    // If the simulation was not able to load for WebGL, bail out
    if ( !this.sceneNode ) {
      return;
    }

    this.resizeBarrier();

    // Note that subclasses may have other layout considerations. If they affect the barrier, then rewrite to move
    // resizeBarrier() to be afterwards.
  }

  public override renderSceneNode(): void {
    super.renderSceneNode();

    // Once three.js renders the blocks, we get the coordinates of the bounds from the graham-scan. Then we can trigger
    // the update to other parts of the view that rely on that shape.
    this.massViews.forEach( massView => massView.sceneNodeRenderedEmitter.emit() );
  }

  /**
   * Steps forward in time.
   */
  public override step( dt: number ): void {

    // If the simulation was not able to load for WebGL, bail out
    if ( !this.sceneNode ) {
      return;
    }

    this.massViews.forEach( massView => {
      massView.step( dt );

      assert && assert( massView.massMesh.position.x === massView.mass.matrix.translation.x );
    } );

    super.step( dt );

    this.debugView && this.debugView.step( dt );
  }

  protected addAlignBox( node: Node, xAlign: AlignBoxXAlign, yAlign: AlignBoxYAlign ): void {
    this.addChild( new AlignBox( node, {
      alignBoundsProperty: this.visibleBoundsProperty,
      xAlign: xAlign,
      yAlign: yAlign,
      margin: MARGIN
    } ) );
  }

  protected alignNodeWithResetAllButton( node: Node ): void {
    ManualConstraint.create( this, [ this.resetAllButton, node ],
      ( resetAllButtonWrapper, nodeWrapper ) => {

        // Set the location of the node relative to the reset all button, or the right side of the screen
        // if the reset all button is not visible
        nodeWrapper.right = resetAllButtonWrapper.visible ? ( resetAllButtonWrapper.left - DensityBuoyancyCommonConstants.MARGIN ) : resetAllButtonWrapper.right;
        nodeWrapper.bottom = resetAllButtonWrapper.bottom;
      } );
  }

  /**
   * Factored out way to only generate an icon with a whole new WebGL context if needed, otherwise just use the saved image.
   */
  public static getThreeIcon( iconBrowserImage: ImageableImage, generateIcon: () => Node ): Node {
    if ( DensityBuoyancyCommonQueryParameters.generateIconImages && ThreeUtils.isWebGLEnabled() ) {
      return generateIcon();
    }
    else {
      return new Image( iconBrowserImage );
    }
  }
}

densityBuoyancyCommon.register( 'DensityBuoyancyScreenView', DensityBuoyancyScreenView );