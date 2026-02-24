// Copyright 2024-2026, University of Colorado Boulder

/**
 * Some icons want THREE water/fluid for the icon. This is a reusable type for consistent and transparent fluid in these
 * icons.
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Vector3 from '../../../../dot/js/Vector3.js';
import ThreeUtils from '../../../../mobius/js/ThreeUtils.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonColors from './DensityBuoyancyCommonColors.js';

export default class FluidIconMesh extends THREE.Mesh {

  public constructor( position: Vector3 = new Vector3( 0, -0.5, 0.1 ), fluidGeometry: THREE.BoxGeometry = new THREE.BoxGeometry( 1, 1, 0.2 ) ) {

    const fluidMaterial = new THREE.MeshLambertMaterial( {
      transparent: true
    } );
    const fluidColor = DensityBuoyancyCommonColors.materialWaterColorProperty.value;
    fluidMaterial.color = ThreeUtils.colorToThree( fluidColor );
    fluidMaterial.opacity = fluidColor.alpha;

    super( fluidGeometry, fluidMaterial );
    this.position.copy( ThreeUtils.vectorToThree( position ) );
  }
}

densityBuoyancyCommon.register( 'FluidIconMesh', FluidIconMesh );