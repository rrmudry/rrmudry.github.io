// Copyright 2023-2025, University of Colorado Boulder

/**
 * DensityBuoyancyCommonPreferencesNode is the user interface for sim-specific preferences, accessed via the Preferences dialog.
 * These preferences are global, and affect all screens.
 *
 * The Preferences dialog is created on demand by joist, using a PhetioCapsule. So DensityBuoyancyCommonPreferencesNode and its
 * subcomponents must implement dispose.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import PreferencesControl from '../../../../joist/js/preferences/PreferencesControl.js';
import PreferencesDialogConstants from '../../../../joist/js/preferences/PreferencesDialogConstants.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import PickRequired from '../../../../phet-core/js/types/PickRequired.js';
import VBox, { VBoxOptions } from '../../../../scenery/js/layout/nodes/VBox.js';
import RichText from '../../../../scenery/js/nodes/RichText.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import ToggleSwitch from '../../../../sun/js/ToggleSwitch.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import DensityBuoyancyCommonPreferences, { supportsPercentageSubmergedVisible } from '../model/DensityBuoyancyCommonPreferences.js';
import VolumeUnitsControl from './VolumeUnitsControl.js';

type SelfOptions = EmptySelfOptions;

export type DensityBuoyancyCommonPreferencesNodeOptions = SelfOptions & PickRequired<VBoxOptions, 'tandem'>;

export default class DensityBuoyancyCommonPreferencesNode extends VBox {

  public constructor( providedOptions: DensityBuoyancyCommonPreferencesNodeOptions ) {

    const options = optionize<DensityBuoyancyCommonPreferencesNodeOptions, SelfOptions, VBoxOptions>()( {
      align: 'left',
      spacing: 2 * DensityBuoyancyCommonConstants.SPACING,
      phetioVisiblePropertyInstrumented: false
    }, providedOptions );

    options.children = [ new VolumeUnitsControl( DensityBuoyancyCommonPreferences.volumeUnitsProperty, {
      tandem: options.tandem.createTandem( 'volumeUnitsControl' ),
      phetioFeatured: true,
      visiblePropertyOptions: {
        phetioFeatured: true
      }
    } ) ];

    if ( supportsPercentageSubmergedVisible ) {
      const percentSubmergedVisibleControl = new PreferencesControl( {
        isDisposable: false,
        labelNode: new Text( DensityBuoyancyCommonStrings.preferences.percentSubmerged.titleStringProperty, PreferencesDialogConstants.CONTROL_LABEL_OPTIONS ),
        descriptionNode: new RichText( DensityBuoyancyCommonStrings.preferences.percentSubmerged.descriptionStringProperty,
          PreferencesDialogConstants.CONTROL_DESCRIPTION_OPTIONS ),
        controlNode: new ToggleSwitch( DensityBuoyancyCommonPreferences.percentSubmergedVisibleProperty, false, true, PreferencesDialogConstants.TOGGLE_SWITCH_OPTIONS ),
        tandem: options.tandem.createTandem( 'percentSubmergedVisibleControl' ),
        phetioFeatured: true,
        visiblePropertyOptions: {
          phetioFeatured: true
        }
      } );
      percentSubmergedVisibleControl.addLinkedElement( DensityBuoyancyCommonPreferences.percentSubmergedVisibleProperty );

      options.children.push( percentSubmergedVisibleControl );
    }

    super( options );
  }
}

densityBuoyancyCommon.register( 'DensityBuoyancyCommonPreferencesNode', DensityBuoyancyCommonPreferencesNode );