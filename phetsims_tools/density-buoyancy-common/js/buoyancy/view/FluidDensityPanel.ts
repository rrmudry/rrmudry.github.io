// Copyright 2024-2025, University of Colorado Boulder

/**
 * Panel that allows the user to adjust the fluid density.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Panel, { PanelOptions } from '../../../../sun/js/Panel.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import DensityBuoyancyModel from '../../common/model/DensityBuoyancyModel.js';
import Material from '../../common/model/Material.js';
import FluidDensityControlNode from '../../common/view/FluidDensityControlNode.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

type FluidDensityPanelOptions = PanelOptions;

export default class FluidDensityPanel extends Panel {
  public constructor( model: DensityBuoyancyModel, invisibleMaterials: Material[], popupLayer: Node, tandem: Tandem ) {
    const fluidMaterialProperty = model.pool.fluidMaterialProperty;
    const fluidDensityControlNode = new FluidDensityControlNode( fluidMaterialProperty, fluidMaterialProperty.availableValues,
      popupLayer, {
        invisibleMaterials: invisibleMaterials,

        // The ComboNumberControl masquerades as the parent Panel so that we can avoid unnecessary nesting in the tandem tree.
        // Hence this tandem is passed to children but deleted before the FluidDensityControlNode is itself instrumented.
        tandem: tandem
      } );

    const options = optionize<FluidDensityPanelOptions, EmptySelfOptions, PanelOptions>()( {
      tandem: tandem,
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    }, DensityBuoyancyCommonConstants.PANEL_OPTIONS );

    super( fluidDensityControlNode, options );
  }
}

densityBuoyancyCommon.register( 'FluidDensityPanel', FluidDensityPanel );