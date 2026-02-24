// Copyright 2024-2025, University of Colorado Boulder

/**
 * A Property of a Material with build in Property support for accessing the current Material's densityProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import DynamicProperty from '../../../../axon/js/DynamicProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import ThreeUtils from '../../../../mobius/js/ThreeUtils.js';
import optionize from '../../../../phet-core/js/optionize.js';
import PickRequired from '../../../../phet-core/js/types/PickRequired.js';
import Color from '../../../../scenery/js/util/Color.js';
import { PhetioObjectOptions } from '../../../../tandem/js/PhetioObject.js';
import IOType from '../../../../tandem/js/types/IOType.js';
import ReferenceIO from '../../../../tandem/js/types/ReferenceIO.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import MappedWrappedProperty, { MappedWrappedPropertyOptions } from './MappedWrappedProperty.js';
import Material from './Material.js';

type SelfOptions = {
  invisibleMaterials?: Material[];
};

type ParentOptions = MappedWrappedPropertyOptions<Material> & PickRequired<PhetioObjectOptions, 'tandem'>;
export type MaterialPropertyOptions = SelfOptions & ParentOptions;

export default class MaterialProperty extends MappedWrappedProperty<Material> {

  // Takes the density value of the currently selected Material instance
  public readonly densityProperty: TReadOnlyProperty<number>;

  public readonly customMaterial: Material;
  public readonly invisibleMaterials: Material[];

  // Note the material could be the customMaterial. That is not a bug, that is a workaround that means there is no customMaterial.
  public constructor( material: Material, customMaterial: Material, availableMaterials: Material[], providedOptions: MaterialPropertyOptions ) {

    assert && assert( customMaterial.custom, 'customMaterial should be custom' );

    const options = optionize<MaterialPropertyOptions, SelfOptions, ParentOptions>()( {
      invisibleMaterials: [],
      valueType: Material,
      phetioValueType: ReferenceIO( IOType.ObjectIO ),
      phetioFeatured: true
    }, providedOptions );
    super( material, customMaterial, availableMaterials, options );
    this.densityProperty = new DynamicProperty<number, number, Material>( this, {
      bidirectional: false,
      derive: value => value.valueProperty
    } );
    this.customMaterial = this.customValue;
    this.invisibleMaterials = options.invisibleMaterials;
  }

  /**
   * Keep a material's color and opacity to match the liquid color from a given Property<Material>
   *
   * NOTE: Only call this for things that exist for the lifetime of this simulation (otherwise it would leak memory)
   */
  public linkColorProperty( threeMaterial: THREE.MeshPhongMaterial | THREE.MeshLambertMaterial | THREE.MeshBasicMaterial ): void {
    new DynamicProperty<Color, Color, Material>( this, {
      derive: material => {
        assert && assert( material.colorProperty );
        return material.colorProperty!;
      }
    } ).link( ( color: Color ) => {
      threeMaterial.color = ThreeUtils.colorToThree( color );
      threeMaterial.opacity = color.alpha;
    } );
  }
}

densityBuoyancyCommon.register( 'MaterialProperty', MaterialProperty );