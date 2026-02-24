// Copyright 2019-2025, University of Colorado Boulder

/**
 * A control that allows modification of the mass and volume (which can be linked, or unlinked for custom materials).
 * This also has support for changing the material, see MaterialControlNode.
 *
 * Note that NumberControl does not support mutating the provided Range (just the enabled range subset), and so this
 * class can create two NumberControl instances for controlling the mass. See options.highDensityMaxMass for details.
 * This was much easier than updating NumberControl and NumberDisplay to support a dynamic range, see https://github.com/phetsims/buoyancy/issues/31.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import NumberProperty from '../../../../axon/js/NumberProperty.js';
import Property from '../../../../axon/js/Property.js';
import ReadOnlyProperty from '../../../../axon/js/ReadOnlyProperty.js';
import Dimension2 from '../../../../dot/js/Dimension2.js';
import Range from '../../../../dot/js/Range.js';
import Utils from '../../../../dot/js/Utils.js';
import optionize, { combineOptions } from '../../../../phet-core/js/optionize.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import NumberControl, { LayoutFunction, NumberControlOptions } from '../../../../scenery-phet/js/NumberControl.js';
import NumberDisplay from '../../../../scenery-phet/js/NumberDisplay.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import AlignGroup from '../../../../scenery/js/layout/constraints/AlignGroup.js';
import ManualConstraint from '../../../../scenery/js/layout/constraints/ManualConstraint.js';
import HBox from '../../../../scenery/js/layout/nodes/HBox.js';
import VBox, { VBoxOptions } from '../../../../scenery/js/layout/nodes/VBox.js';
import Node from '../../../../scenery/js/nodes/Node.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import TColor from '../../../../scenery/js/util/TColor.js';
import BooleanToggleNode from '../../../../sun/js/BooleanToggleNode.js';
import ArrowButton from '../../../../sun/js/buttons/ArrowButton.js';
import Slider from '../../../../sun/js/Slider.js';
import isSettingPhetioStateProperty from '../../../../tandem/js/isSettingPhetioStateProperty.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import { GuardedNumberProperty } from '../model/GuardedNumberProperty.js';
import Material from '../model/Material.js';
import MaterialProperty from '../model/MaterialProperty.js';
import MaterialControlNode, { MaterialControlNodeOptions } from './MaterialControlNode.js';
import PrecisionSliderThumb from './PrecisionSliderThumb.js';

// constants
const LITERS_IN_CUBIC_METER = DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER;
const TRACK_HEIGHT = 3;

// A workaround for changing a DerivedProperty range Property to a NumberProperty, where the new range AND value will
// not overlap with the previous one.
class WorkaroundRange extends Range {
  public override contains( value: number ): boolean { return true; }
}

type SelfOptions = {
  minMass?: number; // The minimum mass available to select
  maxMass?: number; // The maximum mass available to select

  // Used in the Applications Screen View to increase the mass range for dense materials. null opts out of this feature.
  highDensityMaxMass?: number | null;

  // Used only with highDensityMaxMass, Density above which the range switches from normal to high density mass control.
  highDensityThreshold?: number;

  minVolumeLiters?: number;
  color?: TColor;

  showMassAsReadout?: boolean;
  customKeepsConstantDensity?: boolean;

  useDensityControlInsteadOfMassControl?: boolean;
};

export type MaterialMassVolumeControlNodeOptions = SelfOptions & MaterialControlNodeOptions;

export default class MaterialMassVolumeControlNode extends MaterialControlNode {

  // When the density slider is shown instead of the mass slider, via the useDensityControlInsteadOfMassControl option
  // the density slider can be added to this layer to show up in the right position (above the volume slider).
  protected readonly densityControlPlaceholderLayer: Node = new Node();

  public constructor( materialProperty: MaterialProperty,
                      massProperty: ReadOnlyProperty<number>,
                      volumeProperty: Property<number>,
                      materials: Material[],
                      setVolume: ( volume: number ) => void,
                      listParent: Node,
                      providedOptions: MaterialMassVolumeControlNodeOptions ) {

    const options = optionize<MaterialMassVolumeControlNodeOptions, SelfOptions, MaterialControlNodeOptions>()( {
      minMass: 0.1,
      maxMass: 27,
      highDensityMaxMass: null,
      highDensityThreshold: 2700,
      minVolumeLiters: 1,
      maxVolumeLiters: 10,
      minCustomMass: 0.5,
      maxCustomMass: 27,
      minCustomVolumeLiters: 1,
      color: DensityBuoyancyCommonConstants.THUMB_FILL,
      useDensityControlInsteadOfMassControl: false,

      // For use by the application's bottle scene
      showMassAsReadout: false,
      customKeepsConstantDensity: false
    }, providedOptions );

    assert && assert( options.minVolumeLiters <= options.minCustomVolumeLiters, 'This seems to be a requirement, I hope you never hit this' );

    assert && assert( options.highDensityMaxMass !== 0, 'highDensityMaxMass should not be 0' );

    // If we will be creating a high density mass NumberControl in addition to the normal one.
    const supportTwoMassNumberControls = !!options.highDensityMaxMass;

    if ( options.highDensityMaxMass ) {
      assert && assert( options.highDensityMaxMass > options.maxMass, 'highDensityMaxMass should be greater than maxMass' );
    }

    // Mass-related elements should not be instrumented if showing as a Density control instead of Mass control.
    const massNumberControlContainerTandem = options.useDensityControlInsteadOfMassControl ? Tandem.OPT_OUT :
                                             options.showMassAsReadout ? options.tandem.createTandem( 'massDisplay' ) :
                                             options.tandem.createTandem( 'massNumberControl' );

    const volumeNumberControlTandem = options.tandem.createTandem( 'volumeNumberControl' );

    super( materialProperty, volumeProperty, materials, listParent, options );

    // We need to use "locks" since our behavior is different based on whether the model or user is changing the value
    let modelMassChanging = false;
    let userMassChanging = false;
    let modelVolumeChanging = false;
    let userVolumeChanging = false;

    // reset locks before setting state also so that below listeners have the correct effect. See https://github.com/phetsims/density-buoyancy-common/issues/217
    isSettingPhetioStateProperty.lazyLink( () => {
      modelMassChanging = false;
      userMassChanging = false;
      modelVolumeChanging = false;
      userVolumeChanging = false;
    } );

    // DerivedProperty doesn't need disposal, since everything here lives for the lifetime of the simulation
    const enabledMassRangeProperty = new DerivedProperty( [ materialProperty, materialProperty.densityProperty ],
      ( material, density ) => {
        if ( material.custom ) {
          return new Range( options.minCustomMass, options.maxCustomMass );
        }
        else {
          const maxMassRange = supportTwoMassNumberControls && density > options.highDensityThreshold ? options.highDensityMaxMass! : options.maxMass;

          const minMass = Utils.clamp( density * options.minVolumeLiters / LITERS_IN_CUBIC_METER, options.minMass, maxMassRange );
          const maxMass = Utils.clamp( density * options.maxVolumeLiters / LITERS_IN_CUBIC_METER, options.minMass, maxMassRange );

          return new WorkaroundRange( minMass, maxMass );
        }
      }, {
        reentrant: true,
        phetioState: false,
        phetioValueType: Range.RangeIO,
        valueComparisonStrategy: 'equalsFunction',
        units: 'kg',
        tandem: massNumberControlContainerTandem.createTandem( 'enabledRangeProperty' ),
        phetioDocumentation: 'This range accommodates the full range of the corresponding volume, given the current material/density.',
        phetioFeatured: !options.showMassAsReadout
      } );

    const enabledVolumeRangeProperty = new DerivedProperty( [ materialProperty ], material => {
      return new WorkaroundRange(
        material.custom ? options.minCustomVolumeLiters : options.minVolumeLiters,
        options.maxVolumeLiters
      );
    }, {
      valueComparisonStrategy: 'equalsFunction'
    } );

    const maxMass = Math.max( ...[ options.maxMass, options.maxCustomMass, options.highDensityMaxMass ].filter( x => typeof x === 'number' ) );

    // passed to the NumberControl
    const numberControlMassProperty = new GuardedNumberProperty( massProperty.value, {
      range: new Range( options.minMass, maxMass ),
      units: 'kg',
      tandem: massNumberControlContainerTandem.createTandem( 'massProperty' ),
      phetioFeatured: true,

      // Does not need to be stateful because the model itself preserves the value. This is an intermediate adapter so
      // that PhET-iO custom wrapper developers can set the value, and have the dependent variables update correctly.
      // see https://github.com/phetsims/density-buoyancy-common/issues/378
      phetioState: false,
      phetioReadOnly: options.showMassAsReadout,
      phetioDocumentation: 'This Property is defined and controlled in the view, and is used to propagate the user-selected mass value to the model.',

      // Bypass the WorkaroundRange
      getPhetioSpecificValidationError: proposedMass => {
        if ( !Range.prototype.contains.call( enabledMassRangeProperty.value, proposedMass ) ) {
          return `The proposed mass ${proposedMass}kg should be between the values of ${enabledMassRangeProperty.value.min}-${enabledMassRangeProperty.value.max}.`;
        }
        return null;
      }
    } );

    numberControlMassProperty.addLinkedElement( massProperty );

    // passed to the NumberControl - liters from m^3
    const numberControlVolumeProperty = new NumberProperty( volumeProperty.value * LITERS_IN_CUBIC_METER, {
      range: new Range( options.minVolumeLiters, options.maxVolumeLiters ),
      units: 'L',
      tandem: volumeNumberControlTandem.createTandem( 'volumeProperty' ),
      phetioFeatured: true,

      // Does not need to be stateful because the model itself preserves the value. This is an intermediate adapter so
      // that PhET-iO custom wrapper developers can set the value, and have the dependent variables update correctly.
      // see https://github.com/phetsims/density-buoyancy-common/issues/378
      phetioState: false,
      phetioDocumentation: 'This Property is defined and controlled in the view, and is used to propagate the user-selected volume value to the model.'
    } );

    numberControlVolumeProperty.addLinkedElement( volumeProperty );

    // Update the volume when the user is changing it.
    // If the material is custom and not set to keep constant density, recalculate the density based on the new volume.
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    numberControlVolumeProperty.lazyLink( liters => {
      if ( !modelVolumeChanging && !userMassChanging ) {
        const cubicMeters = liters / LITERS_IN_CUBIC_METER;

        userVolumeChanging = true;

        // If we're custom, adjust the density
        if ( materialProperty.value.custom && !options.customKeepsConstantDensity ) {
          materialProperty.value.densityProperty.value = massProperty.value / cubicMeters;
        }
        setVolume( cubicMeters );

        userVolumeChanging = false;
      }
    } );

    // Update the numberControlVolumeProperty when the model changes the volumeProperty changes
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    volumeProperty.lazyLink( cubicMeters => {
      if ( !userVolumeChanging ) {
        modelVolumeChanging = true;

        // If the value is close to min/max, set it to the exact min/max, see https://github.com/phetsims/density/issues/46
        let volumeLiters = cubicMeters * LITERS_IN_CUBIC_METER;
        if ( volumeLiters > options.minVolumeLiters && volumeLiters < options.minVolumeLiters + 1e-10 ) {
          volumeLiters = options.minVolumeLiters;
        }
        if ( volumeLiters < options.maxVolumeLiters && volumeLiters > options.maxVolumeLiters - 1e-10 ) {
          volumeLiters = options.maxVolumeLiters;
        }

        numberControlVolumeProperty.value = Utils.clamp( volumeLiters, options.minVolumeLiters, options.maxVolumeLiters );

        modelVolumeChanging = false;
      }
    } );

    // Update the density or volume when the user is changing the mass.
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    numberControlMassProperty.lazyLink( mass => {
      if ( !modelMassChanging && !userVolumeChanging ) {
        userMassChanging = true;

        // It is possible for the volumeProperty to be 0, so avoid the infinite density case, see https://github.com/phetsims/density-buoyancy-common/issues/78
        if ( materialProperty.value.custom && volumeProperty.value > 0 ) {
          if ( !options.customKeepsConstantDensity ) { // Separate if statement, so we don't setVolume() below
            materialProperty.value.densityProperty.value = mass / volumeProperty.value;
          }
        }
        else {
          setVolume( mass / materialProperty.value.density );
        }

        userMassChanging = false;
      }
    } );

    // When the model changes the mass, update the enabledMassRangeProperty and numberControlMassProperty
    // This instance lives for the lifetime of the simulation, so we don't need to remove this listener
    massProperty.lazyLink( mass => {
      if ( !userMassChanging ) {
        modelMassChanging = true;

        enabledMassRangeProperty.recomputeDerivation();

        // If the value is close to min/max, massage it to the exact value, see https://github.com/phetsims/density/issues/46
        let adjustedMass = mass;
        const min = enabledMassRangeProperty.value.min;
        const max = enabledMassRangeProperty.value.max;
        if ( adjustedMass > min && adjustedMass < min + 1e-10 ) {
          adjustedMass = min;
        }
        if ( adjustedMass < max && adjustedMass > max - 1e-10 ) {
          adjustedMass = max;
        }

        numberControlMassProperty.value = Utils.clamp( adjustedMass, min, max );

        modelMassChanging = false;
      }
    } );

    const volumeNumberControl = new NumberControl( DensityBuoyancyCommonStrings.volumeStringProperty, numberControlVolumeProperty, new Range( options.minVolumeLiters, options.maxVolumeLiters ), combineOptions<NumberControlOptions>( {
      sliderOptions: {
        thumbNode: new PrecisionSliderThumb( {
          thumbFill: options.color,
          tandem: volumeNumberControlTandem.createTandem( 'slider' ).createTandem( 'thumbNode' )
        } ),
        constrainValue: ( value: number ) => Utils.roundSymmetric( value * 2 ) / 2,
        phetioLinkedProperty: numberControlVolumeProperty
      },
      numberDisplayOptions: {
        valuePattern: DensityBuoyancyCommonConstants.VOLUME_PATTERN_STRING_PROPERTY,
        useRichText: true
      },
      enabledRangeProperty: enabledVolumeRangeProperty,
      accessibleName: DensityBuoyancyCommonStrings.volumeStringProperty,
      tandem: volumeNumberControlTandem,
      titleNodeOptions: {
        visiblePropertyOptions: {
          phetioReadOnly: true
        }
      }
    }, MaterialMassVolumeControlNode.getNumberControlOptions() ) );

    const massContainerNode = new VBox( {
      stretch: true,
      excludeInvisibleChildrenFromBounds: true
    } );

    const createMassNumberControl = ( maxMass: number, tandem: Tandem ) => {

      // If we are showing the mass as a readout, don't provide all the number control tandems
      // see https://github.com/phetsims/buoyancy/issues/180
      const numberControlTandem = options.showMassAsReadout ? Tandem.OPT_OUT : tandem;

      return new NumberControl(
        DensityBuoyancyCommonStrings.massStringProperty,
        numberControlMassProperty,
        new Range( options.minMass, maxMass ),
        combineOptions<NumberControlOptions>( {
          // Providing a manual visible property when the number control is not instrumented
          // see https://github.com/phetsims/buoyancy/issues/180
          visibleProperty: options.showMassAsReadout ? new BooleanProperty( true, {
            tandem: massNumberControlContainerTandem.createTandem( 'visibleProperty' )
          } ) : undefined,
          sliderOptions: {
            thumbNode: new PrecisionSliderThumb( {
              thumbFill: options.color,
              tandem: numberControlTandem.createTandem( 'slider' ).createTandem( 'thumbNode' )
            } ),
            constrainValue: ( value: number ) => {
              const range = enabledMassRangeProperty.value;

              // Don't snap before ranges, since this doesn't work for Styrofoam case, see
              // https://github.com/phetsims/density/issues/46
              if ( value <= range.min ) {
                return range.min;
              }
              if ( value >= range.max ) {
                return range.max;
              }
              return enabledMassRangeProperty.value.constrainValue( Utils.toFixedNumber( value, 1 ) );
            },
            phetioLinkedProperty: numberControlMassProperty
          },
          numberDisplayOptions: {
            ...( options.showMassAsReadout ? // eslint-disable-line phet/no-object-spread-on-non-literals
                {
                  numberFormatter: value => {
                    if ( options.showMassAsReadout && materialProperty.value.hidden ) {
                      return DensityBuoyancyCommonStrings.questionMarkStringProperty.value;
                    }
                    return StringUtils.fillIn( DensityBuoyancyCommonConstants.KILOGRAMS_PATTERN_STRING_PROPERTY, {
                      value: Utils.toFixed( value, 2 )
                    } );
                  },
                  numberFormatterDependencies: [
                    DensityBuoyancyCommonConstants.KILOGRAMS_PATTERN_STRING_PROPERTY,
                    DensityBuoyancyCommonStrings.questionMarkStringProperty,
                    materialProperty
                  ]
                } : {
                  valuePattern: DensityBuoyancyCommonConstants.KILOGRAMS_PATTERN_STRING_PROPERTY
                }
            )
          },
          enabledRangeProperty: enabledMassRangeProperty,
          accessibleName: DensityBuoyancyCommonStrings.massStringProperty,
          tandem: numberControlTandem,
          titleNodeOptions: {
            visiblePropertyOptions: {
              phetioReadOnly: true
            }
          },

          visiblePropertyOptions: {
            // We don't want them messing with visibility if we are toggling it for low/high density
            phetioReadOnly: supportTwoMassNumberControls
          }
        }, MaterialMassVolumeControlNode.getNumberControlOptions( options.showMassAsReadout ) ) );
    };

    if ( options.useDensityControlInsteadOfMassControl ) {
      // Nothing please
    }
    else if ( supportTwoMassNumberControls ) {

      const showHighDensityMassNumberControlProperty = new DerivedProperty( [ materialProperty, materialProperty.densityProperty ], ( material, density ) => {
        return density > options.highDensityThreshold && !material.custom;
      } );

      const alignGroup = new AlignGroup();

      const createAlignGroupChild = ( node: Node ) => {
        return alignGroup.createBox( new VBox( {
          stretch: true,
          children: [ node ]
        } ), {
          align: 'stretch'
        } );
      };

      const highDensityAlignGroup = createAlignGroupChild(
        createMassNumberControl( options.highDensityMaxMass!, massNumberControlContainerTandem.createTandem( 'highDensityMassNumberControl' ) )
      );
      const lowDensityAlignGroup = createAlignGroupChild(
        createMassNumberControl( options.maxMass, massNumberControlContainerTandem.createTandem( 'lowDensityMassNumberControl' ) )
      );

      const toggleNode = new BooleanToggleNode(
        showHighDensityMassNumberControlProperty,
        highDensityAlignGroup,
        lowDensityAlignGroup, {
          excludeInvisibleChildrenFromBounds: true
        }
      );

      massContainerNode.addChild( toggleNode );

      // When using two mass number controls, we need to provide a visible property for the group
      // see https://github.com/phetsims/buoyancy/issues/180
      const massNumberControlVisibleProperty = new BooleanProperty( true, {
        tandem: massNumberControlContainerTandem.createTandem( 'visibleProperty' ),
        phetioFeatured: true
      } );

      massContainerNode.visibleProperty = massNumberControlVisibleProperty;
    }
    else {

      massContainerNode.addChild( createMassNumberControl( options.maxMass, massNumberControlContainerTandem ) );
    }

    const massVolumeVBox = new VBox( combineOptions<VBoxOptions>( {
      stretch: true,
      children: [ this.densityControlPlaceholderLayer, massContainerNode, volumeNumberControl ],
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL
    } ) );

    const hiddenMaterialNode = new Text( DensityBuoyancyCommonStrings.whatIsTheMaterialStringProperty, {
      font: new PhetFont( 14 )
    } );
    ManualConstraint.create( this, [ hiddenMaterialNode, massVolumeVBox ], ( hiddenMaterialProxy, vboxProxy ) => {
      hiddenMaterialProxy.maxWidth = vboxProxy.width;
    } );

    // Show the "hidden" material view if the material is hidden (except for mass-readout mode)
    const toggleNodeValueProperty = new DerivedProperty( [ materialProperty ], material => {
      return !options.showMassAsReadout && material.hidden;
    } );

    this.addChild( new BooleanToggleNode( toggleNodeValueProperty, hiddenMaterialNode, massVolumeVBox ) );

    this.minContentWidth = massVolumeVBox.width;

    this.mutate( options );
  }

  /**
   * Returns the default NumberControl options used by this component.
   */
  public static getNumberControlOptions( showAsReadout = false ): NumberControlOptions {
    const layoutFunction4 = NumberControl.createLayoutFunction4( {
      sliderPadding: 5
    } );

    // Custom layout function to hack out a readout look.
    const layoutFunction: LayoutFunction = showAsReadout ? getMassReadoutLayoutFunction( layoutFunction4 )
                                                         : layoutFunction4;
    const options: NumberControlOptions = {
      delta: DensityBuoyancyCommonConstants.NUMBER_CONTROL_DELTA,
      sliderOptions: {
        trackSize: new Dimension2( 120, TRACK_HEIGHT ),
        thumbYOffset: new PrecisionSliderThumb().height / 2 - TRACK_HEIGHT / 2
      },
      numberDisplayOptions: {
        textOptions: {
          maxWidth: 60
        },
        useFullHeight: true
      },
      layoutFunction: layoutFunction,
      titleNodeOptions: {
        font: DensityBuoyancyCommonConstants.ITEM_FONT,
        maxWidth: 90
      },
      arrowButtonOptions: {
        scale: DensityBuoyancyCommonConstants.ARROW_BUTTON_SCALE,
        enabledEpsilon: DensityBuoyancyCommonConstants.TOLERANCE
      }
    };
    if ( !showAsReadout ) {
      options.numberDisplayOptions!.decimalPlaces = 2;
    }
    return options;
  }
}

// A special layout function that uses a provided layout function for the functional width of the control, but only
// provides the title and numberDisplay (for readout purposes)
const getMassReadoutLayoutFunction = ( normalLayoutFunction: LayoutFunction ) => {
  return ( titleNode: Node, numberDisplay: NumberDisplay, slider: Slider, decrementButton: ArrowButton | null, incrementButton: ArrowButton | null ) => {
    const tempNode = normalLayoutFunction( titleNode, numberDisplay, slider, decrementButton, incrementButton );
    const width = tempNode.width;
    titleNode.detach();
    numberDisplay.detach();
    tempNode.dispose();
    return new Node( {
      children: [ new HBox( {
        children: [ titleNode, numberDisplay ],
        stretch: true,
        preferredWidth: width
      } ) ]
    } );
  };
};

densityBuoyancyCommon.register( 'MaterialMassVolumeControlNode', MaterialMassVolumeControlNode );