// Copyright 2020-2025, University of Colorado Boulder

/**
 * Controls whether the second mass is visible. This is a standard straightforward RectangularRadioButtonGroup. Most
 * of the complexity of this file is in generating the icons.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Property from '../../../../axon/js/Property.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import ThreeStage from '../../../../mobius/js/ThreeStage.js';
import ThreeUtils from '../../../../mobius/js/ThreeUtils.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import Image from '../../../../scenery/js/nodes/Image.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import RectangularRadioButtonGroup, { RectangularRadioButtonGroupOptions } from '../../../../sun/js/buttons/RectangularRadioButtonGroup.js';
import doubleCuboidIcon_png from '../../../mipmaps/doubleCuboidIcon_png.js';
import singleCuboidIcon_png from '../../../mipmaps/singleCuboidIcon_png.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonQueryParameters from '../DensityBuoyancyCommonQueryParameters.js';
import TwoBlockMode from '../model/TwoBlockMode.js';
import DensityBuoyancyCommonColors from './DensityBuoyancyCommonColors.js';

// constants
const aMaterial = new THREE.MeshLambertMaterial();
const bMaterial = new THREE.MeshLambertMaterial();

const ICON_SCALE = 0.15;

// When the associated tag color Properties change, update the color in the THREE material
// These live for the lifetime of the simulation, so we don't need to remove this listener
DensityBuoyancyCommonColors.tagAProperty.link( labelColor => {
  aMaterial.color = ThreeUtils.colorToThree( labelColor );
} );
DensityBuoyancyCommonColors.tagBProperty.link( labelColor => {
  bMaterial.color = ThreeUtils.colorToThree( labelColor );
} );

export type BlocksModeRadioButtonGroupOptions = RectangularRadioButtonGroupOptions;

export default class BlocksModeRadioButtonGroup extends RectangularRadioButtonGroup<TwoBlockMode> {
  public constructor( modeProperty: Property<TwoBlockMode>, options?: BlocksModeRadioButtonGroupOptions ) {
    super( modeProperty, [ {
      value: TwoBlockMode.ONE_BLOCK,
      createNode: () => BlocksModeRadioButtonGroup.getSingleCuboidIcon(),
      tandemName: 'oneBlockRadioButton'
    }, {
      value: TwoBlockMode.TWO_BLOCKS,
      createNode: () => BlocksModeRadioButtonGroup.getDoubleCuboidIcon(),
      tandemName: 'twoBlocksRadioButton'
    }
    ], optionize<BlocksModeRadioButtonGroupOptions, EmptySelfOptions, RectangularRadioButtonGroupOptions>()( {
      orientation: 'horizontal',
      touchAreaXDilation: 5,
      touchAreaYDilation: 5,
      radioButtonOptions: {
        baseColor: 'rgb( 230, 231, 232 )'
      }
    }, options ) );
  }

  /**
   * Creates a box mesh for use in icons.
   */
  private static createBox( material: THREE.Material, position: Vector3 ): THREE.Mesh {
    const boxGeometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );

    const box = new THREE.Mesh( boxGeometry, material );
    box.position.copy( ThreeUtils.vectorToThree( position ) );

    // Create outlines around the box with cylinders (like stroking the edges)
    const connect = ( a: Vector3, b: Vector3 ) => {
      const delta = b.minus( a );

      const edgeGeometry = new THREE.CylinderGeometry( 0.002, 0.002, delta.magnitude, 8, 1 );
      const edge = new THREE.Mesh( edgeGeometry, new THREE.MeshBasicMaterial( { color: 0x000000 } ) );

      edge.position.copy( ThreeUtils.vectorToThree( a.average( b ) ) );

      if ( a.z !== b.z ) {
        edge.rotation.x += Math.PI / 2;
      }
      if ( a.x !== b.x ) {
        edge.rotation.z += Math.PI / 2;
      }

      box.add( edge );
    };

    connect( new Vector3( 0.05, 0.05, 0.05 ), new Vector3( 0.05, 0.05, -0.05 ) );
    connect( new Vector3( -0.05, 0.05, 0.05 ), new Vector3( -0.05, 0.05, -0.05 ) );
    connect( new Vector3( -0.05, -0.05, 0.05 ), new Vector3( -0.05, -0.05, -0.05 ) );
    connect( new Vector3( 0.05, -0.05, 0.05 ), new Vector3( 0.05, -0.05, -0.05 ) );

    connect( new Vector3( 0.05, 0.05, 0.05 ), new Vector3( 0.05, -0.05, 0.05 ) );
    connect( new Vector3( -0.05, 0.05, 0.05 ), new Vector3( -0.05, -0.05, 0.05 ) );
    connect( new Vector3( -0.05, 0.05, -0.05 ), new Vector3( -0.05, -0.05, -0.05 ) );
    connect( new Vector3( 0.05, 0.05, -0.05 ), new Vector3( 0.05, -0.05, -0.05 ) );

    connect( new Vector3( 0.05, 0.05, 0.05 ), new Vector3( -0.05, 0.05, 0.05 ) );
    connect( new Vector3( 0.05, -0.05, 0.05 ), new Vector3( -0.05, -0.05, 0.05 ) );
    connect( new Vector3( 0.05, -0.05, -0.05 ), new Vector3( -0.05, -0.05, -0.05 ) );
    connect( new Vector3( 0.05, 0.05, -0.05 ), new Vector3( -0.05, 0.05, -0.05 ) );

    return box;
  }

  /**
   * Returns an icon for selection, given a scene setup callback.
   */
  private static getIcon( zoom: number, setupScene: ( scene: THREE.Scene ) => void ): Node {
    const stage = new ThreeStage();

    const ambientLight = new THREE.AmbientLight( 0x333333 );
    stage.threeScene.add( ambientLight );

    const sunLight = new THREE.DirectionalLight( 0xffffff, 1 );
    sunLight.position.set( -1, 1.5, 0.8 );
    stage.threeScene.add( sunLight );

    const moonLight = new THREE.DirectionalLight( 0xffffff, 0.2 );
    moonLight.position.set( 2.0, -1.0, 1.0 );
    stage.threeScene.add( moonLight );

    stage.threeCamera.position.copy( ThreeUtils.vectorToThree( new Vector3( 0, 0.3, 1 ) ) );
    stage.threeCamera.zoom = zoom;
    stage.threeCamera.lookAt( ThreeUtils.vectorToThree( new Vector3( 0, -0.003, 0 ) ) );
    stage.threeCamera.updateProjectionMatrix();

    setupScene( stage.threeScene );

    stage.threeCamera.fov = 50;
    stage.threeCamera.aspect = 1;
    stage.setDimensions( 256, 256 );
    stage.threeCamera.near = 0.03;
    stage.threeCamera.updateProjectionMatrix();
    stage.render( undefined );

    const canvas = stage.renderToCanvas( 3 );

    stage.dispose();

    console.log( canvas.toDataURL() );

    const image = new Image( canvas.toDataURL(), {
      mipmap: true,
      initialWidth: canvas.width,
      initialHeight: canvas.height
    } );
    image.setScaleMagnitude( 0.2, -0.2 );
    return image;
  }

  /**
   * Returns an icon that shows a single cuboid.
   */
  private static getSingleCuboidIcon(): Node {
    if ( DensityBuoyancyCommonQueryParameters.generateIconImages ) {
      return BlocksModeRadioButtonGroup.getIcon( 5.5, scene => {
        scene.add( BlocksModeRadioButtonGroup.createBox( aMaterial, new Vector3( 0, 0, 0 ) ) );
      } );
    }
    else {
      return new Image( singleCuboidIcon_png, { scale: ICON_SCALE } );
    }
  }

  /**
   * Returns an icon that shows a single cuboid.
   */
  private static getDoubleCuboidIcon(): Node {
    if ( DensityBuoyancyCommonQueryParameters.generateIconImages ) {
      return BlocksModeRadioButtonGroup.getIcon( 4, scene => {
        scene.add( BlocksModeRadioButtonGroup.createBox( aMaterial, new Vector3( -0.039, 0.015, -0.07 ) ) );
        scene.add( BlocksModeRadioButtonGroup.createBox( bMaterial, new Vector3( 0.03, -0.005, 0.07 ) ) );
      } );
    }
    else {
      return new Image( doubleCuboidIcon_png, { scale: ICON_SCALE } );
    }
  }
}

densityBuoyancyCommon.register( 'BlocksModeRadioButtonGroup', BlocksModeRadioButtonGroup );