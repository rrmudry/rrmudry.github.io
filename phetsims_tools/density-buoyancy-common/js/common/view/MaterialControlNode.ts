// Copyright 2024-2025, University of Colorado Boulder

/**
 * A control that changes the Material (via provided Property), but also supports handling special cases for custom or hidden
 * materials.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Property from '../../../../axon/js/Property.js';
import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import optionize from '../../../../phet-core/js/optionize.js';
import PickRequired from '../../../../phet-core/js/types/PickRequired.js';
import HBox from '../../../../scenery/js/layout/nodes/HBox.js';
import VBox, { VBoxOptions } from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import ComboBox from '../../../../sun/js/ComboBox.js';
import { PhetioObjectOptions } from '../../../../tandem/js/PhetioObject.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import Material from '../model/Material.js';
import MaterialProperty from '../model/MaterialProperty.js';

type SelfMaterialControlNodeOptions = {

  syncCustomMaterialDensity?: boolean;

  // When true, this control will set the MaterialProperty's custom materials density range based on provided custom schema.
  ownsCustomDensityRange?: boolean;

  // A label, if provided to be placed to the right of the ComboBox
  labelNode?: Node | null;

  minCustomMass?: number;
  maxCustomMass?: number;
  minCustomVolumeLiters?: number;
  maxVolumeLiters?: number;
} & PickRequired<PhetioObjectOptions, 'tandem'>;

export type MaterialControlNodeOptions = SelfMaterialControlNodeOptions & VBoxOptions;

export default class MaterialControlNode extends VBox {

  public constructor( materialProperty: MaterialProperty,
                      volumeProperty: Property<number>,
                      materials: Material[],
                      listParent: Node,
                      providedOptions: MaterialControlNodeOptions ) {

    const options = optionize<MaterialControlNodeOptions, SelfMaterialControlNodeOptions, VBoxOptions>()( {
      syncCustomMaterialDensity: true,
      ownsCustomDensityRange: true,
      labelNode: null,
      minCustomMass: 0.5,
      maxCustomMass: 10,
      minCustomVolumeLiters: 1,
      maxVolumeLiters: 10
    }, providedOptions );

    super( {
      spacing: DensityBuoyancyCommonConstants.SPACING,
      align: 'left'
    } );

    const comboMaxWidth = 110;

    const customMaterials = materials.filter( material => material.custom );

    assert && assert( customMaterials.length <= 1, 'one or less custom materials please' );

    const materialToItem = ( material: Material ) => {
      return {
        value: material,
        createNode: () => new Text( material.nameProperty, {
          font: DensityBuoyancyCommonConstants.COMBO_BOX_ITEM_FONT,
          maxWidth: comboMaxWidth
        } ),
        tandemName: `${material.tandem.name.replace( 'Material', '' )}Item`,
        accessibleName: material.nameProperty,
        comboBoxListItemNodeOptions: {
          visible: !materialProperty.invisibleMaterials.includes( material )
        }
      };
    };

    // Set the custom density range, then this control owns the range of the density.
    if ( customMaterials.length > 0 && options.ownsCustomDensityRange ) {

      // The range typically changes during resetAll or reset scene. However, when it does, we revert it back to the
      // desired range for this control. Since the rangeProperty has valueComparisonStrategy 'equalsFunction' this is
      // not an infinite loop.
      materialProperty.customMaterial.densityProperty.rangeProperty.link( () => {
        materialProperty.customMaterial.densityProperty.rangeProperty.value = new Range(
          options.minCustomMass / options.maxVolumeLiters * DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER,

          // Prevent divide by zero errors (infinity) with a manual, tiny number
          options.maxCustomMass / ( options.minCustomVolumeLiters ) * DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER
        );
      } );
    }

    // When switching to custom, set the custom density to the previous material's density (clamped just in case).
    // However, when switching from a mystery material, do not change the custom value. This prevents clever students from discovering
    // the mystery values by using the UI instead of by computing them, see https://github.com/phetsims/buoyancy/issues/54
    if ( customMaterials.length > 0 && options.syncCustomMaterialDensity ) {
      materialProperty.lazyLink( ( material, oldMaterial ) => {
        if ( material.custom && !oldMaterial.hidden ) {
          assert && assert( materialProperty.customMaterial === customMaterials[ 0 ], 'I would really rather know what customMaterial we are dealing with' );

          // Handle our minimum volume if we're switched to custom (if needed)
          const maxVolume = Math.max( volumeProperty.value, options.minCustomVolumeLiters / DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER );
          materialProperty.customMaterial.densityProperty.value = Utils.clamp( oldMaterial.density, options.minCustomMass / maxVolume, options.maxCustomMass / maxVolume );
        }
      } );
    }

    const comboBox = new ComboBox( materialProperty,
      materialProperty.availableValues.map( materialToItem ),
      listParent, {
        xMargin: 8,
        yMargin: 4,
        tandem: options.tandem.createTandem( 'comboBox' )
      } );

    this.children = [
      new HBox( {
        spacing: 5,
        justify: 'left',
        children: [
          comboBox,
          ...( [ options.labelNode ].filter( _.identity ) as Node[] )
        ]
      } )
    ];
  }
}

densityBuoyancyCommon.register( 'MaterialControlNode', MaterialControlNode );