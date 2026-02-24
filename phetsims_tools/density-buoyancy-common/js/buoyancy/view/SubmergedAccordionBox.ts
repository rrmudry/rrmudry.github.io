// Copyright 2019-2024, University of Colorado Boulder

/**
 * An AccordionBox that displays the percentage of a material that is submerged in a fluid.
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 */

import PatternStringProperty from '../../../../axon/js/PatternStringProperty.js';
import Utils from '../../../../dot/js/Utils.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import DensityBuoyancyCommonPreferences from '../../common/model/DensityBuoyancyCommonPreferences.js';
import Mass from '../../common/model/Mass.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import ReadoutListAccordionBox, { ReadoutData, ReadoutListAccordionBoxOptions } from './ReadoutListAccordionBox.js';

type SubmergedAccordionBoxOptions = ReadoutListAccordionBoxOptions<Mass>;

export default class SubmergedAccordionBox extends ReadoutListAccordionBox<Mass> {

  public constructor( providedOptions?: ReadoutListAccordionBoxOptions<Mass> ) {

    const options = optionize<SubmergedAccordionBoxOptions, EmptySelfOptions, ReadoutListAccordionBoxOptions<Mass>>()( {
      visibleProperty: DensityBuoyancyCommonPreferences.percentSubmergedVisibleProperty,
      readoutItems: [],
      expandedDefaultValue: false,

      accessibleName: DensityBuoyancyCommonStrings.percentSubmergedStringProperty,
      phetioFeatured: true
    }, providedOptions );

    super( DensityBuoyancyCommonStrings.percentSubmergedStringProperty, options );
  }

  protected override generateReadoutData( mass: Mass ): ReadoutData {

    const patternStringProperty = new PatternStringProperty( DensityBuoyancyCommonStrings.valuePercentStringProperty, {
      value: mass.percentSubmergedProperty
    }, {
      maps: {
        value: percentSubmerged => Utils.toFixed( percentSubmerged, 1 )
      }
    } );
    this.cleanupEmitter.addListener( () => {
      patternStringProperty.dispose();
    } );

    return {
      nameProperty: mass.nameProperty,
      valueProperty: patternStringProperty
    };
  }
}

densityBuoyancyCommon.register( 'SubmergedAccordionBox', SubmergedAccordionBox );