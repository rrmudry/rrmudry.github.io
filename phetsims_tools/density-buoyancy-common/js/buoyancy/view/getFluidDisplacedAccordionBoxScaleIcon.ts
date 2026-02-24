// Copyright 2024-2025, University of Colorado Boulder

/**
 * The fluid displaced accordion box scale icon
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Vector3 from '../../../../dot/js/Vector3.js';
import getAngledIcon from '../../../../mobius/js/getAngledIcon.js';
import ThreeUtils from '../../../../mobius/js/ThreeUtils.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import fluid_displaced_scale_icon_png from '../../../images/fluid_displaced_scale_icon_png.js';
import DensityBuoyancyScreenView from '../../common/view/DensityBuoyancyScreenView.js';
import ScaleView from '../../common/view/ScaleView.js';

const getFluidDisplacedAccordionBoxScaleIcon = (): Node => {

  // Hard coded zoom and view-port vector help to center the icon.
  const image = DensityBuoyancyScreenView.getThreeIcon( fluid_displaced_scale_icon_png, () => {
    return getAngledIcon( 8, new Vector3( 0, 0.25, 0 ), scene => {
      const scaleGeometry = ScaleView.getScaleGeometry();

      const scale = new THREE.Mesh( scaleGeometry, new THREE.MeshStandardMaterial( {
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.7,
        emissive: 0x666666
      } ) );

      scale.position.copy( ThreeUtils.vectorToThree( new Vector3( 0, 0.25, 0 ) ) );
      scene.add( scale );
    }, null );
  } );
  image.setScaleMagnitude( 0.12 );
  return image;
};
export default getFluidDisplacedAccordionBoxScaleIcon;