// Copyright 2019-2025, University of Colorado Boulder

/**
 * Displays a bar-scale with interactive density labels above/below and named reference values.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import Multilink from '../../../../axon/js/Multilink.js';
import PatternStringProperty from '../../../../axon/js/PatternStringProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Bounds2 from '../../../../dot/js/Bounds2.js';
import optionize, { combineOptions } from '../../../../phet-core/js/optionize.js';
import WithRequired from '../../../../phet-core/js/types/WithRequired.js';
import ArrowNode, { ArrowNodeOptions } from '../../../../scenery-phet/js/ArrowNode.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import ManualConstraint from '../../../../scenery/js/layout/constraints/ManualConstraint.js';
import Line from '../../../../scenery/js/nodes/Line.js';
import Node, { NodeOptions } from '../../../../scenery/js/nodes/Node.js';
import Rectangle from '../../../../scenery/js/nodes/Rectangle.js';
import RichText from '../../../../scenery/js/nodes/RichText.js';
import Text, { TextOptions } from '../../../../scenery/js/nodes/Text.js';
import TPaint from '../../../../scenery/js/util/TPaint.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import Material from '../../common/model/Material.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';

// Type declarations: DisplayDensity is the object which will construct the marker and the legend
export type DisplayDensity = {
  densityProperty: TReadOnlyProperty<number>;
  nameProperty: TReadOnlyProperty<string>;
  visibleProperty: TReadOnlyProperty<boolean>;
  isHiddenProperty: TReadOnlyProperty<boolean>;
  color: TPaint;
};

type SelfOptions = {
  displayDensities: DisplayDensity[];
  width?: number;
  height?: number;
  maxDensity?: number;
  linePadding?: number;
  maxLabelWidth?: number;
  showNumericValue?: boolean;
};

// Constants and Functions
const WIDTH = 400;
const HEIGHT = 22;
const MAX_DENSITY = 10000;

// To display name: xxx kg/L dynamically
const createDensityStringProperty = (
  densityNumberProperty: TReadOnlyProperty<number>,
  nameStringProperty: TReadOnlyProperty<string>,
  isHiddenProperty: TReadOnlyProperty<boolean> ) => {
  // This is densityProperty kg/L (units depending on preferences)
  const valueUnitsStringProperty = new PatternStringProperty( DensityBuoyancyCommonConstants.KILOGRAMS_PER_VOLUME_PATTERN_STRING_PROPERTY, {
    value: densityNumberProperty
  }, {
    maps: {
      value: ( density: number ) => density / DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER
    },
    tandem: Tandem.OPT_OUT,
    decimalPlaces: 2
  } );

  // This is name: valueUnitsStringProperty
  const nameColonValueStringProperty = new PatternStringProperty( DensityBuoyancyCommonStrings.nameColonValueUnitsPatternStringProperty, {
    name: nameStringProperty,
    valueWithUnits: new DerivedProperty(
      [ isHiddenProperty, DensityBuoyancyCommonStrings.questionMarkStringProperty, valueUnitsStringProperty ],
      ( isHidden, questionMark, valueUnitsString ) => {
        return isHidden ? questionMark : valueUnitsString;
      } )
  } );

  return nameColonValueStringProperty;
};

const arrowOptions = {
  headHeight: 12,
  headWidth: 15,
  tailWidth: 3,
  stroke: null
};

const createArrow = ( index: number, color: TPaint ) => {
  return new ArrowNode( 0, index === 0 ? -7 : 7, 0, 0, combineOptions<ArrowNodeOptions>( {
    fill: color
  }, arrowOptions ) );
};

export type DensityNumberLineNodeOptions = SelfOptions & NodeOptions;

export default class DensityNumberLineNode extends Node {

  private readonly modelViewTransform: ( density: number ) => number;
  private markerNodes: Node[] = [];

  public constructor( providedOptions?: DensityNumberLineNodeOptions ) {

    const options = optionize<DensityNumberLineNodeOptions, SelfOptions, NodeOptions>()( {
      width: WIDTH,
      height: HEIGHT,
      maxDensity: MAX_DENSITY,
      linePadding: 2,
      maxLabelWidth: 90,
      showNumericValue: true
    }, providedOptions );

    super();

    const materials = [
      Material.HUMAN,
      Material.GLASS,
      Material.TITANIUM,
      Material.STEEL,
      Material.COPPER
    ];

    // We need different maxWidths for each, since some are closer to others
    const materialsMaxWidths = [
      60, 60, 70, 45, 45
    ];

    this.modelViewTransform = ( density: number ) => {
      return options.width * Math.min( density, options.maxDensity ) / options.maxDensity;
    };

    const background = new Rectangle( 0, 0, options.width, options.height, {
      fill: 'white',
      stroke: 'black'
    } );
    this.addChild( background );

    // Include the width necessary for the labels
    background.localBounds = new Bounds2( 0, 0, options.width, options.height ).dilatedX( options.maxLabelWidth / 2 );

    const lineOptions = { stroke: 'black' };
    materials.forEach( ( material, index ) => {
      const x = this.modelViewTransform( material.density );
      const label = new Text( material.nameProperty, {
        font: new PhetFont( 12 ),
        maxWidth: index < materialsMaxWidths.length ? materialsMaxWidths[ index ] : 70
      } );

      // Avoid infinite loops like https://github.com/phetsims/axon/issues/447 by applying the maxWidth to a different Node
      // than the one that is used for layout.
      const labelContainer = new Node( { children: [ label ] } );
      ManualConstraint.create( this, [ labelContainer ], labelContainerProxy => {
        labelContainerProxy.centerX = x;
        labelContainerProxy.centerY = options.height / 2;
      } );
      this.addChild( labelContainer );
      this.addChild( new Line( x, 0, x, labelContainer.top - options.linePadding, lineOptions ) );
      this.addChild( new Line( x, options.height, x, labelContainer.bottom + options.linePadding, lineOptions ) );
    } );

    this.addChild( new Text( '0', {
      right: -10,
      centerY: background.centerY,
      font: DensityBuoyancyCommonConstants.ITEM_FONT
    } ) );

    this.addChild( new Text( options.maxDensity / DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER, {
      left: options.width + 10,
      centerY: background.centerY,
      font: DensityBuoyancyCommonConstants.ITEM_FONT
    } ) );

    this.createContents( options );

    this.markerNodes.forEach( markerNode => this.addChild( markerNode ) );

    this.mutate( options );
  }

  /**
   * @param options - filled in by optionize above, but optionize doesn't export a type declaration for that
   */
  private createContents( options: WithRequired<DensityNumberLineNodeOptions, 'maxDensity'> ): void {

    const labelOptions = {
      font: new PhetFont( { size: 14, weight: 'bold' } ),
      maxWidth: options.maxLabelWidth
    };

    const markerNodes: Node[] = [];

    options.displayDensities.forEach( (
      {
        densityProperty,
        nameProperty,
        visibleProperty,
        isHiddenProperty,
        color
      }, index ) => {

      const arrow = createArrow( index, color );

      const densityStringProperty = options.showNumericValue ? createDensityStringProperty( densityProperty, nameProperty, isHiddenProperty ) : nameProperty;

      const label = new RichText( densityStringProperty, combineOptions<TextOptions>( {
        fill: color
      }, labelOptions ) );

      // Avoid infinite loops like https://github.com/phetsims/axon/issues/447 by applying the maxWidth to a different Node
      // than the one that is used for layout.
      const labelContainer = new Node( { children: [ label ] } );
      const marker = new Node( {
        children: [
          arrow,
          labelContainer
        ],
        y: index === 0 ? 0 : options.height
      } );
      markerNodes.push( marker );

      ManualConstraint.create( this, [ labelContainer, arrow ], ( labelContainerProxy, arrowProxy ) => {
        if ( index === 0 ) {
          labelContainerProxy.centerBottom = arrowProxy.centerTop;
        }
        else {
          labelContainerProxy.centerTop = arrowProxy.centerBottom;
        }
      } );

      // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
      Multilink.multilink( [
        densityProperty,
        visibleProperty,
        isHiddenProperty
      ], ( density, isVisible, isHidden ) => {
        marker.x = this.modelViewTransform( density );
        marker.visible = isVisible && !isHidden && density < ( options.maxDensity + 1e-5 );
      } );
    } );

    this.markerNodes = markerNodes;
  }
}

densityBuoyancyCommon.register( 'DensityNumberLineNode', DensityNumberLineNode );