// Copyright 2019-2025, University of Colorado Boulder

/**
 * The main view for the Intro screen of the Density simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import DerivedStringProperty from '../../../../axon/js/DerivedStringProperty.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import optionize, { combineOptions, EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import RichText from '../../../../scenery/js/nodes/RichText.js';
import AccordionBox, { AccordionBoxOptions } from '../../../../sun/js/AccordionBox.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import DensityBuoyancyCommonPreferences from '../../common/model/DensityBuoyancyCommonPreferences.js';
import ABControlsNode from '../../common/view/ABControlsNode.js';
import BlocksModeRadioButtonGroup from '../../common/view/BlocksModeRadioButtonGroup.js';
import DensityBuoyancyCommonColors from '../../common/view/DensityBuoyancyCommonColors.js';
import DensityBuoyancyScreenView, { DensityBuoyancyScreenViewOptions } from '../../common/view/DensityBuoyancyScreenView.js';
import MassView from '../../common/view/MassView.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityIntroModel from '../model/DensityIntroModel.js';
import DensityNumberLineNode from './DensityNumberLineNode.js';

type DensityIntroScreenViewOptions = DensityBuoyancyScreenViewOptions;

export default class DensityIntroScreenView extends DensityBuoyancyScreenView<DensityIntroModel> {

  private readonly rightBox: ABControlsNode;

  public constructor( model: DensityIntroModel, providedOptions: DensityIntroScreenViewOptions ) {

    const options = optionize<DensityIntroScreenViewOptions, EmptySelfOptions, DensityBuoyancyScreenViewOptions>()( {}, providedOptions );

    super( model, options );

    const tandem = options.tandem;

    this.rightBox = new ABControlsNode(
      model.blockA,
      model.blockB,
      this.popupLayer, {
        tandem: tandem,
        maxCustomMass: 10
      } );

    const accordionTandem = tandem.createTandem( 'densityAccordionBox' );
    const accordionBoxTitleStringProperty = new DerivedStringProperty( [
      DensityBuoyancyCommonPreferences.volumeUnitsProperty,
      DensityBuoyancyCommonStrings.densityReadoutStringProperty,
      DensityBuoyancyCommonStrings.densityReadoutDecimetersCubedStringProperty
    ], ( units, litersReadout, decimetersCubedReadout ) => {
      return units === 'liters' ? litersReadout : decimetersCubedReadout;
    }, {
      tandem: accordionTandem.createTandem( 'titleStringProperty' )
    } );
    const densityAccordionBox = new AccordionBox( new DensityNumberLineNode( {
        displayDensities: [
          {
            densityProperty: model.blockA.materialProperty.densityProperty,
            nameProperty: model.blockA.tag.nameProperty,
            visibleProperty: new BooleanProperty( true ),
            isHiddenProperty: new BooleanProperty( false ),
            color: DensityBuoyancyCommonColors.tagAProperty
          },
          {
            densityProperty: model.blockB.materialProperty.densityProperty,
            nameProperty: model.blockB.tag.nameProperty,
            visibleProperty: model.blockB.visibleProperty,
            isHiddenProperty: new BooleanProperty( false ),
            color: DensityBuoyancyCommonColors.tagBProperty
          }
        ],
        tandem: accordionTandem.createTandem( 'densityReadout' ),
        visiblePropertyOptions: {
          phetioReadOnly: true
        }
      }
    ), combineOptions<AccordionBoxOptions>( {
      titleNode: new RichText( accordionBoxTitleStringProperty, {
        font: DensityBuoyancyCommonConstants.TITLE_FONT,
        maxWidth: 200
      } ),
      buttonAlign: 'left' as const,
      tandem: accordionTandem,
      accessibleName: accordionBoxTitleStringProperty
    }, DensityBuoyancyCommonConstants.ACCORDION_BOX_OPTIONS ) );
    this.addAlignBox( densityAccordionBox, 'center', 'top' );

    this.addAlignBox( this.rightBox, 'right', 'top' );

    // DerivedProperty doesn't need disposal, since everything here lives for the lifetime of the simulation
    this.rightBarrierViewPointPropertyProperty.value = new DerivedProperty( [ this.rightBox.boundsProperty, this.visibleBoundsProperty ], ( boxBounds, visibleBounds ) => {

      // We might not have a box, see https://github.com/phetsims/density/issues/110
      return new Vector2( isFinite( boxBounds.left ) ? boxBounds.left : visibleBounds.right, visibleBounds.centerY );
    } );

    const blocksModeRadioButtonGroup = new BlocksModeRadioButtonGroup( model.modeProperty, {
      tandem: this.tandem.createTandem( 'blocksModeRadioButtonGroup' )
    } );
    blocksModeRadioButtonGroup.bottom = this.resetAllButton.bottom;
    blocksModeRadioButtonGroup.right = this.resetAllButton.left - 20;
    this.addChild( blocksModeRadioButtonGroup );

    this.addChild( this.popupLayer );

    // Layer for the focusable masses. Must be in the scene graph, so they can populate the pdom order
    const cubeALayer = new Node( { pdomOrder: [] } );
    this.addChild( cubeALayer );
    const cubeBLayer = new Node( { pdomOrder: [] } );
    this.addChild( cubeBLayer );

    // The focus order is described in https://github.com/phetsims/density-buoyancy-common/issues/121
    this.pdomPlayAreaNode.pdomOrder = [

      cubeALayer,
      this.rightBox.controlANode,

      cubeBLayer,
      this.rightBox.controlBNode
    ];

    const massViewAdded = ( massView: MassView ) => {
      if ( massView.mass === model.blockA ) {
        cubeALayer.pdomOrder = [ ...cubeALayer.pdomOrder!, massView.focusablePath ];
        // nothing to do for removal since disposal of the node will remove it from the pdom order
      }
      else if ( massView.mass === model.blockB ) {
        cubeBLayer.pdomOrder = [ ...cubeBLayer.pdomOrder!, massView.focusablePath ];
        // nothing to do for removal since disposal of the node will remove it from the pdom order
      }
    };
    this.massViews.addItemAddedListener( massViewAdded );
    this.massViews.forEach( massViewAdded );

    this.resetEmitter.addListener( () => {
      densityAccordionBox.reset();
    } );

    this.pdomControlAreaNode.pdomOrder = [
      blocksModeRadioButtonGroup,
      densityAccordionBox,
      this.resetAllButton
    ];
  }
}

densityBuoyancyCommon.register( 'DensityIntroScreenView', DensityIntroScreenView );