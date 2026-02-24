// Copyright 2019-2025, University of Colorado Boulder

/**
 * The main view for the Lab screen of the Buoyancy simulation.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import optionize, { combineOptions, EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import ManualConstraint from '../../../../scenery/js/layout/constraints/ManualConstraint.js';
import LayoutProxy from '../../../../scenery/js/layout/LayoutProxy.js';
import HBox from '../../../../scenery/js/layout/nodes/HBox.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Panel, { PanelOptions } from '../../../../sun/js/Panel.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import Material from '../../common/model/Material.js';
import BlockControlNode from '../../common/view/BlockControlNode.js';
import CuboidView from '../../common/view/CuboidView.js';
import GravityControlNode from '../../common/view/GravityControlNode.js';
import MultiSectionPanelsNode from '../../common/view/MultiSectionPanelsNode.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import BuoyancyLabModel from '../model/BuoyancyLabModel.js';
import BuoyancyScreenView, { BuoyancyScreenViewOptions } from './BuoyancyScreenView.js';
import DensityAccordionBox from './DensityAccordionBox.js';
import FluidDensityPanel from './FluidDensityPanel.js';
import FluidDisplacedAccordionBox from './FluidDisplacedAccordionBox.js';
import SubmergedAccordionBox from './SubmergedAccordionBox.js';

// constants
const MARGIN = DensityBuoyancyCommonConstants.MARGIN_SMALL;

type BuoyancyLabScreenViewOptions = BuoyancyScreenViewOptions;

export default class BuoyancyLabScreenView extends BuoyancyScreenView<BuoyancyLabModel> {

  private readonly rightBox: MultiSectionPanelsNode;

  public constructor( model: BuoyancyLabModel, providedOptions: BuoyancyLabScreenViewOptions ) {

    const options = optionize<BuoyancyLabScreenViewOptions, EmptySelfOptions, BuoyancyScreenViewOptions>()( {
      supportsDepthLines: true,
      forcesInitiallyDisplayed: true,
      massValuesInitiallyDisplayed: false
    }, providedOptions );

    super( model, options );

    const tandem = options.tandem;

    // In liters
    const maxBlockVolume = 10;

    const fluidDisplacedAccordionBox = new FluidDisplacedAccordionBox(
      model.fluidDisplacedVolumeProperty,
      maxBlockVolume,
      model.pool.fluidMaterialProperty,
      model.gravityProperty, {
        tandem: tandem.createTandem( 'fluidDisplacedAccordionBox' ),
        phetioFeatured: true
      } );

    const leftSideVBox = new VBox( {
      align: 'left',
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      children: [
        fluidDisplacedAccordionBox,
        this.displayOptionsPanel
      ]
    } );

    const leftSideContent = new Node( {
      children: [ leftSideVBox ]
    } );
    this.addChild( leftSideContent );

    const positionLeftSideContent = ( nodelike: LayoutProxy | Node ) => {
      nodelike.bottom = this.visibleBoundsProperty.value.bottom - MARGIN;
      nodelike.left = this.visibleBoundsProperty.value.left + MARGIN;
    };

    // Reflow when the entire accordion box is hidden in phet-io studio.
    ManualConstraint.create( this, [ leftSideContent ], positionLeftSideContent );

    this.visibleBoundsProperty.link( () => {
      positionLeftSideContent( leftSideContent );
    } );

    // Determine which mystery materials are displayed and which are invisible (but can be enabled in PhET-iO studio)
    const displayedMysteryMaterials = [ Material.FLUID_A, Material.FLUID_B ];
    const invisibleMaterials = [ ...Material.BUOYANCY_FLUID_MYSTERY_MATERIALS ].filter( material => !displayedMysteryMaterials.includes( material ) );

    const gravityPanelTandem = tandem.createTandem( 'gravityPanel' );

    const bottomNode = new HBox( {
      spacing: 2 * DensityBuoyancyCommonConstants.SPACING,
      children: [
        new FluidDensityPanel( model, invisibleMaterials, this.popupLayer, tandem.createTandem( 'fluidDensityPanel' ) ),

        // The ComboNumberControl masquerades as the parent Panel so that we can avoid unnecessary nesting in the tandem tree.
        // Hence gravityPanelTandem is passed to children but deleted before the FluidDensityControlNode is itself instrumented.
        new Panel( new GravityControlNode( model.gravityProperty, this.popupLayer, gravityPanelTandem ), combineOptions<PanelOptions>( {
          tandem: gravityPanelTandem,
          visiblePropertyOptions: {
            phetioFeatured: true
          }
        }, DensityBuoyancyCommonConstants.PANEL_OPTIONS ) )
      ]
    } );

    this.addAlignBox( bottomNode, 'center', 'bottom' );

    this.rightBox = new MultiSectionPanelsNode( [ new BlockControlNode(
      model.block,
      this.popupLayer,
      {
        tandem: tandem.createTandem( 'blockPanel' ),
        visiblePropertyOptions: {
          phetioFeatured: true
        },
        maxVolumeLiters: maxBlockVolume
      }
    ) ] );

    model.block.materialProperty.link( material => {
      if ( material === Material.MATERIAL_T ) {
        model.block.volumeProperty.value = 0.005;
      }
      else if ( material === Material.MATERIAL_U ) {
        model.block.volumeProperty.value = 0.005;
      }
    } );

    const objectDensityAccordionBox = new DensityAccordionBox( DensityBuoyancyCommonStrings.objectDensityStringProperty, {
      contentWidthMax: this.rightBox.content.width,
      readoutItems: [ { readoutItem: model.block.materialProperty } ],
      tandem: tandem.createTandem( 'objectDensityAccordionBox' )
    } );

    const percentSubmergedAccordionBox = new SubmergedAccordionBox( {
      contentWidthMax: this.rightBox.content.width,
      readoutItems: [ {
        readoutItem: model.block,
        readoutNameProperty: DensityBuoyancyCommonStrings.shape.blockStringProperty
      } ],
      tandem: tandem.createTandem( 'percentSubmergedAccordionBox' )
    } );

    const rightSideVBox = new VBox( {
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      align: 'right',
      children: [
        this.rightBox,
        objectDensityAccordionBox,
        percentSubmergedAccordionBox
      ]
    } );
    this.addAlignBox( rightSideVBox, 'right', 'top' );

    this.setRightBarrierViewPoint( rightSideVBox.boundsProperty );

    // Popup last
    this.addChild( this.popupLayer );

    this.resetEmitter.addListener( () => {
      fluidDisplacedAccordionBox.reset();
      percentSubmergedAccordionBox.reset();
      objectDensityAccordionBox.reset();
    } );

    const cuboidViews = this.massViews.filter( massView => massView instanceof CuboidView );

    // The focus order is described in https://github.com/phetsims/density-buoyancy-common/issues/121
    this.pdomPlayAreaNode.pdomOrder = [
      cuboidViews[ 0 ].focusablePath,
      this.poolScaleHeightControl,
      this.rightBox,
      bottomNode
    ];

    this.pdomControlAreaNode.pdomOrder = [
      leftSideContent,
      objectDensityAccordionBox,
      percentSubmergedAccordionBox,
      this.resetAllButton
    ];
  }
}

densityBuoyancyCommon.register( 'BuoyancyLabScreenView', BuoyancyLabScreenView );