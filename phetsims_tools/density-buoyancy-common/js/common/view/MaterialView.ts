// Copyright 2019-2026, University of Colorado Boulder

/**
 * A container for a three.js material and various associated functions/data that are needed to update it.
 *
 * Also provides factory methods for creating MaterialViews for various Materials.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import ReadOnlyProperty from '../../../../axon/js/ReadOnlyProperty.js';
import Utils from '../../../../dot/js/Utils.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import ThreeUtils from '../../../../mobius/js/ThreeUtils.js';
import Color from '../../../../scenery/js/util/Color.js';
import Bricks25_AO_jpg from '../../../images/Bricks25_AO_jpg.js';
import Bricks25_col_jpg from '../../../images/Bricks25_col_jpg.js';
import Bricks25_nrm_jpg from '../../../images/Bricks25_nrm_jpg.js';
import DiamondPlate01_col_jpg from '../../../images/DiamondPlate01_col_jpg.js';
import DiamondPlate01_met_jpg from '../../../images/DiamondPlate01_met_jpg.js';
import DiamondPlate01_nrm_jpg from '../../../images/DiamondPlate01_nrm_jpg.js';
import DiamondPlate01_rgh_jpg from '../../../images/DiamondPlate01_rgh_jpg.js';
import Ice01_alpha_jpg from '../../../images/Ice01_alpha_jpg.js';
import Ice01_col_jpg from '../../../images/Ice01_col_jpg.js';
import Ice01_nrm_jpg from '../../../images/Ice01_nrm_jpg.js';
import Metal002_col_jpg from '../../../images/Metal002_col_jpg.js';
import Metal002_met_jpg from '../../../images/Metal002_met_jpg.js';
import Metal002_nrm_jpg from '../../../images/Metal002_nrm_jpg.js';
import Metal002_rgh_jpg from '../../../images/Metal002_rgh_jpg.js';
import Metal007_col_jpg from '../../../images/Metal007_col_jpg.js';
import Metal007_met_jpg from '../../../images/Metal007_met_jpg.js';
import Metal007_nrm_jpg from '../../../images/Metal007_nrm_jpg.js';
import Metal007_rgh_jpg from '../../../images/Metal007_rgh_jpg.js';
import Metal08_col_jpg from '../../../images/Metal08_col_jpg.js';
import Metal08_met_jpg from '../../../images/Metal08_met_jpg.js';
import Metal08_nrm_jpg from '../../../images/Metal08_nrm_jpg.js';
import Metal08_rgh_jpg from '../../../images/Metal08_rgh_jpg.js';
import Metal10_col_brightened_jpg from '../../../images/Metal10_col_brightened_jpg.js';
import Metal10_col_jpg from '../../../images/Metal10_col_jpg.js';
import Metal10_met_jpg from '../../../images/Metal10_met_jpg.js';
import Metal10_nrm_jpg from '../../../images/Metal10_nrm_jpg.js';
import Metal10_rgh_jpg from '../../../images/Metal10_rgh_jpg.js';
import Plastic018B_col_jpg from '../../../images/Plastic018B_col_jpg.js';
import Plastic018B_nrm_jpg from '../../../images/Plastic018B_nrm_jpg.js';
import Plastic018B_rgh_jpg from '../../../images/Plastic018B_rgh_jpg.js';
import Styrofoam_001_AO_jpg from '../../../images/Styrofoam_001_AO_jpg.js';
import Styrofoam_001_col_jpg from '../../../images/Styrofoam_001_col_jpg.js';
import Styrofoam_001_nrm_jpg from '../../../images/Styrofoam_001_nrm_jpg.js';
import Styrofoam_001_rgh_jpg from '../../../images/Styrofoam_001_rgh_jpg.js';
import Wood26_col_jpg from '../../../images/Wood26_col_jpg.js';
import Wood26_nrm_jpg from '../../../images/Wood26_nrm_jpg.js';
import Wood26_rgh_jpg from '../../../images/Wood26_rgh_jpg.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import Material from '../model/Material.js';

class MaterialView<T extends THREE.Material = THREE.Material> {

  public constructor( public readonly material: T ) { }

  public dispose(): void {
    this.material.dispose();
  }
}

// constants

function toWrappedTexture( image: HTMLImageElement ): THREE.Texture {
  const texture = ThreeUtils.imageToTexture( image, true );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Simplified environment map to give a nice reflective appearance. We compute it per-pixel
let envMapTexture: THREE.CanvasTexture | null = null;

function getEnvironmentTexture(): THREE.CanvasTexture {
  const size = 32;
  if ( !envMapTexture ) {
    const canvas = document.createElement( 'canvas' );
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext( '2d' )!;

    const imageData = context.getImageData( 0, 0, size, size );

    // For each pixel
    for ( let i = 0; i < 32 * 32; i++ ) {
      const index = i * 4;

      // Determine spherical coordinates for the equirectangular mapping
      const theta = ( i % size ) / size * Math.PI * 2;
      const phi = Math.PI * ( 0.5 - Math.floor( i / size ) / ( size - 1 ) );

      // Get a euclidean vector
      const v = new Vector3(
        -Math.cos( phi ) * Math.cos( theta ),
        Math.sin( phi ),
        Math.cos( phi ) * Math.sin( theta )
      );

      // Our light direction
      const light = new Vector3( -1 / 2, 1.5, 0.8 / 2 );

      // Front/top lighting + light
      const value = v.y > 0 || v.z < 0 ? 1 : v.dot( light ) / 2;

      imageData.data[ index + 0 ] = Utils.clamp( Math.floor( value * 255 + 127 ), 0, 255 );
      imageData.data[ index + 1 ] = Utils.clamp( Math.floor( value * 255 + 127 ), 0, 255 );
      imageData.data[ index + 2 ] = Utils.clamp( Math.floor( value * 255 + 127 ), 0, 255 );
      imageData.data[ index + 3 ] = 255;
    }

    context.putImageData( imageData, 0, 0 );

    envMapTexture = new THREE.CanvasTexture( canvas, THREE.EquirectangularReflectionMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
  }
  return envMapTexture;
}

// textures
const aluminumColorTexture = toWrappedTexture( Metal10_col_jpg );
const aluminumMetalnessTexture = toWrappedTexture( Metal10_met_jpg );
const aluminumNormalTexture = toWrappedTexture( Metal10_nrm_jpg );
const aluminumRoughnessTexture = toWrappedTexture( Metal10_rgh_jpg );
const brickAmbientOcclusionTexture = toWrappedTexture( Bricks25_AO_jpg );
const brickColorTexture = toWrappedTexture( Bricks25_col_jpg );
const brickNormalTexture = toWrappedTexture( Bricks25_nrm_jpg );
const greyMetalColorTexture = toWrappedTexture( Metal002_col_jpg );
const greyMetalMetalnessTexture = toWrappedTexture( Metal002_met_jpg );
const greyMetalNormalTexture = toWrappedTexture( Metal002_nrm_jpg );
const greyMetalRoughnessTexture = toWrappedTexture( Metal002_rgh_jpg );
const goldColorTexture = toWrappedTexture( Metal007_col_jpg );
const goldMetalnessTexture = toWrappedTexture( Metal007_met_jpg );
const goldNormalTexture = toWrappedTexture( Metal007_nrm_jpg );
const goldRoughnessTexture = toWrappedTexture( Metal007_rgh_jpg );
const copperColorTexture = toWrappedTexture( Metal08_col_jpg );
const copperMetalnessTexture = toWrappedTexture( Metal08_met_jpg );
const copperNormalTexture = toWrappedTexture( Metal08_nrm_jpg );
const copperRoughnessTexture = toWrappedTexture( Metal08_rgh_jpg );
const iceAlphaTexture = toWrappedTexture( Ice01_alpha_jpg );
const iceColorTexture = toWrappedTexture( Ice01_col_jpg );
const iceNormalTexture = toWrappedTexture( Ice01_nrm_jpg );
const platinumColorTexture = toWrappedTexture( Metal10_col_brightened_jpg );
const plasticColorTexture = toWrappedTexture( Plastic018B_col_jpg );
const plasticNormalTexture = toWrappedTexture( Plastic018B_nrm_jpg );
const plasticRoughnessTexture = toWrappedTexture( Plastic018B_rgh_jpg );
const steelColorTexture = toWrappedTexture( DiamondPlate01_col_jpg );
const steelMetalnessTexture = toWrappedTexture( DiamondPlate01_met_jpg );
const steelNormalTexture = toWrappedTexture( DiamondPlate01_nrm_jpg );
const steelRoughnessTexture = toWrappedTexture( DiamondPlate01_rgh_jpg );
const styrofoamAmbientOcclusionTexture = toWrappedTexture( Styrofoam_001_AO_jpg );
const styrofoamColorTexture = toWrappedTexture( Styrofoam_001_col_jpg );
const styrofoamNormalTexture = toWrappedTexture( Styrofoam_001_nrm_jpg );
const styrofoamRoughnessTexture = toWrappedTexture( Styrofoam_001_rgh_jpg );
const woodColorTexture = toWrappedTexture( Wood26_col_jpg );
const woodNormalTexture = toWrappedTexture( Wood26_nrm_jpg );
const woodRoughnessTexture = toWrappedTexture( Wood26_rgh_jpg );

class AluminumMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshStandardMaterial( {
      map: aluminumColorTexture,
      normalMap: aluminumNormalTexture,
      normalScale: new THREE.Vector2( 1, -1 ),
      roughnessMap: aluminumRoughnessTexture,
      metalnessMap: aluminumMetalnessTexture,
      envMap: getEnvironmentTexture()
    } ) );
  }
}

class BrickMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshStandardMaterial( {
      map: brickColorTexture,
      aoMap: brickAmbientOcclusionTexture,
      normalMap: brickNormalTexture,
      normalScale: new THREE.Vector2( 0.5, -0.5 ),
      roughness: 1,
      metalness: 0,
      envMap: getEnvironmentTexture()
    } ) );
  }
}

class CopperMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshStandardMaterial( {
      map: copperColorTexture,
      normalMap: copperNormalTexture,
      normalScale: new THREE.Vector2( 1, -1 ),
      roughnessMap: copperRoughnessTexture,
      metalnessMap: copperMetalnessTexture,
      envMap: getEnvironmentTexture()
    } ) );
  }
}

class IceMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshPhysicalMaterial( {
      map: iceColorTexture,
      alphaMap: iceAlphaTexture,
      normalMap: iceNormalTexture,
      normalScale: new THREE.Vector2( 1, -1 ),
      roughness: 0.7,
      refractionRatio: 1 / 1.309,
      metalness: 0.4,
      // @ts-expect-error they capitalized this
      clearCoat: 1,
      reflectivity: 1,
      envMapIntensity: 2, // is this too much cheating?

      transparent: true,
      side: THREE.DoubleSide,

      envMap: getEnvironmentTexture()
    } ) );
  }
}

// We just use aluminum
class PlatinumMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshStandardMaterial( {
      map: platinumColorTexture,
      normalMap: aluminumNormalTexture,
      normalScale: new THREE.Vector2( 1, -1 ),
      roughnessMap: aluminumRoughnessTexture,
      roughness: 0,
      metalnessMap: aluminumMetalnessTexture,
      envMapIntensity: 0.5,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
      envMap: getEnvironmentTexture()
    } ) );
  }
}

class SteelMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshStandardMaterial( {
      map: steelColorTexture,
      normalMap: steelNormalTexture,
      normalScale: new THREE.Vector2( 1, -1 ),
      roughnessMap: steelRoughnessTexture,
      metalnessMap: steelMetalnessTexture,
      envMap: getEnvironmentTexture()
    } ) );
  }
}

class StyrofoamMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshStandardMaterial( {
      map: styrofoamColorTexture,
      aoMap: styrofoamAmbientOcclusionTexture,
      normalMap: styrofoamNormalTexture,
      normalScale: new THREE.Vector2( 1, 1 ),
      roughness: 1.5,
      roughnessMap: styrofoamRoughnessTexture,
      metalness: 0,
      envMap: getEnvironmentTexture()
    } ) );
  }
}

class WoodMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshStandardMaterial( {
      map: woodColorTexture,
      normalMap: woodNormalTexture,
      normalScale: new THREE.Vector2( 1, -1 ),
      roughness: 0.8,
      roughnessMap: woodRoughnessTexture,
      metalness: 0,
      envMap: getEnvironmentTexture()
    } ) );
  }
}

class PVCMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshStandardMaterial( {
      map: plasticColorTexture,
      normalMap: plasticNormalTexture,
      normalScale: new THREE.Vector2( 1, -1 ),
      roughnessMap: plasticRoughnessTexture,
      envMap: getEnvironmentTexture(),
      envMapIntensity: 1.5
    } ) );
  }
}

class GoldMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshStandardMaterial( {
      map: goldColorTexture,
      normalMap: goldNormalTexture,
      normalScale: new THREE.Vector2( 1, -1 ),
      roughnessMap: goldRoughnessTexture,
      metalnessMap: goldMetalnessTexture,
      envMap: getEnvironmentTexture(),
      envMapIntensity: 1,
      metalness: 1,
      roughness: 0
    } ) );
  }
}

class GreyMetalMaterialView extends MaterialView {
  public constructor( brightness = 0 ) {
    super( new THREE.MeshStandardMaterial( {
      map: greyMetalColorTexture,
      normalMap: greyMetalNormalTexture,
      normalScale: new THREE.Vector2( 1, -1 ),
      roughnessMap: greyMetalRoughnessTexture,
      metalnessMap: greyMetalMetalnessTexture,
      envMap: getEnvironmentTexture(),
      envMapIntensity: 1,
      metalness: 1,
      roughness: 0,
      emissive: 0xffffff,
      emissiveIntensity: brightness
    } ) );
  }
}

export class ColoredMaterialView extends MaterialView<THREE.MeshLambertMaterial> {

  private readonly colorProperty: ReadOnlyProperty<Color>;
  private readonly listener: ( color: Color ) => void;

  public constructor( colorProperty: ReadOnlyProperty<Color> ) {

    assert && assert( colorProperty !== null, 'colorProperty should not be null' );

    super( new THREE.MeshLambertMaterial() );

    this.colorProperty = colorProperty;

    this.listener = color => {
      this.material.color = ThreeUtils.colorToThree( color );
    };
    this.colorProperty.link( this.listener );
  }

  public override dispose(): void {
    this.colorProperty.unlink( this.listener );

    super.dispose();
  }
}

class DebugMaterialView extends MaterialView {
  public constructor() {
    super( new THREE.MeshLambertMaterial( {
      color: 0xffaa44
    } ) );
  }
}

export class DensityMaterials {
  public static getMaterialView( material: Material ): MaterialView {
    return material === Material.ALUMINUM ? new AluminumMaterialView() :
           material === Material.BRICK ? new BrickMaterialView() :
           material === Material.COPPER ? new CopperMaterialView() :
           ( material === Material.GOLD ||
             material === Material.PYRITE ||
             material === Material.MATERIAL_R ||
             material === Material.MATERIAL_S ) ? new GoldMaterialView() :
           material === Material.SILVER ? new GreyMetalMaterialView() :
           material === Material.ICE ? new IceMaterialView() :
           material === Material.PLATINUM ? new PlatinumMaterialView() :
           material === Material.PVC ? new PVCMaterialView() :
           material === Material.STEEL ? new SteelMaterialView() :
           material === Material.TANTALUM ? new GreyMetalMaterialView( 0.3 ) :
           material === Material.STYROFOAM ? new StyrofoamMaterialView() :
           material === Material.WOOD ? new WoodMaterialView() :
           material.custom || material.hidden ? ( assert && assert( material.colorProperty, 'colorProperty required for custom materials' ), new ColoredMaterialView( material.colorProperty! ) ) :
           new DebugMaterialView();
  }

  public static readonly woodColorTexture: THREE.Texture = woodColorTexture;
  public static readonly woodNormalTexture: THREE.Texture = woodNormalTexture;
  public static readonly woodRoughnessTexture: THREE.Texture = woodRoughnessTexture;

  public static readonly brickColorTexture: THREE.Texture = brickColorTexture;
  public static readonly brickNormalTexture: THREE.Texture = brickNormalTexture;
}

export default MaterialView;
densityBuoyancyCommon.register( 'MaterialView', MaterialView );