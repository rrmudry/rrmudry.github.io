// Copyright 2024-2025, University of Colorado Boulder

/**
 * The icon for the Mystery screen of the Density simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Vector2 from '../../../../dot/js/Vector2.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import getAngledIcon from '../../../../mobius/js/getAngledIcon.js';
import NodeTexture from '../../../../mobius/js/NodeTexture.js';
import TextureQuad from '../../../../mobius/js/TextureQuad.js';
import ThreeUtils from '../../../../mobius/js/ThreeUtils.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import ScaleView from '../../common/view/ScaleView.js';

const getDensityMysteryIcon = (): Node => {

  return getAngledIcon( 4, new Vector3( 0, -0.01, 0 ), scene => {

    const boxGeometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );

    const box = new THREE.Mesh( boxGeometry, new THREE.MeshLambertMaterial( {
      color: 0x00ff00
    } ) );
    box.position.copy( ThreeUtils.vectorToThree( new Vector3( 0, 0.03, 0 ) ) );

    scene.add( box );

    const labelSize = 0.1;
    const label = new TextureQuad( new NodeTexture( new Text( '?', {
      font: new PhetFont( {
        size: 120
      } ),
      center: new Vector2( 128, 128 )
    } ), {
      width: 256,
      height: 256
    } ), labelSize, labelSize );

    label.position.copy( ThreeUtils.vectorToThree( new Vector3( 0 - labelSize * 0.5, 0.03, 0.15 ) ) );

    scene.add( label );

    const scaleGeometry = ScaleView.getScaleGeometry();

    const scale = new THREE.Mesh( scaleGeometry, new THREE.MeshStandardMaterial( {
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0x666666
    } ) );

    scale.position.copy( ThreeUtils.vectorToThree( new Vector3( 0, -0.03, 0 ) ) );
    scene.add( scale );
  } );
};

export default getDensityMysteryIcon;