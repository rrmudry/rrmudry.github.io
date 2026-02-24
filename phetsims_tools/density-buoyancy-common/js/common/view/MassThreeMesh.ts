// Copyright 2024, University of Colorado Boulder

/**
 * Handles the THREE rendering for any of the 3D views of any type of mass.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import Mass from '../model/Mass.js';
import Material from '../model/Material.js';
import MaterialView, { DensityMaterials } from './MaterialView.js';

export default class MassThreeMesh extends THREE.Mesh {

  private readonly mass: Mass;
  private materialView: MaterialView;
  private readonly materialListener: ( material: Material ) => void;

  public constructor( mass: Mass, initialGeometry: THREE.BufferGeometry ) {

    const materialView = DensityMaterials.getMaterialView( mass.materialProperty.value );

    super( initialGeometry, materialView.material );

    this.mass = mass;
    this.materialView = materialView;

    this.material = materialView.material;

    this.materialListener = material => {
      this.materialView.dispose();
      this.materialView = DensityMaterials.getMaterialView( material );
      this.material = this.materialView.material;
    };
    this.mass.materialProperty.lazyLink( this.materialListener );

  }

  public dispose(): void {
    this.mass.materialProperty.unlink( this.materialListener );

    this.materialView.dispose();

    // @ts-expect-error
    super.dispose && super.dispose();
  }
}

densityBuoyancyCommon.register( 'MassThreeMesh', MassThreeMesh );