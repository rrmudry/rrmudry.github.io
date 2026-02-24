// Copyright 2019-2025, University of Colorado Boulder

/**
 * The main view for the Explore screen of the Buoyancy: Basics simulation.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import PatternStringProperty from '../../../../axon/js/PatternStringProperty.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import BuoyancyScreenView, { BuoyancyScreenViewOptions } from '../../buoyancy/view/BuoyancyScreenView.js';
import DensityAccordionBox from '../../buoyancy/view/DensityAccordionBox.js';
import FluidSelectionPanel from '../../buoyancy/view/FluidSelectionPanel.js';
import getBuoyancyExploreIcon from '../../buoyancy/view/getBuoyancyExploreIcon.js';
import SubmergedAccordionBox from '../../buoyancy/view/SubmergedAccordionBox.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import ABControlsNode from '../../common/view/ABControlsNode.js';
import BlocksModeRadioButtonGroup from '../../common/view/BlocksModeRadioButtonGroup.js';
import CuboidView from '../../common/view/CuboidView.js';
import MassView from '../../common/view/MassView.js';
import ScaleView from '../../common/view/ScaleView.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import BuoyancyBasicsExploreModel from '../model/BuoyancyBasicsExploreModel.js';

type BuoyancyBasicsExploreScreenViewOptions = BuoyancyScreenViewOptions;

export default class BuoyancyBasicsExploreScreenView extends BuoyancyScreenView<BuoyancyBasicsExploreModel> {

  private readonly rightBox: ABControlsNode;

  public constructor( model: BuoyancyBasicsExploreModel, providedOptions: BuoyancyBasicsExploreScreenViewOptions ) {

    const options = optionize<BuoyancyBasicsExploreScreenViewOptions, EmptySelfOptions, BuoyancyScreenViewOptions>()( {
      supportsDepthLines: true,
      cameraLookAt: DensityBuoyancyCommonConstants.BUOYANCY_BASICS_CAMERA_LOOK_AT,
      sceneNodeOptions: {
        viewOffset: DensityBuoyancyCommonConstants.BUOYANCY_BASICS_VIEW_OFFSET
      }
    }, providedOptions );

    super( model, options );

    const tandem = options.tandem;

    this.addAlignBox( this.displayOptionsPanel, 'left', 'bottom' );

    this.rightBox = new ABControlsNode(
      model.blockA,
      model.blockB,
      this.popupLayer, {
        useDensityControlInsteadOfMassControl: true,
        syncCustomMaterialDensity: false,
        ownsCustomDensityRange: false,
        customKeepsConstantDensity: true,
        tandem: tandem,
        maxCustomMass: 15
      }
    );

    const fluidPanel = new FluidSelectionPanel( model.pool.fluidMaterialProperty, this.popupLayer, {
      tandem: options.tandem.createTandem( 'fluidPanel' )
    } );

    this.addAlignBox( fluidPanel, 'center', 'bottom' );

    const densityComparisonAccordionBox = new DensityAccordionBox( DensityBuoyancyCommonStrings.densityComparisonStringProperty, {
      contentWidthMax: this.rightBox.content.width,
      tandem: tandem.createTandem( 'densityComparisonAccordionBox' ),
      accessibleName: DensityBuoyancyCommonStrings.densityComparisonStringProperty
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
    model.blockB.visibleProperty.link( visible => {
      const masses = visible ? [ model.blockA, model.blockB ] : [ model.blockA ];
      const submergedReadoutItems = masses.map( ( mass, index ) => {
        return {
          readoutItem: mass,
          readoutNameProperty: customExploreScreenFormatting[ index ].readoutNameProperty,
          readoutFormat: customExploreScreenFormatting[ index ].readoutFormat
        };
      } );
      const densityReadoutItems = [
        ...submergedReadoutItems.map( submergedReadoutItem => {
          return _.assignIn( {}, submergedReadoutItem, {
            readoutItem: submergedReadoutItem.readoutItem.materialProperty
          } );
        } ), {
          readoutItem: model.pool.fluidMaterialProperty,
          readoutFormat: {
            font: DensityBuoyancyCommonConstants.ITEM_FONT
          }
        }
      ];
      percentSubmergedAccordionBox.setReadoutItems( submergedReadoutItems );
      densityComparisonAccordionBox.setReadoutItems( densityReadoutItems );
    } );

    const rightSideVBox = new VBox( {
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      align: 'right',
      children: [
        this.rightBox,
        densityComparisonAccordionBox,
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
      densityComparisonAccordionBox.reset();
      percentSubmergedAccordionBox.reset();
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

      // Note: only the leftmost land scale is focusable in this screen, but we use the same code as the other screens for consistency
      // The blocks are added (a) pool then (b) outside, but the focus order is (a) outside then (b) pool
      ..._.reverse( scaleViews.map( scaleView => scaleView.focusablePath ) ),

      this.poolScaleHeightControl,

      fluidPanel
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
      densityComparisonAccordionBox,
      percentSubmergedAccordionBox,
      this.resetAllButton
    ];
  }

  public static getBuoyancyBasicsExploreIcon(): Node {
    return getBuoyancyExploreIcon();
  }
}

densityBuoyancyCommon.register( 'BuoyancyBasicsExploreScreenView', BuoyancyBasicsExploreScreenView );