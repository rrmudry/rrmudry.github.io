// Copyright 2024-2025, University of Colorado Boulder

/**
 * Slider control with tweaker buttons that changes the height of the Scale for some screens in the density-buoyancy
 * suite of sims.
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 */

import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Bounds3 from '../../../../dot/js/Bounds3.js';
import Dimension2 from '../../../../dot/js/Dimension2.js';
import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import Shape from '../../../../kite/js/Shape.js';
import { THREEModelViewTransform } from '../../../../mobius/js/MobiusScreenView.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import Orientation from '../../../../phet-core/js/Orientation.js';
import WithRequired from '../../../../phet-core/js/types/WithRequired.js';
import NumberControl, { NumberControlOptions } from '../../../../scenery-phet/js/NumberControl.js';
import NumberDisplay from '../../../../scenery-phet/js/NumberDisplay.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import ArrowButton from '../../../../sun/js/buttons/ArrowButton.js';
import Slider from '../../../../sun/js/Slider.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import PoolScale from '../model/PoolScale.js';
import Scale from '../model/Scale.js';
import PrecisionSliderThumb from './PrecisionSliderThumb.js';

// constants
const DEFAULT_RANGE = new Range( 0, 1 );
const SCALE_X_POSITION = 0.35;

type ScaleHeightSliderOptions = EmptySelfOptions & WithRequired<NumberControlOptions, 'tandem'>;

export default class PoolScaleHeightControl extends NumberControl {

  public constructor( poolScale: PoolScale,
                      poolBounds: Bounds3,
                      fluidYInterpolatedProperty: TReadOnlyProperty<number>,
                      modelViewTransform: THREEModelViewTransform,
                      providedOptions: ScaleHeightSliderOptions ) {

    const sliderTandem = providedOptions.tandem;
    const thumbTandem = sliderTandem.createTandem( 'slider' ).createTandem( 'thumbNode' );

    // We add this shape to the interactive area so the user can also drag the scale directly (it's part of the thumb)
    const thumbInteractionArea = Shape.rect( -5, -125, 40, 100 );
    const thumbNode = new PrecisionSliderThumb( {
      mainHeight: 12,
      lineHeight: 0,

      tandem: thumbTandem,

      // This area is in addition to the default mouse area, touch area is set below
      mouseArea: thumbInteractionArea
    } );

    const minY = poolBounds.minY;
    const maxY = fluidYInterpolatedProperty.value + Scale.SCALE_HEIGHT;

    const sliderTrackHeight = modelViewTransform.modelToViewDelta( new Vector3( SCALE_X_POSITION, maxY, poolBounds.maxZ ), new Vector3( SCALE_X_POSITION, minY, poolBounds.maxZ ) ).y;

    const options = optionize<ScaleHeightSliderOptions, EmptySelfOptions, NumberControlOptions>()( {
      sliderOptions: {
        orientation: Orientation.VERTICAL,
        thumbNode: thumbNode,
        thumbYOffset: thumbNode.height / 2,
        trackSize: new Dimension2( 3, sliderTrackHeight )
      },
      delta: DEFAULT_RANGE.getLength() / 2000,
      layoutFunction( titleNode: Node, numberDisplay: NumberDisplay, slider: Slider, decrementButton: ArrowButton | null, incrementButton: ArrowButton | null ) {
        const actualIncrement = incrementButton!;
        const actualDecrement = decrementButton!;
        actualIncrement.rotate( -Math.PI / 2 );
        actualDecrement.rotate( -Math.PI / 2 );
        const margin = 2; // Custom spacing/margin for buttons
        const vBox = new VBox( {
          align: 'left',
          spacing: margin,
          children: [ actualIncrement, slider, actualDecrement ]
        } );

        // Set the origin to exactly where placement should be (at the bottom of the slider, to line up with the scale at the bottom
        vBox.y = -( actualIncrement.height + margin + slider.height - thumbNode.width / 2 );
        return vBox;
      },
      numberDisplayOptions: {
        tandem: Tandem.OPT_OUT
      }
    }, providedOptions );

    super( '', poolScale.heightProperty, DEFAULT_RANGE, options );

    poolScale.heightProperty.link( height => {
      const currentHeight = Utils.linear( 0, 1, minY, maxY, height );

      poolScale.setPosition( SCALE_X_POSITION, currentHeight + Scale.SCALE_HEIGHT / 2 );
    } );

    thumbNode.touchArea = thumbInteractionArea.copy().rect( -10, -10, 20, 50 );
  }
}

densityBuoyancyCommon.register( 'PoolScaleHeightControl', PoolScaleHeightControl );