// Copyright 2024-2025, University of Colorado Boulder

/**
 * The icon for the boat scene
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Vector3 from '../../../../../dot/js/Vector3.js';
import getAngledIcon from '../../../../../mobius/js/getAngledIcon.js';
import Node from '../../../../../scenery/js/nodes/Node.js';
import boat_icon_png from '../../../../images/boat_icon_png.js';
import DensityBuoyancyScreenView from '../../../common/view/DensityBuoyancyScreenView.js';
import BoatView from './BoatView.js';

const ICON_SCALE = 0.08;

const getBoatIcon = (): Node => {
  const boatIcon = DensityBuoyancyScreenView.getThreeIcon( boat_icon_png, () => {
    return getAngledIcon( 6, new Vector3( -0.03, 0, 0 ), scene => {

      const topBoatClipPlane: THREE.Plane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 0 );
      const bottomBoatClipPlane: THREE.Plane = new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), 0 );
      const topPoolClipPlane: THREE.Plane = new THREE.Plane( new THREE.Vector3( 0, 1, 0 ), 0 );
      const bottomPoolClipPlane: THREE.Plane = new THREE.Plane( new THREE.Vector3( 0, -1, 0 ), 0 );

      scene.add( BoatView.getBoatDrawingData( topBoatClipPlane, bottomBoatClipPlane, topPoolClipPlane, bottomPoolClipPlane ).group );
    }, null );
  } );
  boatIcon.setScaleMagnitude( ICON_SCALE );
  return boatIcon;
};

export default getBoatIcon;