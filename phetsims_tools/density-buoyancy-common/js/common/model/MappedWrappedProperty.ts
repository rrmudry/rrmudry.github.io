// Copyright 2024, University of Colorado Boulder

/**
 * Materials and Gravity are classes that have an axon Property that represents their characteristic (density or gravity value).
 * This is a utility class that allows for a custom value to be set, in addition to the named constant instances.
 *
 * Often, but not always, when changing from a named constant to a custom value, the custom value is set to the prior constant.
 * There is an exception when changing to/from mystery values, so the user cannot use the UI to determine the mystery value.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from '../../../../axon/js/Property.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

export type MappedWrappedObject = {
  valueProperty: Property<number>;
  custom: boolean;
  hidden: boolean;
  reset(): void;
};

export type MappedWrappedPropertyOptions<T extends MappedWrappedObject> = PropertyOptions<T>;

export default abstract class MappedWrappedProperty<T extends MappedWrappedObject> extends Property<T> {
  public readonly customValue: T;
  public readonly availableValues: T[];

  // Prevent an infinite loop in the following listeners.
  public lockCount = 0;

  protected constructor( initialValue: T, customValue: T, availableValues: T[], providedOptions: MappedWrappedPropertyOptions<T> ) {

    const options = optionize<MappedWrappedPropertyOptions<T>, EmptySelfOptions, PropertyOptions<T>>()( {
      validValues: availableValues
    }, providedOptions );

    super( initialValue, options );

    this.customValue = customValue;
    this.availableValues = availableValues;

    // When the user changes the density by dragging the slider, automatically switch from the predefined material to
    // the custom material.
    this.customValue.valueProperty.lazyLink( () => {
      if ( this.lockCount === 0 ) {
        this.value = this.customValue;
      }
    } );

    // Normally, when switching from custom to wood, change the custom density also to the wood density
    // However, when switching to a mystery material, do not change the custom value. This prevents clever students from discovering
    // the mystery values by using the UI instead of by computing them, see https://github.com/phetsims/buoyancy/issues/54
    this.lazyLink( mappedWrappedObject => {
      if ( !mappedWrappedObject.custom && !mappedWrappedObject.hidden ) {
        this.lockCount++;
        this.customValue.valueProperty.value = mappedWrappedObject.valueProperty.value;
        this.lockCount--;
      }
    } );

    // When the user changes one of the default values via phet-io (i.e. changing Earth's gravity to 10 m/s^2),
    // if that default is currently selected, update the custom value to match the new value.
    this.availableValues.forEach( mappedWrappedObject => {
      mappedWrappedObject.valueProperty.lazyLink( value => {
        if ( this.value === mappedWrappedObject && !mappedWrappedObject.hidden ) {
          this.lockCount++;
          this.customValue.valueProperty.value = value;
          this.lockCount--;
        }
      } );
    } );
  }

  public override reset(): void {
    this.lockCount++;
    super.reset();
    this.customValue.reset();
    this.lockCount--;
  }
}
densityBuoyancyCommon.register( 'MappedWrappedProperty', MappedWrappedProperty );