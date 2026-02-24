// Copyright 2019-2025, University of Colorado Boulder

/**
 * Shows a readout in front of a scale, for its measured mass/weight.
 * Not dependent on a Scale model instance.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Utils from '../../../../dot/js/Utils.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import optionize from '../../../../phet-core/js/optionize.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import Node, { NodeOptions } from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import Panel from '../../../../sun/js/Panel.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import BlendedNumberProperty from '../model/BlendedNumberProperty.js';
import GravityProperty from '../model/GravityProperty.js';
import Scale, { DisplayType } from '../model/Scale.js';

type GeneralScaleReadoutNodeSelfOptions = {
  textMaxWidth?: number;
};
type GeneralScaleReadoutNodeOptions = NodeOptions & GeneralScaleReadoutNodeSelfOptions;

/**
 * Shows the displaced weight in the Fluid Displaced accordion box, and is subtyped to show a mass/weight readout
 * on a Scale.
 */
export class GeneralScaleReadoutNode extends Node {

  private readonly stringProperty: TReadOnlyProperty<string>;

  public constructor( forceProperty: TReadOnlyProperty<number>, gravityProperty: GravityProperty,
                      displayType: DisplayType, providedOptions?: GeneralScaleReadoutNodeOptions ) {
    const options = optionize<GeneralScaleReadoutNodeOptions, GeneralScaleReadoutNodeSelfOptions, NodeOptions>()( {
      pickable: false,
      textMaxWidth: 85
    }, providedOptions );
    super( options );

    this.stringProperty = new DerivedProperty( [
      forceProperty,
      gravityProperty.gravityValueProperty,
      DensityBuoyancyCommonStrings.newtonsPatternStringProperty,
      DensityBuoyancyCommonStrings.kilogramsPatternStringProperty
    ], ( scaleForce, gravityValue, newtonsPattern, kilogramsPattern ) => {
      if ( displayType === DisplayType.NEWTONS ) {
        return StringUtils.fillIn( newtonsPattern, {
          newtons: Utils.toFixed( scaleForce, 1 )
        } );
      }
      else {
        return StringUtils.fillIn( kilogramsPattern, {
          kilograms: gravityValue > 0 ? Utils.toFixed( scaleForce / gravityValue, 2 ) : '-'
        } );
      }
    } );

    const readoutText = new Text( this.stringProperty, {
      font: new PhetFont( {
        size: 16,
        weight: 'bold'
      } ),
      maxWidth: options.textMaxWidth
    } );

    const readoutPanel = new Panel( readoutText, {
      cornerRadius: DensityBuoyancyCommonConstants.CORNER_RADIUS,
      xMargin: 2,
      yMargin: 2,
      fill: null,
      stroke: null
    } );

    readoutPanel.localBoundsProperty.link( () => {
      readoutPanel.center = Vector2.ZERO;
    } );

    this.addChild( readoutPanel );
  }

  public override dispose(): void {
    this.stringProperty.dispose();

    super.dispose();
  }
}

/**
 * Shows a mass or weight readout on a ScaleNode.
 */
export default class ScaleReadoutNode extends GeneralScaleReadoutNode {

  public constructor(
    public readonly buoyancyScale: Scale, // Cannot be named 'scale' because Node already has a different property called scale
    gravityProperty: GravityProperty
  ) {

    const blendedProperty = new BlendedNumberProperty( buoyancyScale.measuredWeightInterpolatedProperty.value );
    const update = () => {
      buoyancyScale.measuredWeightInterpolatedProperty.markNextLockedReadSafe();
      blendedProperty.step( buoyancyScale.measuredWeightInterpolatedProperty.value );
    };
    buoyancyScale.stepEmitter.addListener( update );

    super( blendedProperty, gravityProperty, buoyancyScale.displayType );

    this.disposeEmitter.addListener( () => {
      buoyancyScale.stepEmitter.removeListener( update );
      blendedProperty.dispose();
    } );
  }
}

densityBuoyancyCommon.register( 'ScaleReadoutNode', ScaleReadoutNode );