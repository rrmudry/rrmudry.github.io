// Copyright 2019-2025, University of Colorado Boulder

/**
 * The main view for the Compare screen of the Buoyancy: Basics simulation.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import PatternStringProperty from '../../../../axon/js/PatternStringProperty.js';
import Property from '../../../../axon/js/Property.js';
import Bounds2 from '../../../../dot/js/Bounds2.js';
import Dimension2 from '../../../../dot/js/Dimension2.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import ScreenView from '../../../../joist/js/ScreenView.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Panel from '../../../../sun/js/Panel.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import BlockSet from '../../common/model/BlockSet.js';
import Mass from '../../common/model/Mass.js';
import MaterialProperty from '../../common/model/MaterialProperty.js';
import BlocksPanel from '../../common/view/BlocksPanel.js';
import BlocksValuePanel from '../../common/view/BlocksValuePanel.js';
import CuboidView from '../../common/view/CuboidView.js';
import MassView from '../../common/view/MassView.js';
import ScaleView from '../../common/view/ScaleView.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import BuoyancyCompareModel from '../model/BuoyancyCompareModel.js';
import BuoyancyScreenView, { BuoyancyScreenViewOptions } from './BuoyancyScreenView.js';
import DensityAccordionBox from './DensityAccordionBox.js';
import FluidSelectionPanel from './FluidSelectionPanel.js';
import { ReadoutItemOptions } from './ReadoutListAccordionBox.js';
import SubmergedAccordionBox from './SubmergedAccordionBox.js';

// constants
const MARGIN = DensityBuoyancyCommonConstants.MARGIN_SMALL;

// Relatively arbitrary default
const MAX_RIGHT_SIDE_CONTENT_WIDTH = ScreenView.DEFAULT_LAYOUT_BOUNDS.width / 2;

type BuoyancyCompareScreenViewOptions = BuoyancyScreenViewOptions;

export default class BuoyancyCompareScreenView extends BuoyancyScreenView<BuoyancyCompareModel> {

  // Reentrant when setting ?stringTest=double,
  private readonly rightSideMaxContentWidthProperty = new Property( MAX_RIGHT_SIDE_CONTENT_WIDTH, { reentrant: true } );
  private readonly rightSidePanelsVBox: Node;

  private readonly blocksValuePanel: Panel;

  public constructor( model: BuoyancyCompareModel, providedOptions: BuoyancyCompareScreenViewOptions ) {

    const options = optionize<BuoyancyCompareScreenViewOptions, EmptySelfOptions, BuoyancyScreenViewOptions>()( {
      supportsDepthLines: true,

      // Custom for Buoyancy Basics and Buoyancy Compare Screen
      cameraLookAt: DensityBuoyancyCommonConstants.BUOYANCY_BASICS_CAMERA_LOOK_AT,
      sceneNodeOptions: {
        viewOffset: DensityBuoyancyCommonConstants.BUOYANCY_BASICS_VIEW_OFFSET
      },

      layoutBounds: ScreenView.DEFAULT_LAYOUT_BOUNDS // used by constant above.
    }, providedOptions );

    super( model, options );

    const tandem = options.tandem;

    const blocksPanel = new BlocksPanel( model.blockSetProperty, tandem.createTandem( 'blocksPanel' ) );
    this.addAlignBox( blocksPanel, 'right', 'top' );

    this.addAlignBox( this.displayOptionsPanel, 'left', 'bottom' );

    const fluidPanel = new FluidSelectionPanel( model.pool.fluidMaterialProperty, this.popupLayer, {
      tandem: options.tandem.createTandem( 'fluidPanel' )
    } );

    this.addAlignBox( fluidPanel, 'center', 'bottom' );

    this.blocksValuePanel = new BlocksValuePanel( model.massProperty, model.volumeProperty, model.densityProperty, model.blockSetProperty, {
      sliderTrackSize: new Dimension2( 120, 0.5 ),
      tandem: tandem.createTandem( 'blocksValuePanel' ),
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    } );

    // Materials are set in densityBox.setMaterials() below
    const densityComparisonAccordionBox = new DensityAccordionBox( DensityBuoyancyCommonStrings.densityComparisonStringProperty, {
      contentWidthMax: this.rightSideMaxContentWidthProperty,
      tandem: options.tandem.createTandem( 'densityComparisonAccordionBox' ),
      accessibleName: DensityBuoyancyCommonStrings.densityComparisonStringProperty
    } );

    const percentSubmergedAccordionBox = new SubmergedAccordionBox( {
      contentWidthMax: this.rightSideMaxContentWidthProperty,
      tandem: options.tandem.createTandem( 'percentSubmergedAccordionBox' )
    } );

    const readoutItemsCache = new Map<BlockSet, {
      densityItems: ReadoutItemOptions<MaterialProperty>[];
      submergedItems: ReadoutItemOptions<Mass>[];
    }>();

    // Adjust the visibility after, since we want to size the box's location for its "full" bounds
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    model.blockSetProperty.link( blockSet => {

      if ( !readoutItemsCache.has( blockSet ) ) {
        const blocks = model.blockSetToMassesMap.get( blockSet )!;
        const submergedReadoutItems = blocks.map( mass => {
          return {
            readoutItem: mass,
            readoutNameProperty: new PatternStringProperty( DensityBuoyancyCommonStrings.blockPatternStringProperty, {
              tag: mass.nameProperty
            } ),
            readoutFormat: {
              font: DensityBuoyancyCommonConstants.ITEM_FONT,
              fill: mass.tag.colorProperty
            }
          };
        } );

        // Same options, but different readoutItem (mass->mass.materialProperty)
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
        readoutItemsCache.set( blockSet, {
          densityItems: densityReadoutItems,
          submergedItems: submergedReadoutItems
        } );
      }
      const itemsForBoth = readoutItemsCache.get( blockSet )!;
      percentSubmergedAccordionBox.setReadoutItems( itemsForBoth.submergedItems );
      densityComparisonAccordionBox.setReadoutItems( itemsForBoth.densityItems );
    } );

    this.rightSidePanelsVBox = new VBox( {
      children: [ this.blocksValuePanel, densityComparisonAccordionBox, percentSubmergedAccordionBox ],
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL
    } );
    this.addChild( this.rightSidePanelsVBox );

    // This instance lives for the lifetime of the simulation, so we don't need to remove these listeners
    this.transformEmitter.addListener( () => this.layoutRightSidePanels() );
    this.rightSidePanelsVBox.localBoundsProperty.lazyLink( () => this.layoutRightSidePanels() );

    this.addChild( this.popupLayer );

    const scaleViews = this.massViews.filter( massView => massView instanceof ScaleView );

    this.resetEmitter.addListener( () => {
      densityComparisonAccordionBox.reset();
      percentSubmergedAccordionBox.reset();
    } );

    // Layer for the focusable masses. Must be in the scene graph, so they can populate the pdom order
    const cuboidPDOMLayer = new Node( { pdomOrder: [] } );
    this.addChild( cuboidPDOMLayer );

    // The focus order is described in https://github.com/phetsims/density-buoyancy-common/issues/121
    this.pdomPlayAreaNode.pdomOrder = [

      cuboidPDOMLayer,

      // Note: only the leftmost land scale is focusable in this screen, but we use the same code as the other screens for consistency
      // The blocks are added (a) pool then (b) outside, but the focus order is (a) outside then (b) pool
      ..._.reverse( scaleViews.map( scaleView => scaleView.focusablePath ) ),

      this.poolScaleHeightControl,

      blocksPanel,

      this.blocksValuePanel,

      fluidPanel
    ];

    const massViewAdded = ( massView: MassView ) => {
      if ( massView instanceof CuboidView ) {
        cuboidPDOMLayer.pdomOrder = [ ...cuboidPDOMLayer.pdomOrder!, massView.focusablePath ];
        // nothing to do for removal since disposal of the node will remove it from the pdom order
      }
    };
    this.massViews.addItemAddedListener( massViewAdded );
    this.massViews.forEach( massViewAdded );

    this.pdomControlAreaNode.pdomOrder = [
      this.displayOptionsPanel,
      densityComparisonAccordionBox,
      percentSubmergedAccordionBox,
      this.resetAllButton
    ];
  }

  // Reposition and rescale the right side content
  private layoutRightSidePanels(): void {
    const rightSideOfPoolViewPoint = this.modelToViewPoint(
      new Vector3( this.model.pool.bounds.maxX, this.model.pool.bounds.maxY, this.model.pool.bounds.maxZ )
    );
    this.rightSidePanelsVBox.top = rightSideOfPoolViewPoint.y + MARGIN;
    this.rightSidePanelsVBox.right = this.visibleBoundsProperty.value.right - MARGIN;
    this.rightSideMaxContentWidthProperty.value = this.blocksValuePanel.width - 2 * DensityBuoyancyCommonConstants.PANEL_OPTIONS.xMargin;
  }

  public override layout( viewBounds: Bounds2 ): void {
    super.layout( viewBounds );
    this.layoutRightSidePanels();
  }
}

densityBuoyancyCommon.register( 'BuoyancyCompareScreenView', BuoyancyCompareScreenView );