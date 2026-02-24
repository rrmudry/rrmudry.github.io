// Copyright 2024-2025, University of Colorado Boulder

/**
 * The icon for the bottle scene
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Vector3 from '../../../../../dot/js/Vector3.js';
import getAngledIcon from '../../../../../mobius/js/getAngledIcon.js';
import Node from '../../../../../scenery/js/nodes/Node.js';
import bottle_icon_png from '../../../../images/bottle_icon_png.js';
import DensityBuoyancyScreenView from '../../../common/view/DensityBuoyancyScreenView.js';
import BottleView from './BottleView.js';

const ICON_SCALE = 0.08;

const getBottleIcon = (): Node => {
  const bottle = DensityBuoyancyScreenView.getThreeIcon( bottle_icon_png, () => {
    return getAngledIcon( 3.4, new Vector3( -0.02, 0, 0 ), scene => {
      scene.add( BottleView.getBottleDrawingData().group );
    }, null );
  } );
  bottle.setScaleMagnitude( ICON_SCALE );
  return bottle;
};

export default getBottleIcon;