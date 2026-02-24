// Copyright 2019-2025, University of Colorado Boulder

/**
 * The main view for the Explore screen of the Buoyancy simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import PatternStringProperty from '../../../../axon/js/PatternStringProperty.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import Material from '../../common/model/Material.js';
import ABControlsNode from '../../common/view/ABControlsNode.js';
import BlocksModeRadioButtonGroup from '../../common/view/BlocksModeRadioButtonGroup.js';
import CuboidView from '../../common/view/CuboidView.js';
import MassView from '../../common/view/MassView.js';
import ScaleView from '../../common/view/ScaleView.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import BuoyancyExploreModel from '../model/BuoyancyExploreModel.js';
import BuoyancyScreenView, { BuoyancyScreenViewOptions } from './BuoyancyScreenView.js';
import DensityAccordionBox from './DensityAccordionBox.js';
import FluidDensityPanel from './FluidDensityPanel.js';
import SubmergedAccordionBox from './SubmergedAccordionBox.js';

type BuoyancyExploreScreenViewOptions = BuoyancyScreenViewOptions;

export default class BuoyancyExploreScreenView extends BuoyancyScreenView<BuoyancyExploreModel> {

  private readonly rightBox: ABControlsNode;

  public constructor( model: BuoyancyExploreModel, providedOptions: BuoyancyExploreScreenViewOptions ) {

    const options = optionize<BuoyancyExploreScreenViewOptions, EmptySelfOptions, BuoyancyScreenViewOptions>()( {
      supportsDepthLines: true
    }, providedOptions );

    super( model, options );

    const tandem = options.tandem;

    this.addAlignBox( this.displayOptionsPanel, 'left', 'bottom' );

    // Determine which mystery materials are displayed and which are invisible (but can be enabled in PhET-iO studio)
    const displayedMysteryMaterials = [ Material.FLUID_A, Material.FLUID_B ];
    const invisibleMaterials = [ ...Material.BUOYANCY_FLUID_MYSTERY_MATERIALS ].filter( material => !displayedMysteryMaterials.includes( material ) );

    this.rightBox = new ABControlsNode(
      model.blockA,
      model.blockB,
      this.popupLayer, {
        tandem: tandem
      }
    );

    const fluidDensityPanel = new FluidDensityPanel( model, invisibleMaterials, this.popupLayer, tandem.createTandem( 'fluidDensityPanel' ) );

    this.addAlignBox( fluidDensityPanel, 'center', 'bottom' );

    [ model.blockA, model.blockB ].forEach( mass => {
      mass.materialProperty.link( material => {
        if ( material === Material.MATERIAL_R ) {
          mass.volumeProperty.value = 0.003;
        }
        else if ( material === Material.MATERIAL_S ) {
          mass.volumeProperty.value = 0.001;
        }
      } );
    } );

    // Materials are set in densityBox.setMaterials() below
    const objectDensityAccordionBox = new DensityAccordionBox( DensityBuoyancyCommonStrings.objectDensityStringProperty, {
      contentWidthMax: this.rightBox.content.width,
      tandem: tandem.createTandem( 'objectDensityAccordionBox' )
    } );

    const percentSubmergedAccordionBox = new SubmergedAccordionBox( {
      contentWidthMax: this.rightBox.content.width,
      tandem: tandem.createTandem( 'percentSubmergedAccordionBox' )
    } );

    const customExploreScreenFormatting = [ model.blockA, model.blockB ].map( mass => {
      return {
        readoutNameProperty: new PatternStringProperty( DensityBuoyancyCommonStrings.blockPatternStringProperty, { tag: mass.nameProperty } ),
        readoutFormat: { font: DensityBuoyancyCommonConstants.ITEM_FONT, fill: mass.tag.colorProperty }
      };
    } );

    // Adjust the visibility after, since we want to size the box's location for its "full" bounds
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    model.blockB.visibleProperty.link( blockBVisible => {
      const masses = blockBVisible ? [ model.blockA, model.blockB ] : [ model.blockA ];
      objectDensityAccordionBox.setReadoutItems( masses.map( ( mass, index ) => {
        return {
          readoutItem: mass.materialProperty,
          readoutNameProperty: customExploreScreenFormatting[ index ].readoutNameProperty,
          readoutFormat: customExploreScreenFormatting[ index ].readoutFormat
        };
      } ) );
      percentSubmergedAccordionBox.setReadoutItems( masses.map( ( mass, index ) => {
        return {
          readoutItem: mass,
          readoutNameProperty: customExploreScreenFormatting[ index ].readoutNameProperty,
          readoutFormat: customExploreScreenFormatting[ index ].readoutFormat
        };
      } ) );
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

    const blocksModeRadioButtonGroup = new BlocksModeRadioButtonGroup( model.modeProperty, {
      tandem: this.tandem.createTandem( 'blocksModeRadioButtonGroup' )
    } );

    this.alignNodeWithResetAllButton( blocksModeRadioButtonGroup );
    this.addChild( blocksModeRadioButtonGroup );

    this.setRightBarrierViewPoint( rightSideVBox.boundsProperty );

    this.addChild( this.popupLayer );

    this.resetEmitter.addListener( () => {
      percentSubmergedAccordionBox.reset();
      objectDensityAccordionBox.reset();
    } );

    const cuboidViews = this.massViews.filter( massView => massView instanceof CuboidView );
    const scaleViews = this.massViews.filter( massView => massView instanceof ScaleView );

    // Layer for the focusable masses. Must be in the scene graph, so they can populate the pdom order
    const cuboidPDOMLayer = new Node( { pdomOrder: [] } );
    this.addChild( cuboidPDOMLayer );

    // The focus order is described in https://github.com/phetsims/density-buoyancy-common/issues/121
    this.pdomPlayAreaNode.pdomOrder = [

      cuboidViews[ 0 ].focusablePath,
      this.rightBox.controlANode,

      cuboidPDOMLayer,
      this.rightBox.controlBNode,

      fluidDensityPanel,

      // The blocks are added (a) pool then (b) outside, but the focus order is (a) outside then (b) pool
      ..._.reverse( scaleViews.map( scaleView => scaleView.focusablePath ) ),
      this.poolScaleHeightControl
    ];

    const massViewAdded = ( massView: MassView ) => {
      if ( massView instanceof CuboidView && massView.mass === model.blockB ) {
        cuboidPDOMLayer.pdomOrder = [ ...cuboidPDOMLayer.pdomOrder!, massView.focusablePath ];

        // nothing to do for removal since disposal of the node will remove it from the pdom order
      }
    };
    this.massViews.addItemAddedListener( massViewAdded );
    this.massViews.forEach( massViewAdded );

    this.pdomControlAreaNode.pdomOrder = [
      blocksModeRadioButtonGroup,
      this.displayOptionsPanel,
      objectDensityAccordionBox,
      percentSubmergedAccordionBox,
      this.resetAllButton
    ];
  }
}

densityBuoyancyCommon.register( 'BuoyancyExploreScreenView', BuoyancyExploreScreenView );