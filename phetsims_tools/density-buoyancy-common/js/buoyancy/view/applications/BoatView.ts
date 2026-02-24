// Copyright 2020-2025, University of Colorado Boulder

/**
 * The 3D view for a Boat.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { THREEModelViewTransform } from '../../../../../mobius/js/MobiusScreenView.js';
import Node from '../../../../../scenery/js/nodes/Node.js';
import DensityBuoyancyCommonConstants from '../../../common/DensityBuoyancyCommonConstants.js';
import InterpolatedProperty from '../../../common/model/InterpolatedProperty.js';
import MeasurableMassView from '../../../common/view/MeasurableMassView.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import Boat from '../../model/applications/Boat.js';
import BoatDesign from '../../model/applications/BoatDesign.js';
import DisplayProperties from '../DisplayProperties.js';

type BoatDrawingData = {
  backMiddleMaterial: THREE.MeshBasicMaterial;
  group: THREE.Group;
};

const VOLUME_TOLERANCE = DensityBuoyancyCommonConstants.TOLERANCE;

export default class BoatView extends MeasurableMassView {
  private readonly fluidListener: VoidFunction;

  public constructor( boat: Boat,
                      modelViewTransform: THREEModelViewTransform,
                      poolFluidYInterpolatedProperty: InterpolatedProperty<number>,
                      displayProperties: DisplayProperties,
                      interactionCueParentNode: Node ) {

    super( boat,

      // @ts-expect-error
      new THREE.Geometry(),

      modelViewTransform, displayProperties, interactionCueParentNode,

      // not disposable
      false );

    // Clip planes at the boat's fluid level
    const topBoatClipPlane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 0 );
    const bottomBoatClipPlane = new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), 0 );

    // Clip planes at the pool's fluid level
    const topPoolClipPlane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 0 );
    const bottomPoolClipPlane = new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), 0 );

    const boatDrawingData = BoatView.getBoatDrawingData( topBoatClipPlane, bottomBoatClipPlane, topPoolClipPlane, bottomPoolClipPlane );

    const boatGroup = boatDrawingData.group;
    this.massMesh.add( boatGroup );

    boat.maxVolumeDisplacedProperty.link( volume => {
      const scale = Math.pow( volume / 0.001, 1 / 3 );
      boatGroup.scale.x = scale;
      boatGroup.scale.y = scale;
      boatGroup.scale.z = scale;
    } );

    const topFluidPositionArray = BoatDesign.createCrossSectionVertexArray();
    const topFluidNormalArray = new Float32Array( topFluidPositionArray.length );
    for ( let i = 1; i < topFluidNormalArray.length; i += 3 ) {
      topFluidNormalArray[ i ] = 1; // normals should all be 0,1,0
    }
    const topFluidGeometry = new THREE.BufferGeometry();
    topFluidGeometry.addAttribute( 'position', new THREE.BufferAttribute( topFluidPositionArray, 3 ) );
    topFluidGeometry.addAttribute( 'normal', new THREE.BufferAttribute( topFluidNormalArray, 3 ) );

    const topFluidMaterial = new THREE.MeshPhongMaterial( {
      color: 0x33FF33, // will be replaced with fluid color below
      opacity: 0.8,
      transparent: true,
      depthWrite: false
    } );
    const topFluid = new THREE.Mesh( topFluidGeometry, topFluidMaterial );
    this.massMesh.add( topFluid );

    this.fluidListener = () => {
      const boatFluidY = boat.basin.fluidYInterpolatedProperty.value;
      const boatDisplacement = boat.maxVolumeDisplacedProperty.value;
      const boatFluidVolume = boat.basin.fluidVolumeProperty.value;

      const poolFluidY = poolFluidYInterpolatedProperty.value;

      const liters = boatDisplacement / 0.001;

      const relativeBoatFluidY = boatFluidY - boat.matrix.translation.y;

      const maximumVolume = boat.basin.getEmptyVolume( Number.POSITIVE_INFINITY );

      const isFull = boatFluidVolume >= maximumVolume - VOLUME_TOLERANCE;
      if ( boatFluidVolume > 0 && ( !isFull || BoatDesign.shouldBoatFluidDisplayIfFull( poolFluidY - boat.matrix.translation.y, liters ) ) ) {
        BoatDesign.fillCrossSectionVertexArray( relativeBoatFluidY, liters, topFluidPositionArray );
      }
      else {
        topFluidPositionArray.fill( 0 );
      }
      topFluidGeometry.attributes.position.needsUpdate = true;
      topFluidGeometry.computeBoundingSphere();

      if ( boatFluidVolume > VOLUME_TOLERANCE ) {
        bottomBoatClipPlane.constant = boatFluidY;
        topBoatClipPlane.constant = -boatFluidY;
      }
      else {
        bottomBoatClipPlane.constant = -1000;
        topBoatClipPlane.constant = 1000;
      }
      bottomPoolClipPlane.constant = poolFluidY;
      topPoolClipPlane.constant = -poolFluidY;
    };

    boat.fluidMaterialProperty.linkColorProperty( topFluidMaterial );
    boat.fluidMaterialProperty.linkColorProperty( boatDrawingData.backMiddleMaterial );

    // see the static function for the rest of render orders
    topFluid.renderOrder = 3;
  }

  public override step( dt: number ): void {
    super.step( dt );

    this.fluidListener();
  }

  /**
   * Factored out way to get the view object of the boat. Used for the BoatView and the icon.
   */
  public static getBoatDrawingData( topBoatClipPlane: THREE.Plane, bottomBoatClipPlane: THREE.Plane,
                                    topPoolClipPlane: THREE.Plane, bottomPoolClipPlane: THREE.Plane ): BoatDrawingData {

    const boatOneLiterInteriorGeometry = BoatDesign.getPrimaryGeometry( 1, false, false, true, false );
    const boatOneLiterExteriorGeometry = BoatDesign.getPrimaryGeometry( 1, true, true, false, false );

    const boatOneLiterGeometry = BoatDesign.getPrimaryGeometry( 1 );

    const boatGroup = new THREE.Group();

    const backExteriorMaterial = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      opacity: 0.4,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false
    } );
    const backExterior = new THREE.Mesh( boatOneLiterExteriorGeometry, backExteriorMaterial );
    boatGroup.add( backExterior );

    const backTopMaterial = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      opacity: 0.4,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      clippingPlanes: [ topBoatClipPlane ]
    } );
    const backTop = new THREE.Mesh( boatOneLiterInteriorGeometry, backTopMaterial );
    boatGroup.add( backTop );

    const backMiddleMaterial = new THREE.MeshBasicMaterial( {
      color: 0xffffff, // will be replaced with fluid color from Property updates
      opacity: 0.8,
      transparent: true,
      side: THREE.BackSide, // better appearance with this
      depthWrite: false,
      clippingPlanes: [ bottomBoatClipPlane, topPoolClipPlane ]
    } );

    const backMiddle = new THREE.Mesh( boatOneLiterInteriorGeometry, backMiddleMaterial );
    boatGroup.add( backMiddle );

    const backBottomMaterial = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      opacity: 0.4,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      clippingPlanes: [ bottomBoatClipPlane, bottomPoolClipPlane ]
    } );
    const backBottom = new THREE.Mesh( boatOneLiterInteriorGeometry, backBottomMaterial );
    boatGroup.add( backBottom );

    const frontExteriorMaterial = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      opacity: 0.4,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false
    } );
    const frontExterior = new THREE.Mesh( boatOneLiterExteriorGeometry, frontExteriorMaterial );
    boatGroup.add( frontExterior );

    const frontTopMaterial = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      opacity: 0.4,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      clippingPlanes: [ topBoatClipPlane ]
    } );
    const frontTop = new THREE.Mesh( boatOneLiterInteriorGeometry, frontTopMaterial );
    boatGroup.add( frontTop );

    const frontForDepth = new THREE.Mesh( boatOneLiterGeometry, new THREE.MeshPhongMaterial( {
      color: 0xFF0000,
      opacity: 0,
      transparent: true,
      side: THREE.FrontSide
    } ) );
    boatGroup.add( frontForDepth );

    // pool fluid will be at a higher value
    frontForDepth.renderOrder = 4;
    frontTop.renderOrder = 2;
    frontExterior.renderOrder = 1;

    // block will be at 0
    backBottom.renderOrder = -1;
    backMiddle.renderOrder = -1;
    backTop.renderOrder = -1;
    backExterior.renderOrder = -2;

    return {
      group: boatGroup,
      backMiddleMaterial: backMiddleMaterial
    };
  }
}

densityBuoyancyCommon.register( 'BoatView', BoatView );