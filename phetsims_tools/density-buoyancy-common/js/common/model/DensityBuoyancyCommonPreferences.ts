// Copyright 2023-2024, University of Colorado Boulder

/**
 * Model for Density/Buoyancy preferences, accessed via the Preferences dialog. They are global, and affect all screens.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import BooleanProperty from '../../../../axon/js/BooleanProperty.js';
import StringUnionProperty from '../../../../axon/js/StringUnionProperty.js';
import packageJSON from '../../../../joist/js/packageJSON.js';
import Tandem from '../../../../tandem/js/Tandem.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonQueryParameters, { VolumeUnits, VolumeUnitsValues } from '../DensityBuoyancyCommonQueryParameters.js';

export const supportsPercentageSubmergedVisible = packageJSON.name !== 'density';

const DensityBuoyancyCommonPreferences = {
  volumeUnitsProperty: new StringUnionProperty<VolumeUnits>( DensityBuoyancyCommonQueryParameters.volumeUnits as VolumeUnits, {
    validValues: VolumeUnitsValues,
    tandem: Tandem.PREFERENCES.createTandem( 'volumeUnitsProperty' ),
    phetioFeatured: true
  } ),
  percentSubmergedVisibleProperty: new BooleanProperty( DensityBuoyancyCommonQueryParameters.percentSubmergedVisible, {
    tandem: supportsPercentageSubmergedVisible ? Tandem.PREFERENCES.createTandem( 'percentSubmergedVisibleProperty' ) : Tandem.OPT_OUT,
    phetioFeatured: true
  } )
};

densityBuoyancyCommon.register( 'DensityBuoyancyCommonPreferences', DensityBuoyancyCommonPreferences );
export default DensityBuoyancyCommonPreferences;