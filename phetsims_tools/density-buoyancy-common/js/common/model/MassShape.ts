// Copyright 2022-2025, University of Colorado Boulder

/**
 * Mass shape for the Buoyancy Shapes screen. In the common model because some phet-io hackery is needed.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import Enumeration from '../../../../phet-core/js/Enumeration.js';
import EnumerationValue from '../../../../phet-core/js/EnumerationValue.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';

export class MassShape extends EnumerationValue {
  public static readonly BLOCK = new MassShape(
    DensityBuoyancyCommonStrings.shape.blockStringProperty,
    'block'
  );
  public static readonly ELLIPSOID = new MassShape(
    DensityBuoyancyCommonStrings.shape.ellipsoidStringProperty,
    'ellipsoid'
  );
  public static readonly VERTICAL_CYLINDER = new MassShape(
    DensityBuoyancyCommonStrings.shape.verticalCylinderStringProperty,
    'verticalCylinder'
  );
  public static readonly HORIZONTAL_CYLINDER = new MassShape(
    DensityBuoyancyCommonStrings.shape.horizontalCylinderStringProperty,
    'horizontalCylinder'
  );
  public static readonly CONE = new MassShape(
    DensityBuoyancyCommonStrings.shape.coneStringProperty,
    'cone'
  );
  public static readonly INVERTED_CONE = new MassShape(
    DensityBuoyancyCommonStrings.shape.invertedConeStringProperty,
    'invertedCone'
  );
  public static readonly DUCK = new MassShape(
    DensityBuoyancyCommonStrings.shape.duckStringProperty,
    'duck'
  );

  public constructor( public readonly shapeString: TReadOnlyProperty<string>, public readonly tandemName: string ) {super();}

  public static readonly enumeration = new Enumeration( MassShape, {
    phetioDocumentation: 'Shape of the mass'
  } );
}

densityBuoyancyCommon.register( 'MassShape', MassShape );