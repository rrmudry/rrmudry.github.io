// Copyright 2019-2025, University of Colorado Boulder

/**
 * A Property that is based on the step-based interpolation between a current (most recent value) and previous value
 * (two values ago). In addition, this Property wants to notify changes less often than it may update. This is why
 * its value is set much less often than currentValue.
 *
 * This interpolation is an established algorithm for handling excess DT when stepping based on fixed model steps
 * (which Density and Buoyancy do).
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Property, { PropertyOptions } from '../../../../axon/js/Property.js';
import { ReadOnlyPropertyState } from '../../../../axon/js/ReadOnlyProperty.js';
import Vector2 from '../../../../dot/js/Vector2.js';
import optionize from '../../../../phet-core/js/optionize.js';
import IntentionalAny from '../../../../phet-core/js/types/IntentionalAny.js';
import IOTypeCache from '../../../../tandem/js/IOTypeCache.js';
import IOType, { AnyIOType } from '../../../../tandem/js/types/IOType.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

type Interpolate<T extends Vector2 | number> = ( a: T, b: T, ratio: number ) => T;
type SelfOptions<T extends Vector2 | number> = {
  interpolate: Interpolate<T>;
};
export type InterpolatedPropertyOptions<T extends Vector2 | number> = SelfOptions<T> & PropertyOptions<T>;

// Lock the ability to read the value of InterpolatedProperties. This is because the interpolated value can be buggy
// if read by certain functionality. For example, the interpolated value is just for the rendering portion of the sim,
// never the model.
let readLockCount = 0;

export default class InterpolatedProperty<T extends Vector2 | number> extends Property<T> {

  // The most recently set value, but changing this will not fire listeners.
  public currentValue: T;

  // Capture the previous value upon currentValue change.
  private previousValue: T;
  private ratio: number;

  private readonly interpolate: Interpolate<T>;

  // When true, getting the value of this InterpolatedProperty will not trigger an assertion, even when the Property
  // is locked.
  private nextReadIsSafe = false;

  public constructor( initialValue: T, providedOptions: InterpolatedPropertyOptions<T> ) {

    const options = optionize<InterpolatedPropertyOptions<T>, SelfOptions<T>, PropertyOptions<T>>()( {
      phetioOuterType: InterpolatedProperty.InterpolatedPropertyIO
    }, providedOptions );

    super( initialValue, options );

    this.interpolate = options.interpolate;

    this.currentValue = initialValue;
    this.previousValue = initialValue;

    this.ratio = 0;
  }

  /**
   * Sets the next value to be used (will NOT change the value of this Property).
   */
  public setNextValue( value: T ): void {
    this.previousValue = this.currentValue;
    this.currentValue = value;
  }

  /**
   * Sets the ratio to use for interpolated values (WILL change the value of this Property generally).
   */
  public setRatio( ratio: number ): void {
    this.ratio = ratio;

    const lockCount = readLockCount;
    InterpolatedProperty.unlock();

    // Interpolating between two values ago and the most recent value is a common heuristic to do, but it is important
    // that no model code relies on this, and instead would just use currentValue directly. This is also duplicated from
    // what p2 World does after step.
    this.value = this.interpolate( this.previousValue, this.currentValue, this.ratio );

    InterpolatedProperty.lock();
    assert && assert( lockCount === readLockCount, 'InterpolatedProperty does not support reading other InterpolatedProperties from value set' );
  }

  // Call right before getting the value when you know it is safe to do so in a model context
  public markNextLockedReadSafe(): void {
    this.nextReadIsSafe = true;
  }

  public override get(): T {

    // Cannot read from an InterpolatedProperty during model step unless you mark the read as safe first.
    assert && readLockCount !== 0 && assert( this.nextReadIsSafe, 'cannot read InterpolatedProperty from the model' );
    this.nextReadIsSafe = false; // This value is only for a single read, so always set back to unsafe.

    return super.get();
  }

  /**
   * Resets the Property to its initial state.
   */
  public override reset(): void {
    super.reset();

    this.currentValue = this.value;
    this.previousValue = this.value;
    this.ratio = 0;
  }

  /**
   * Interpolation for numbers.
   */
  public static interpolateNumber( a: number, b: number, ratio: number ): number {
    return a + ( b - a ) * ratio;
  }

  /**
   * Interpolation for Vector2.
   */
  public static interpolateVector2( a: Vector2, b: Vector2, ratio: number ): Vector2 {
    return a.blend( b, ratio );
  }

  public static lock(): void {
    readLockCount++;
  }

  public static unlock(): void {
    readLockCount--;
  }

  public static readonly InterpolatedPropertyIO = ( parameterType: AnyIOType ): AnyIOType => {
    assert && assert( parameterType, 'InterpolatedPropertyIO needs parameterType' );

    if ( !cache.has( parameterType ) ) {
      const PropertyIOImpl = Property.PropertyIO( parameterType );

      const ioType = new IOType<IntentionalAny, IntentionalAny>( `InterpolatedPropertyIO<${parameterType.typeName}>`, {
        valueType: InterpolatedProperty,
        supertype: PropertyIOImpl,
        parameterTypes: [ parameterType ],
        documentation: 'Extends PropertyIO to interpolation (with a current/previous value, and a ratio between the two)',
        toStateObject: ( interpolatedProperty: InterpolatedProperty<IntentionalAny> ): InterpolatedPropertyIOState => {

          return {
            ...PropertyIOImpl.toStateObject( interpolatedProperty ), // eslint-disable-line phet/no-object-spread-on-non-literals

            currentValue: parameterType.toStateObject( interpolatedProperty.currentValue ),
            previousValue: parameterType.toStateObject( interpolatedProperty.previousValue ),
            ratio: interpolatedProperty.ratio
          };
        },
        applyState: ( interpolatedProperty: InterpolatedProperty<Vector2 | number>, stateObject: InterpolatedPropertyIOState ) => {
          PropertyIOImpl.applyState( interpolatedProperty, stateObject );

          // Writes to the private members, but it doesn't fail type checking because InterpolatedPropertyIO is declared
          // as a static member. This is preferable to making them public.
          interpolatedProperty.currentValue = parameterType.fromStateObject( stateObject.currentValue );
          interpolatedProperty.previousValue = parameterType.fromStateObject( stateObject.previousValue );
          interpolatedProperty.ratio = stateObject.ratio;
        },
        stateSchema: {
          currentValue: parameterType,
          previousValue: parameterType,
          ratio: NumberIO
        }
      } );

      cache.set( parameterType, ioType );
    }

    return cache.get( parameterType )!;
  };
}

// {Map.<IOType, IOType>} - Cache each parameterized PropertyIO based on
// the parameter type, so that it is only created once
const cache = new IOTypeCache();

// TODO: This should be parametric, https://github.com/phetsims/tandem/issues/261
export type InterpolatedPropertyIOState = ReadOnlyPropertyState<IntentionalAny> & {
  currentValue: IntentionalAny;
  previousValue: IntentionalAny;
  ratio: number;
};

densityBuoyancyCommon.register( 'InterpolatedProperty', InterpolatedProperty );