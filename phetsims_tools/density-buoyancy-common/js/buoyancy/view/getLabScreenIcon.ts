// Copyright 2024-2025, University of Colorado Boulder

/**
 * Create an icon which can be used for the Lab screen home screen and navigation bar icons.
 * NOTE: observe the duplication with the code above, this will allow us to adjust the icon independently of
 * the in-simulation representation.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import NumberProperty from '../../../../axon/js/NumberProperty.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';
import BeakerNode, { BeakerNodeOptions } from '../../../../scenery-phet/js/BeakerNode.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import Material from '../../common/model/Material.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import FluidDisplacedAccordionBox, { BEAKER_RANGE } from './FluidDisplacedAccordionBox.js';
import getFluidDisplacedAccordionBoxScaleIcon from './getFluidDisplacedAccordionBoxScaleIcon.js';

const getLabScreenIcon = (): Node => {

  const scaleIcon = getFluidDisplacedAccordionBoxScaleIcon();
  scaleIcon.scale( 1.8 );

  const newtonUnitText = new Text( DensityBuoyancyCommonStrings.NStringProperty, {
    font: new PhetFont( {
      size: 34,
      weight: 'bold'
    } ),
    maxWidth: scaleIcon.width * 0.8 // margins on the scale, and the icon goes beyond the actual scale, see https://github.com/phetsims/density-buoyancy-common/issues/108
  } );

  const beakerNode = new BeakerNode( new NumberProperty( 0.2, {
    range: BEAKER_RANGE.copy()
  } ), combineOptions<BeakerNodeOptions>( {
    solutionFill: Material.WATER.colorProperty
  }, FluidDisplacedAccordionBox.getBeakerOptions() ) );

  scaleIcon.top = beakerNode.bottom - 30;
  scaleIcon.centerX = beakerNode.centerX;
  newtonUnitText.centerY = scaleIcon.bottom - 21;
  newtonUnitText.centerX = beakerNode.centerX;

  return new Node( {
    children: [ scaleIcon, beakerNode, newtonUnitText ]
  } );
};

export default getLabScreenIcon;