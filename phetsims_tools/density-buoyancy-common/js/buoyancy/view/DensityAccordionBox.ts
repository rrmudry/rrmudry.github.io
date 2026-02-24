// Copyright 2019-2025, University of Colorado Boulder

/**
 * An AccordionBox that displays the density of each material.
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 */

import DerivedStringProperty from '../../../../axon/js/DerivedStringProperty.js';
import DynamicProperty from '../../../../axon/js/DynamicProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Utils from '../../../../dot/js/Utils.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import StringUtils from '../../../../phetcommon/js/util/StringUtils.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import Material from '../../common/model/Material.js';
import MaterialProperty from '../../common/model/MaterialProperty.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import ReadoutListAccordionBox, { ReadoutData, ReadoutListAccordionBoxOptions } from './ReadoutListAccordionBox.js';

type ParentOptions = ReadoutListAccordionBoxOptions<MaterialProperty>;
type SelfOptions = EmptySelfOptions;
type DensityAccordionBoxOptions = SelfOptions & ParentOptions;

export default class DensityAccordionBox extends ReadoutListAccordionBox<MaterialProperty> {

  public constructor( titleStringProperty: TReadOnlyProperty<string>, providedOptions?: DensityAccordionBoxOptions ) {

    const options = optionize<DensityAccordionBoxOptions, SelfOptions, ParentOptions>()( {
      expandedDefaultValue: false,
      accessibleName: DensityBuoyancyCommonStrings.objectDensityStringProperty
    }, providedOptions );

    super( titleStringProperty, options );
  }

  protected override generateReadoutData( materialProperty: MaterialProperty ): ReadoutData {

    // Use DynamicProperty so that this name is updated based on the material AND material's name changing.
    const nameProperty = new DynamicProperty<string, string, Material>( materialProperty, {
      derive: material => material.nameProperty
    } );

    // Returns the filled in string for the material readout or '?' if the material is hidden
    const valueProperty = new DerivedStringProperty(
      [
        materialProperty,
        materialProperty.densityProperty,
        DensityBuoyancyCommonConstants.KILOGRAMS_PER_VOLUME_PATTERN_STRING_PROPERTY,
        DensityBuoyancyCommonStrings.questionMarkStringProperty
      ],
      ( material, density, patternStringProperty, questionMarkString ) => {
        return material.hidden ?
               questionMarkString :
               StringUtils.fillIn( patternStringProperty, {

                 // convert from kg/m^3 to kg/L
                 // Can do with a DynamicProperty that takes the value of density of the selected material
                 // Or with DerivedProperty.deriveAny across all the validValues which are Materials and then take their densityProperties
                 value: Utils.toFixed( density / DensityBuoyancyCommonConstants.LITERS_IN_CUBIC_METER, 2 ),
                 decimalPlaces: 2
               } );
      } );

    this.cleanupEmitter.addListener( () => {
      nameProperty.dispose();
      valueProperty.dispose();
    } );

    return {
      nameProperty: nameProperty,
      valueProperty: valueProperty
    };
  }
}

densityBuoyancyCommon.register( 'DensityAccordionBox', DensityAccordionBox );