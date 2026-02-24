// Copyright 2019-2025, University of Colorado Boulder

/**
 * A mass/volume control specifically for blocks.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import UnitConversionProperty from '../../../../axon/js/UnitConversionProperty.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';
import NumberControl, { NumberControlOptions } from '../../../../scenery-phet/js/NumberControl.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import Cube from '../model/Cube.js';
import Cuboid from '../model/Cuboid.js';
import MaterialMassVolumeControlNode, { MaterialMassVolumeControlNodeOptions } from './MaterialMassVolumeControlNode.js';
import PrecisionSliderThumb from './PrecisionSliderThumb.js';

export type BlockControlNodeOptions = MaterialMassVolumeControlNodeOptions;

export default class BlockControlNode extends MaterialMassVolumeControlNode {
  public constructor( cuboid: Cuboid, listParent: Node, options: BlockControlNodeOptions ) {

    const materials = cuboid.materialProperty.availableValues;

    // If we have useDensityControlInsteadOfMassControl, we control the logic completely here, and hence do not want the  one-way synchronization in the super.
    if ( assert && options.useDensityControlInsteadOfMassControl ) {
      assert && assert( options.syncCustomMaterialDensity === false );
    }

    super( cuboid.materialProperty, cuboid.massProperty, cuboid.volumeProperty, materials,
      cubicMeters => cuboid.updateSize( Cube.boundsFromVolume( cubicMeters ) ), listParent, options );

    if ( options.useDensityControlInsteadOfMassControl ) {

      const densityNumberControlTandem = options.tandem.createTandem( 'densityNumberControl' );

      const customDensityProperty = cuboid.materialProperty.customMaterial.densityProperty;

      const densityAsLitersProperty = new UnitConversionProperty( customDensityProperty, {
        factor: 1 / DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER
      } );

      const densityNumberControl = new NumberControl(
        DensityBuoyancyCommonStrings.densityStringProperty,
        densityAsLitersProperty,
        densityAsLitersProperty.range,
        combineOptions<NumberControlOptions>( {
          sliderOptions: {
            thumbNode: new PrecisionSliderThumb( {
              tandem: densityNumberControlTandem.createTandem( 'slider' ).createTandem( 'thumbNode' ),
              thumbFill: options.color
            } ),
            phetioLinkedProperty: customDensityProperty
          },
          numberDisplayOptions: {
            valuePattern: DensityBuoyancyCommonConstants.KILOGRAMS_PER_VOLUME_PATTERN_STRING_PROPERTY,

            // Use rich text so that kg/dm^3 is displayed correctly
            useRichText: true
          },
          accessibleName: DensityBuoyancyCommonStrings.densityStringProperty,
          tandem: densityNumberControlTandem
        }, MaterialMassVolumeControlNode.getNumberControlOptions() ) );
      this.densityControlPlaceholderLayer.addChild( densityNumberControl );
      this.densityControlPlaceholderLayer.visibleProperty = densityNumberControl.visibleProperty;
    }
  }
}

densityBuoyancyCommon.register( 'BlockControlNode', BlockControlNode );