// Copyright 2019-2025, University of Colorado Boulder

/**
 * Shows a force diagram for an individual mass.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Utils from '../../../../dot/js/Utils.js';
import { combineOptions } from '../../../../phet-core/js/optionize.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import ArrowNode, { ArrowNodeOptions } from '../../../../scenery-phet/js/ArrowNode.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import Line from '../../../../scenery/js/nodes/Line.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import Panel from '../../../../sun/js/Panel.js';
import DisplayProperties from '../../buoyancy/view/DisplayProperties.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import BlendedVector2Property from '../model/BlendedVector2Property.js';
import Mass from '../model/Mass.js';
import DensityBuoyancyCommonColors from './DensityBuoyancyCommonColors.js';

// constants
export const arrowOptions = {
  stroke: null,
  tailWidth: 4,
  headWidth: 15,
  headHeight: 12
};
const arrowSpacing = arrowOptions.headWidth + 3;
const labelFont = new PhetFont( { size: 12, weight: 'bold' } );

export default class ForceDiagramNode extends Node {

  private readonly gravityArrowNode: ArrowNode;
  private readonly buoyancyArrowNode: ArrowNode;
  private readonly contactArrowNode: ArrowNode;

  private readonly gravityLabelText: Text;
  private readonly buoyancyLabelText: Text;
  private readonly contactLabelText: Text;

  private readonly gravityLabelNode: Node;
  private readonly buoyancyLabelNode: Node;
  private readonly contactLabelNode: Node;

  private readonly arrowMap: Map<ArrowNode, Node>;

  private readonly axisNode: Line;

  public constructor( private readonly mass: Mass, private readonly displayProperties: DisplayProperties ) {
    super( {

      // Make unpickable so the user can grab the mass through the force diagram
      pickable: false
    } );

    this.gravityArrowNode = new ArrowNode( 0, 0, 0, 0, combineOptions<ArrowNodeOptions>( {
      fill: DensityBuoyancyCommonColors.gravityForceProperty
    }, arrowOptions ) );
    this.buoyancyArrowNode = new ArrowNode( 0, 0, 0, 0, combineOptions<ArrowNodeOptions>( {
      fill: DensityBuoyancyCommonColors.buoyancyForceProperty
    }, arrowOptions ) );
    this.contactArrowNode = new ArrowNode( 0, 0, 0, 0, combineOptions<ArrowNodeOptions>( {
      fill: DensityBuoyancyCommonColors.contactForceProperty
    }, arrowOptions ) );

    const textMaxWidth = 150;

    this.gravityLabelText = new Text( '', {
      font: labelFont,
      fill: DensityBuoyancyCommonColors.gravityForceProperty,
      maxWidth: textMaxWidth
    } );
    this.buoyancyLabelText = new Text( '', {
      font: labelFont,
      fill: DensityBuoyancyCommonColors.buoyancyForceProperty,
      maxWidth: textMaxWidth
    } );
    this.contactLabelText = new Text( '', {
      font: labelFont,
      fill: DensityBuoyancyCommonColors.contactForceProperty,
      maxWidth: textMaxWidth
    } );

    const panelOptions = {
      stroke: null,
      fill: DensityBuoyancyCommonColors.massLabelBackgroundProperty,
      cornerRadius: 0,
      xMargin: 2,
      yMargin: 1
    };

    this.gravityLabelNode = new Panel( this.gravityLabelText, panelOptions );
    this.buoyancyLabelNode = new Panel( this.buoyancyLabelText, panelOptions );
    this.contactLabelNode = new Panel( this.contactLabelText, panelOptions );

    this.arrowMap = new Map();
    this.arrowMap.set( this.gravityArrowNode, this.gravityLabelNode );
    this.arrowMap.set( this.buoyancyArrowNode, this.buoyancyLabelNode );
    this.arrowMap.set( this.contactArrowNode, this.contactLabelNode );

    this.axisNode = new Line( {
      stroke: 'black'
    } );

    const newtonsPatternProperty = DensityBuoyancyCommonStrings.newtonsPatternStringProperty;

    const stringListener = this.update.bind( this );
    newtonsPatternProperty.lazyLink( stringListener );
    this.disposeEmitter.addListener( () => newtonsPatternProperty.unlink( stringListener ) );
  }

  /**
   * Updates the displayed view.
   */
  public update(): void {
    const upwardArrows: ArrowNode[] = [];
    const downwardArrows: ArrowNode[] = [];
    const labels: Node[] = [];

    const updateArrow = ( forceProperty: BlendedVector2Property, showForceProperty: TReadOnlyProperty<boolean>, arrowNode: ArrowNode, textNode: Text, labelNode: Node ) => {
      const y = forceProperty.value.y;

      // Set the threshold high enough to avoid flickering due to spurious values from the p2 engine, but low enough that
      // forces will still add up correctly (they are rounded to nearest 0.1 when over 10 or 0.01 when under 10).
      if ( showForceProperty.value && Math.abs( y ) >= 0.05 ) {
        arrowNode.setTip( 0, -y * this.displayProperties.vectorZoomProperty.value * 20 ); // Default zoom is 20 units per Newton
        const arrowNodes = y > 0 ? upwardArrows : downwardArrows;
        arrowNodes.push( arrowNode );

        if ( this.displayProperties.forceValuesVisibleProperty.value ) {

          // We have a listener to the string that will call update
          textNode.string = StringUtils.fillIn( DensityBuoyancyCommonStrings.newtonsPatternStringProperty, {
            newtons: Utils.toFixed( forceProperty.value.magnitude, 1 )
          } );
          labels.push( labelNode );
        }
      }
    };

    // Documentation specifies that contact force should always be on the left if there are conflicts
    updateArrow( this.mass.contactForceBlendedProperty, this.displayProperties.contactForceVisibleProperty, this.contactArrowNode, this.contactLabelText, this.contactLabelNode );
    updateArrow( this.mass.gravityForceBlendedProperty, this.displayProperties.gravityForceVisibleProperty, this.gravityArrowNode, this.gravityLabelText, this.gravityLabelNode );
    updateArrow( this.mass.buoyancyForceBlendedProperty, this.displayProperties.buoyancyForceVisibleProperty, this.buoyancyArrowNode, this.buoyancyLabelText, this.buoyancyLabelNode );

    this.children = [
      ...upwardArrows,
      ...downwardArrows,
      ...( upwardArrows.length + downwardArrows.length > 0 ? [ this.axisNode ] : [] ),
      ...labels
    ];

    const positionArrow = ( array: ArrowNode[], index: number, isUp: boolean ) => {
      const arrow = array[ index ];
      arrow.x = ( index - ( array.length - 1 ) / 2 ) * arrowSpacing;
      if ( this.displayProperties.forceValuesVisibleProperty.value ) {
        const label = this.arrowMap.get( arrow )!;
        if ( isUp ) {
          label.bottom = -2;
        }
        else {
          label.top = 2;
        }
        if ( index + 1 < array.length ) {
          label.right = arrow.left - 2;
        }
        else {
          label.left = arrow.right + 2;
        }
      }
    };

    // Layout arrows with spacing
    for ( let i = 0; i < upwardArrows.length; i++ ) {
      positionArrow( upwardArrows, i, true );
    }
    for ( let i = 0; i < downwardArrows.length; i++ ) {
      positionArrow( downwardArrows, i, false );
    }

    const axisHalfWidth = Math.max( upwardArrows.length, downwardArrows.length ) * 10 - 5;
    this.axisNode.x1 = -axisHalfWidth;
    this.axisNode.x2 = axisHalfWidth;
  }
}

densityBuoyancyCommon.register( 'ForceDiagramNode', ForceDiagramNode );