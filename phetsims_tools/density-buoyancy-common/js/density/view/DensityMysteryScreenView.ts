// Copyright 2020-2025, University of Colorado Boulder

/**
 * The main view for the Mystery screen of the Density simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import optionize, { combineOptions, EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import RefreshButton from '../../../../scenery-phet/js/buttons/RefreshButton.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import AccordionBox, { AccordionBoxOptions } from '../../../../sun/js/AccordionBox.js';
import Panel, { PanelOptions } from '../../../../sun/js/Panel.js';
import VerticalAquaRadioButtonGroup from '../../../../sun/js/VerticalAquaRadioButtonGroup.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import CuboidView from '../../common/view/CuboidView.js';
import DensityBuoyancyScreenView, { DensityBuoyancyScreenViewOptions } from '../../common/view/DensityBuoyancyScreenView.js';
import MassView from '../../common/view/MassView.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityMysteryModel, { MysteryBlockSet } from '../model/DensityMysteryModel.js';
import DensityTableNode from './DensityTableNode.js';

type DensityMysteryScreenViewOptions = DensityBuoyancyScreenViewOptions;

export default class DensityMysteryScreenView extends DensityBuoyancyScreenView<DensityMysteryModel> {
  public constructor( model: DensityMysteryModel, providedOptions: DensityMysteryScreenViewOptions ) {

    const options = optionize<DensityMysteryScreenViewOptions, EmptySelfOptions, DensityBuoyancyScreenViewOptions>()( {
      massValuesInitiallyDisplayed: false
    }, providedOptions );

    super( model, options );

    const tandem = options.tandem;

    const densityTableAccordionBoxTandem = tandem.createTandem( 'densityTableAccordionBox' );
    const densityTableAccordionBox = new AccordionBox( new DensityTableNode(), combineOptions<AccordionBoxOptions>( {
      titleNode: new Text( DensityBuoyancyCommonStrings.densityTableStringProperty, {
        font: DensityBuoyancyCommonConstants.TITLE_FONT,
        maxWidth: 200
      } ),
      expandedDefaultValue: false,
      tandem: densityTableAccordionBoxTandem,
      accessibleName: DensityBuoyancyCommonStrings.densityTableStringProperty
    }, DensityBuoyancyCommonConstants.ACCORDION_BOX_OPTIONS ) );

    this.addAlignBox( densityTableAccordionBox, 'center', 'top' );

    const blocksPanelTandem = tandem.createTandem( 'blocksPanel' );

    const blocksModeRadioButtonGroup = new VerticalAquaRadioButtonGroup( model.blockSetProperty, MysteryBlockSet.enumeration.values.map( blockSet => {
      return {
        createNode: () => new Text( blockSet.stringProperty, {
          font: DensityBuoyancyCommonConstants.RADIO_BUTTON_FONT,
          maxWidth: 65
        } ),
        value: blockSet,
        tandemName: `${blockSet.tandemName}RadioButton`,
        options: {
          accessibleName: blockSet.stringProperty
        }
      };
    } ), {
      align: 'left',
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      tandem: blocksPanelTandem.createTandem( 'blockSetRadioButtonGroup' )
    } );
    const randomBlocksRefreshButton = new RefreshButton( {
      listener: () => {
        this.interruptSubtreeInput();
        model.regenerate( MysteryBlockSet.RANDOM );
      },
      iconHeight: 20,
      tandem: blocksPanelTandem.createTandem( 'randomBlocksRefreshButton' ),
      accessibleName: DensityBuoyancyCommonStrings.a11y.randomBlockRefreshStringProperty
    } );
    const blockSetContent = new VBox( {
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL
    } );

    // Include the refresh button when in random blockSet.
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    model.blockSetProperty.link( blockSet => {
      blockSetContent.children = blockSet === MysteryBlockSet.RANDOM ? [
        blocksModeRadioButtonGroup,
        randomBlocksRefreshButton
      ] : [
        blocksModeRadioButtonGroup
      ];
    } );

    const blockSetPanel = new Panel( new VBox( {
      children: [
        new Text( DensityBuoyancyCommonStrings.blocksStringProperty, {
          font: DensityBuoyancyCommonConstants.TITLE_FONT,
          maxWidth: 85
        } ),
        blockSetContent
      ],
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      align: 'left'
    } ), combineOptions<PanelOptions>( {
      tandem: blocksPanelTandem,
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    }, DensityBuoyancyCommonConstants.PANEL_OPTIONS ) );

    this.addAlignBox( blockSetPanel, 'right', 'top' );

    this.addChild( this.popupLayer );

    this.resetEmitter.addListener( () => {
      densityTableAccordionBox.reset();
    } );

    // Layer for the focusable masses. Must be in the scene graph, so they can populate the pdom order
    const cuboidPDOMLayer = new Node( { pdomOrder: [] } );
    this.addChild( cuboidPDOMLayer );

    // The focus order is described in https://github.com/phetsims/density-buoyancy-common/issues/121
    this.pdomPlayAreaNode.pdomOrder = [

      cuboidPDOMLayer,

      blockSetPanel,

      densityTableAccordionBox
    ];

    const massViewAdded = ( massView: MassView ) => {
      if ( massView instanceof CuboidView ) {

        // Only Cuboids
        cuboidPDOMLayer.pdomOrder = this.massViews.filter( view => view instanceof CuboidView && view.focusablePath )

          // Sort alphabetically based on the tag, which is specified (locale-independently) in the tandem
          .sort( ( a, b ) => a.mass.tag.tandemName.localeCompare( b.mass.tag.tandemName ) )

          .map( view => view.focusablePath );
        // nothing to do for removal since disposal of the node will remove it from the pdom order
      }
    };
    this.massViews.addItemAddedListener( massViewAdded );
    this.massViews.forEach( massViewAdded );

    this.pdomControlAreaNode.pdomOrder = [
      this.resetAllButton
    ];
  }
}

densityBuoyancyCommon.register( 'DensityMysteryScreenView', DensityMysteryScreenView );