// Copyright 2024-2025, University of Colorado Boulder

/**
 * The icon for the Explore screen of the Buoyancy simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Vector3 from '../../../../dot/js/Vector3.js';
import getAngledIcon from '../../../../mobius/js/getAngledIcon.js';
import ThreeUtils from '../../../../mobius/js/ThreeUtils.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import buoyancy_explore_screen_block_png from '../../../images/buoyancy_explore_screen_block_png.js';
import DensityBuoyancyScreenView from '../../common/view/DensityBuoyancyScreenView.js';
import FluidIconMesh from '../../common/view/FluidIconMesh.js';
import getExploreIcon from '../../common/view/getExploreIcon.js';
import { DensityMaterials } from '../../common/view/MaterialView.js';

const getBuoyancyExploreIcon = (): Node => {
  const boxScene = DensityBuoyancyScreenView.getThreeIcon( buoyancy_explore_screen_block_png, () => {
    return getAngledIcon( 5.5, new Vector3( 0, 0, 0 ), scene => {

      const boxGeometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );

      const box = new THREE.Mesh( boxGeometry, new THREE.MeshStandardMaterial( {
        map: DensityMaterials.woodColorTexture,
        normalMap: DensityMaterials.woodNormalTexture,
        normalScale: new THREE.Vector2( 1, -1 ),
        roughnessMap: DensityMaterials.woodRoughnessTexture,
        metalness: 0

        // NOTE: Removed the environment map for now
      } ) );
      box.position.copy( ThreeUtils.vectorToThree( new Vector3( 0, 0, 0 ) ) );

      scene.add( box );

      scene.add( new FluidIconMesh( new Vector3( 0, -0.5, 0.12 ) ) );
    } );
  } );

  return new Node( {
    children: [
      boxScene,
      getExploreIcon().mutate( {

        // Move the arrow to the center of the boxScene, fine tuned manually
        center: boxScene.center.plusXY( 0, boxScene.height * 0.09 )
      } )
    ]
  } );
};

export default getBuoyancyExploreIcon;