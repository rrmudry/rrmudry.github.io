// Copyright 2024-2025, University of Colorado Boulder

/**
 * The icon for the Applications screen of the Buoyancy simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Vector3 from '../../../../../dot/js/Vector3.js';

import getAngledIcon from '../../../../../mobius/js/getAngledIcon.js';
import Node from '../../../../../scenery/js/nodes/Node.js';
import Material from '../../../common/model/Material.js';
import FluidIconMesh from '../../../common/view/FluidIconMesh.js';
import Bottle from '../../model/applications/Bottle.js';

const getBuoyancyApplicationsIcon = (): Node => {

  return getAngledIcon( 5.5, new Vector3( 0, 0, 0 ), scene => {

    const primaryGeometry = Bottle.getPrimaryGeometry();

    const bottleGroup = new THREE.Group();

    const frontBottomMaterial = new THREE.MeshPhongMaterial( {
      color: Material.OIL.colorProperty!.value.toHexString(),
      opacity: 0.8,
      transparent: true,
      side: THREE.FrontSide
    } );
    const frontBottom = new THREE.Mesh( primaryGeometry, frontBottomMaterial );
    frontBottom.renderOrder = -1;
    bottleGroup.add( frontBottom );

    const cap = new THREE.Mesh( Bottle.getCapGeometry(), new THREE.MeshPhongMaterial( {
      color: 0xFF3333,
      side: THREE.DoubleSide
    } ) );
    bottleGroup.add( cap );

    bottleGroup.scale.multiplyScalar( 0.5 );
    bottleGroup.position.add( new THREE.Vector3( 0.01, 0, 0.05 ) );

    scene.add( bottleGroup );

    scene.add( new FluidIconMesh() );
  } );
};

export default getBuoyancyApplicationsIcon;