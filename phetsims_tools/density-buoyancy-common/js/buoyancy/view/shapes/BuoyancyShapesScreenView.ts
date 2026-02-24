// Copyright 2019-2025, University of Colorado Boulder

/**
 * The main view for the Shapes screen of the Buoyancy simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DynamicProperty from '../../../../../axon/js/DynamicProperty.js';
import GatedVisibleProperty from '../../../../../axon/js/GatedVisibleProperty.js';
import Multilink from '../../../../../axon/js/Multilink.js';
import PatternStringProperty from '../../../../../axon/js/PatternStringProperty.js';
import Property from '../../../../../axon/js/Property.js';
import Bounds2 from '../../../../../dot/js/Bounds2.js';
import Vector3 from '../../../../../dot/js/Vector3.js';
import optionize, { EmptySelfOptions } from '../../../../../phet-core/js/optionize.js';
import InfoButton from '../../../../../scenery-phet/js/buttons/InfoButton.js';
import VBox from '../../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../../scenery/js/nodes/Node.js';
import DensityBuoyancyCommonConstants from '../../../common/DensityBuoyancyCommonConstants.js';
import Mass from '../../../common/model/Mass.js';
import Material from '../../../common/model/Material.js';
import TwoBlockMode from '../../../common/model/TwoBlockMode.js';
import ABPanelsNode from '../../../common/view/ABPanelsNode.js';
import BlocksModeRadioButtonGroup from '../../../common/view/BlocksModeRadioButtonGroup.js';
import MassView from '../../../common/view/MassView.js';
import MaterialControlNode from '../../../common/view/MaterialControlNode.js';
import MultiSectionPanelsNode from '../../../common/view/MultiSectionPanelsNode.js';
import ScaleView from '../../../common/view/ScaleView.js';
import VerticalCylinderView from '../../../common/view/VerticalCylinderView.js';
import densityBuoyancyCommon from '../../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../../DensityBuoyancyCommonStrings.js';
import BuoyancyShapesModel from '../../model/shapes/BuoyancyShapesModel.js';
import Cone from '../../model/shapes/Cone.js';
import Duck from '../../model/shapes/Duck.js';
import Ellipsoid from '../../model/shapes/Ellipsoid.js';
import HorizontalCylinder from '../../model/shapes/HorizontalCylinder.js';
import VerticalCylinder from '../../model/shapes/VerticalCylinder.js';
import BuoyancyScreenView, { BuoyancyScreenViewOptions } from '../BuoyancyScreenView.js';
import DensityAccordionBox from '../DensityAccordionBox.js';
import FluidDensityPanel from '../FluidDensityPanel.js';
import { ReadoutItemOptions } from '../ReadoutListAccordionBox.js';
import SubmergedAccordionBox from '../SubmergedAccordionBox.js';
import ConeView from './ConeView.js';
import DuckView from './DuckView.js';
import EllipsoidView from './EllipsoidView.js';
import HorizontalCylinderView from './HorizontalCylinderView.js';
import ShapesInfoDialog from './ShapesInfoDialog.js';
import ShapeSizeControlNode from './ShapeSizeControlNode.js';

type BuoyancyShapesScreenViewOptions = BuoyancyScreenViewOptions;

export default class BuoyancyShapesScreenView extends BuoyancyScreenView<BuoyancyShapesModel> {

  private readonly rightBox: MultiSectionPanelsNode;
  private readonly positionInfoButton: () => void;

  public constructor( model: BuoyancyShapesModel, providedOptions: BuoyancyShapesScreenViewOptions ) {

    const options = optionize<BuoyancyShapesScreenViewOptions, EmptySelfOptions, BuoyancyScreenViewOptions>()( {

      // Show the forces as larger in this case, because the masses are significantly smaller, see https://github.com/phetsims/density-buoyancy-common/issues/186
      initialForceScale: 1 / 4
    }, providedOptions );

    super( model, options );

    const tandem = options.tandem;

    // Determine which mystery materials are displayed and which are invisible (but can be enabled in PhET-iO studio)
    const displayedMysteryMaterials = [ Material.FLUID_C, Material.FLUID_D ];
    const invisibleMaterials = [ ...Material.BUOYANCY_FLUID_MYSTERY_MATERIALS ].filter( material => !displayedMysteryMaterials.includes( material ) );

    // Create and add the FluidDensityPanel to the screen.
    const fluidDensityPanel = new FluidDensityPanel( model, invisibleMaterials, this.popupLayer, tandem.createTandem( 'fluidDensityPanel' ) );
    this.addAlignBox( fluidDensityPanel, 'center', 'bottom' );
    this.addAlignBox( this.displayOptionsPanel, 'left', 'bottom' );

    // Create the info button and associated dialog, and add to the screen.
    const infoButtonTandem = tandem.createTandem( 'infoButton' );
    const infoDialog = new ShapesInfoDialog( infoButtonTandem.createTandem( 'infoDialog' ) );
    const infoButton = new InfoButton( {
      accessibleName: DensityBuoyancyCommonStrings.a11y.infoStringProperty,
      scale: 0.5,
      touchAreaDilation: 20,
      listener: () => infoDialog.show(),
      tandem: infoButtonTandem
    } );
    this.addChild( infoButton );

    // Position the info button relative to the pool bounds.
    this.positionInfoButton = () => {
      const bottomLeftPoolPoint = this.modelToViewPoint( new Vector3(
        this.model.poolBounds.minX,
        this.model.poolBounds.minY,
        this.model.poolBounds.maxZ
      ) );
      infoButton.top = bottomLeftPoolPoint.y + 10;
      infoButton.left = bottomLeftPoolPoint.x;
    };

    // Create and configure the control nodes for materials and shapes.
    const materialControls = new MaterialControlNode( this.model.materialProperty, new Property( 1 ),
      this.model.materialProperty.availableValues, this.popupLayer, {
        tandem: options.tandem.createTandem( 'materialControls' )
      } );
    const objectAShapeSizeControls = new ShapeSizeControlNode(
      model.objectA,
      new DynamicProperty( model.objectA.shapeProperty, { derive: 'volumeProperty' } ),
      this.popupLayer, {
        labelNode: ABPanelsNode.getTagALabelNode(),
        tandem: tandem.createTandem( 'objectAShapeSizeControls' ),
        visiblePropertyOptions: {
          phetioFeatured: true
        }
      }
    );
    const objectBShapeSizeControlNodeTandem = tandem.createTandem( 'objectBShapeSizeControls' );
    const objectBShapeSizeControlNode = new ShapeSizeControlNode(
      model.objectB,
      new DynamicProperty( model.objectB.shapeProperty, { derive: 'volumeProperty' } ),
      this.popupLayer, {
        labelNode: ABPanelsNode.getTagBLabelNode(),
        visibleProperty: new GatedVisibleProperty(
          new DynamicProperty( model.objectB.shapeProperty, { derive: 'internalVisibleProperty' } ),
          objectBShapeSizeControlNodeTandem
        ),
        tandem: objectBShapeSizeControlNodeTandem
      }
    );
    this.rightBox = new MultiSectionPanelsNode(
      [ materialControls, objectAShapeSizeControls, objectBShapeSizeControlNode ]
    );

    // Create and configure accordion boxes for object density and percent submerged.
    const objectDensityAccordionBox = new DensityAccordionBox( DensityBuoyancyCommonStrings.objectDensityStringProperty, {
      contentWidthMax: this.rightBox.content.width,
      readoutItems: [ { readoutItem: model.materialProperty } ],
      tandem: tandem.createTandem( 'objectDensityAccordionBox' )
    } );
    const percentSubmergedAccordionBox = new SubmergedAccordionBox( {
      contentWidthMax: this.rightBox.content.width,
      tandem: tandem.createTandem( 'percentSubmergedAccordionBox' )
    } );

    // Update the percent submerged accordion box when relevant properties change.
    Multilink.multilink( [
      model.objectA.shapeProperty,
      model.objectB.shapeProperty,
      model.modeProperty
    ], ( blockA, blockB, mode ) => {
      const masses = mode === TwoBlockMode.ONE_BLOCK ? [ blockA ] : [ blockA, blockB ];
      const readoutItems = masses.map( mass => {
        const patternStringProperty = new PatternStringProperty( DensityBuoyancyCommonStrings.shapeTagPatternStringProperty, { tag: mass.nameProperty } );

        return {
          readoutItem: mass,
          onCleanup: () => patternStringProperty.dispose(),
          readoutNameProperty: patternStringProperty,
          readoutFormat: { font: DensityBuoyancyCommonConstants.ITEM_FONT, fill: mass.tag.colorProperty }
        } satisfies ReadoutItemOptions<Mass>;
      } );

      percentSubmergedAccordionBox.setReadoutItems( readoutItems );
    } );

    // Create a VBox for the right side components and add it to the screen.
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

    // Create and add a radio button group for blocks mode.
    const blocksModeRadioButtonGroup = new BlocksModeRadioButtonGroup( model.modeProperty, {
      tandem: this.tandem.createTandem( 'blocksModeRadioButtonGroup' )
    } );

    this.alignNodeWithResetAllButton( blocksModeRadioButtonGroup );
    this.addChild( blocksModeRadioButtonGroup );

    this.setRightBarrierViewPoint( rightSideVBox.boundsProperty );

    this.addChild( this.popupLayer );

    // Add listener to reset specific components when the reset emitter triggers.
    this.resetEmitter.addListener( () => {
      percentSubmergedAccordionBox.reset();
      objectDensityAccordionBox.reset();
    } );

    const scaleViews = this.massViews.filter( massView => massView instanceof ScaleView );

    // Layer for the focusable masses. Must be in the scene graph, so they can populate the pdom order
    const blockALayer = new Node( { pdomOrder: [] } );
    this.addChild( blockALayer );
    const blockBLayer = new Node( { pdomOrder: [] } );
    this.addChild( blockBLayer );

    // The focus order is described in https://github.com/phetsims/density-buoyancy-common/issues/121
    this.pdomPlayAreaNode.pdomOrder = [
      blockALayer,
      materialControls,
      objectAShapeSizeControls,
      blockBLayer,
      objectBShapeSizeControlNode,
      fluidDensityPanel,

      // The blocks are added (a) pool then (b) outside, but the focus order is (a) outside then (b) pool
      ..._.reverse( scaleViews.map( scaleView => scaleView.focusablePath ) ),
      this.poolScaleHeightControl
    ];

    // For focus order, update PDOM element when the shapeProperty changes
    const updateMassViewLayerA = () => {
      blockALayer.pdomOrder = this.massViews.filter( massView => massView.mass === model.objectA.shapeProperty.value ).map( massView => massView.focusablePath );
    };
    const updateMassViewLayerB = () => {
      blockBLayer.pdomOrder = this.massViews.filter( massView => massView.mass === model.objectB.shapeProperty.value ).map( massView => massView.focusablePath );
    };
    model.objectA.shapeProperty.link( updateMassViewLayerA );
    model.objectB.shapeProperty.link( updateMassViewLayerB );

    model.modeProperty.link( () => {
      updateMassViewLayerA();
      updateMassViewLayerB();
    } );

    // Define the focus order for the control area, ensuring accessibility for various UI elements.
    this.pdomControlAreaNode.pdomOrder = [
      blocksModeRadioButtonGroup,
      this.displayOptionsPanel,
      objectDensityAccordionBox,
      percentSubmergedAccordionBox,
      infoButton,
      this.resetAllButton
    ];
  }

  protected override getMassViewFromMass( mass: Mass ): MassView {
    if ( mass instanceof Cone ) {
      return new ConeView( mass, this, this.displayProperties, this.popupLayer );
    }
    else if ( mass instanceof Duck ) {
      return new DuckView( mass, this, this.displayProperties, this.popupLayer );
    }
    else if ( mass instanceof Ellipsoid ) {
      return new EllipsoidView( mass, this, this.displayProperties, this.popupLayer );
    }
    else if ( mass instanceof HorizontalCylinder ) {
      return new HorizontalCylinderView( mass, this, this.displayProperties, this.popupLayer );
    }
    else if ( mass instanceof VerticalCylinder ) {
      return new VerticalCylinderView( mass, this, this.displayProperties, this.popupLayer );
    }
    else {
      return super.getMassViewFromMass( mass );
    }
  }

  /**
   * Tracks layout changes to position the info button.
   */
  public override layout( viewBounds: Bounds2 ): void {
    super.layout( viewBounds );

    // If the simulation was not able to load for WebGL, bail out
    if ( !this.sceneNode ) {
      return;
    }

    this.positionInfoButton();
  }
}

densityBuoyancyCommon.register( 'BuoyancyShapesScreenView', BuoyancyShapesScreenView );