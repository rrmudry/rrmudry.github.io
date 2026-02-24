// Copyright 2019-2025, University of Colorado Boulder

/**
 * A scale used for measuring mass/weight (depending on the DisplayType)
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import DerivedProperty from '../../../../axon/js/DerivedProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Bounds3 from '../../../../dot/js/Bounds3.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import Shape from '../../../../kite/js/Shape.js';
import Enumeration from '../../../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../../../phet-core/js/EnumerationValue.js';
import optionize from '../../../../phet-core/js/optionize.js';
import PickOptional from '../../../../phet-core/js/types/PickOptional.js';
import StrictOmit from '../../../../phet-core/js/types/StrictOmit.js';
import PhetioObject from '../../../../tandem/js/PhetioObject.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import NumberIO from '../../../../tandem/js/types/NumberIO.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import GravityProperty from './GravityProperty.js';
import InterpolatedProperty from './InterpolatedProperty.js';
import Mass, { InstrumentedMassOptions } from './Mass.js';
import { MassShape } from './MassShape.js';
import Material from './Material.js';
import PhysicsEngine from './PhysicsEngine.js';

// constants
export const SCALE_WIDTH = 0.15;
export const SCALE_HEIGHT = 0.06;
const SCALE_DEPTH = 0.2;
const SCALE_BASE_HEIGHT = 0.05;
const SCALE_TOP_HEIGHT = SCALE_HEIGHT - SCALE_BASE_HEIGHT;
const SCALE_AREA = SCALE_WIDTH * SCALE_DEPTH;
const SCALE_VOLUME = SCALE_AREA * SCALE_HEIGHT;

const minY = SCALE_HEIGHT / 2;
const minZ = SCALE_WIDTH / 2;
const SCALE_BASE_BOUNDS = new Bounds3(
  -SCALE_WIDTH / 2,
  -minY,
  -minZ,
  SCALE_WIDTH / 2,
  SCALE_BASE_HEIGHT - minY,
  SCALE_DEPTH - minZ
);
const SCALE_FRONT_OFFSET = new Vector3(
  SCALE_BASE_BOUNDS.centerX,
  SCALE_BASE_BOUNDS.centerY,
  SCALE_BASE_BOUNDS.maxZ
);

export class DisplayType extends EnumerationValue {
  public static readonly NEWTONS = new DisplayType();
  public static readonly KILOGRAMS = new DisplayType();

  public static readonly enumeration = new Enumeration( DisplayType, {
    phetioDocumentation: 'Units for the scale readout'
  } );
}

type SelfOptions = {
  displayType?: DisplayType;
};

export type ScaleOptions = SelfOptions & StrictOmit<InstrumentedMassOptions,
  'body' | 'shape' | 'volume' | 'material' | 'massShape' | 'availableMassMaterials'> &
  PickOptional<InstrumentedMassOptions, 'body' | 'shape'>;

export default class Scale extends Mass {

  // In Newtons.
  public readonly measuredWeightInterpolatedProperty: InterpolatedProperty<number>;

  // Just exist for phet-io, see https://github.com/phetsims/density/issues/97
  private readonly measuredMassProperty: TReadOnlyProperty<number>;

  public readonly displayType: DisplayType;

  public constructor( engine: PhysicsEngine, gravityProperty: GravityProperty, providedOptions: ScaleOptions ) {

    const bodyType = providedOptions.canMove === false ? 'STATIC' : 'DYNAMIC';

    const options = optionize<ScaleOptions, SelfOptions, InstrumentedMassOptions>()( {
      body: engine.createBox( SCALE_WIDTH, SCALE_HEIGHT, bodyType ),
      shape: Shape.rect( -SCALE_WIDTH / 2, -SCALE_HEIGHT / 2, SCALE_WIDTH, SCALE_HEIGHT ),
      volume: SCALE_VOLUME,
      massShape: MassShape.BLOCK,

      displayType: DisplayType.NEWTONS,
      material: Material.PLATINUM,
      availableMassMaterials: [ Material.PLATINUM ],

      accessibleName: DensityBuoyancyCommonStrings.a11y.scaleStringProperty,

      inputEnabledPropertyOptions: {
        phetioReadOnly: true
      },
      materialPropertyOptions: {
        tandem: Tandem.OPT_OUT
      },
      massPropertyOptions: {
        phetioDocumentation: PhetioObject.DEFAULT_OPTIONS.phetioDocumentation
      },
      volumePropertyOptions: {
        phetioDocumentation: PhetioObject.DEFAULT_OPTIONS.phetioDocumentation
      },

      phetioDocumentation: 'A scale that can be used to measure the mass/weight of objects stacked on top. Initially on the ground by default.'
    }, providedOptions );

    super( engine, options );

    this.measuredWeightInterpolatedProperty = new InterpolatedProperty( 0, { // eslint-disable-line phet/tandem-name-should-match
      interpolate: InterpolatedProperty.interpolateNumber,
      phetioValueType: NumberIO,
      tandem: options.tandem.createTandem( 'measuredWeightProperty' ),
      phetioDocumentation: 'Weight measured by the scale, in N.',
      phetioFeatured: true,
      units: 'N',
      phetioReadOnly: true,
      phetioHighFrequency: true
    } );

    this.measuredMassProperty = new DerivedProperty( [ this.measuredWeightInterpolatedProperty, gravityProperty.gravityValueProperty ], ( force, gravityValue ) => {
      return gravityValue === 0 ? 0 : force / gravityValue;
    }, {
      phetioValueType: NumberIO,
      tandem: options.tandem.createTandem( 'measuredMassProperty' ),
      phetioDocumentation: 'Mass measured by the scale, in kg.',
      phetioFeatured: true,
      units: 'kg'
    } );

    this.displayType = options.displayType;
  }

  protected override getLocalBounds(): Bounds3 {
    const bounds2 = this.shapeProperty.value.bounds;
    return new Bounds3( bounds2.minX, bounds2.minY, -SCALE_DEPTH / 2, bounds2.maxX, bounds2.maxY, SCALE_DEPTH / 2 );
  }

  /**
   * Called after an engine-physics-model step once before doing other operations (like computing buoyant forces,
   * displacement, etc.) so that it can set high-performance flags used for this purpose.
   *
   * Type-specific values are likely to be set, but this should set at least stepX/stepBottom/stepTop
   */
  public override updateStepInformation(): void {
    super.updateStepInformation();

    const xOffset = this.stepMatrix.m02();
    const yOffset = this.stepMatrix.m12();

    this.stepX = xOffset;
    this.stepBottom = yOffset - SCALE_HEIGHT / 2;
    this.stepTop = yOffset + SCALE_HEIGHT / 2;
  }

  /**
   * Returns the cumulative displaced volume of this object up to a given y level.
   *
   * Assumes step information was updated.
   */
  public getDisplacedArea( fluidLevel: number ): number {
    if ( fluidLevel < this.stepBottom || fluidLevel > this.stepTop ) {
      return 0;
    }
    else {
      return SCALE_AREA;
    }
  }

  /**
   * Returns the displaced volume of this object up to a given y level, assuming a y value for the given fluid level.
   *
   * Assumes step information was updated.
   */
  public getDisplacedVolume( fluidLevel: number ): number {
    const bottom = this.stepBottom;
    const top = this.stepTop;

    if ( fluidLevel <= bottom ) {
      return 0;
    }
    else if ( fluidLevel >= top ) {
      return SCALE_VOLUME;
    }
    else {
      return SCALE_VOLUME * ( fluidLevel - bottom ) / ( top - bottom );
    }
  }

  public setRatios( widthRatio: number, heightRatio: number ): void {
    assert && assert( false, 'Scale does not support ratios' );
  }

  /**
   * Steps forward in time.
   */
  public override step( dt: number, interpolationRatio: number ): void {
    super.step( dt, interpolationRatio );

    this.measuredWeightInterpolatedProperty.setRatio( interpolationRatio );
  }

  public static readonly SCALE_WIDTH = SCALE_WIDTH;
  public static readonly SCALE_HEIGHT = SCALE_HEIGHT;

  public static readonly SCALE_TOP_HEIGHT = SCALE_TOP_HEIGHT;
  public static readonly SCALE_BASE_BOUNDS = SCALE_BASE_BOUNDS;
  public static readonly SCALE_FRONT_OFFSET = SCALE_FRONT_OFFSET;
}

densityBuoyancyCommon.register( 'Scale', Scale );