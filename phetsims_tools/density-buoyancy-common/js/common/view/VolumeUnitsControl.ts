// Copyright 2023-2025, University of Colorado Boulder

/**
 * For the Preferences dialog, controls the volume units
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Disposable from '../../../../axon/js/Disposable.js';
import Property from '../../../../axon/js/Property.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import PreferencesDialogConstants from '../../../../joist/js/preferences/PreferencesDialogConstants.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import PickRequired from '../../../../phet-core/js/types/PickRequired.js';
import WithRequired from '../../../../phet-core/js/types/WithRequired.js';
import HBox, { HBoxOptions } from '../../../../scenery/js/layout/nodes/HBox.js';
import RichText from '../../../../scenery/js/nodes/RichText.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import AquaRadioButtonGroup, { AquaRadioButtonGroupItem, AquaRadioButtonGroupOptions } from '../../../../sun/js/AquaRadioButtonGroup.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';
import DensityBuoyancyCommonConstants from '../DensityBuoyancyCommonConstants.js';
import { VolumeUnits } from '../DensityBuoyancyCommonQueryParameters.js';

type SelfOptions = EmptySelfOptions;

type VolumeUnitsControlOptions = SelfOptions & WithRequired<HBoxOptions, 'tandem'>;

export default class VolumeUnitsControl extends HBox {

  public constructor( beakerUnitsProperty: Property<VolumeUnits>, providedOptions: VolumeUnitsControlOptions ) {

    const options = optionize<VolumeUnitsControlOptions, SelfOptions, HBoxOptions>()( {
      spacing: DensityBuoyancyCommonConstants.SPACING
    }, providedOptions );

    const labelText = new Text( DensityBuoyancyCommonStrings.volumeUnitsStringProperty, {
      font: PreferencesDialogConstants.CONTENT_FONT
    } );

    const radioButtonGroup = new VolumeUnitsRadioButtonGroup( beakerUnitsProperty, {
      tandem: options.tandem.createTandem( 'radioButtonGroup' )
    } );

    options.children = [ labelText, radioButtonGroup ];

    super( options );

    this.addLinkedElement( beakerUnitsProperty );
  }

  public override dispose(): void {
    Disposable.assertNotDisposable();
  }
}

type VolumeUnitsRadioButtonGroupSelfOptions = EmptySelfOptions;

type VolumeUnitsRadioButtonGroupOptions = SelfOptions & PickRequired<AquaRadioButtonGroupOptions, 'tandem'>;

class VolumeUnitsRadioButtonGroup extends AquaRadioButtonGroup<VolumeUnits> {

  public constructor( beakerUnitsProperty: Property<VolumeUnits>, providedOptions: VolumeUnitsRadioButtonGroupOptions ) {

    const options = optionize<VolumeUnitsRadioButtonGroupOptions, VolumeUnitsRadioButtonGroupSelfOptions, AquaRadioButtonGroupOptions>()( {

      // AquaRadioButtonGroupOptions
      orientation: 'horizontal',
      spacing: DensityBuoyancyCommonConstants.SPACING
    }, providedOptions );

    const items: AquaRadioButtonGroupItem<VolumeUnits>[] = [
      createItem( 'liters', DensityBuoyancyCommonStrings.litersStringProperty ),
      createItem( 'decimetersCubed', DensityBuoyancyCommonStrings.decimetersCubedStringProperty )
    ];

    super( beakerUnitsProperty, items, options );
  }
}

function createItem( value: VolumeUnits, stringProperty: TReadOnlyProperty<string> ): AquaRadioButtonGroupItem<VolumeUnits> {
  return {
    value: value,
    createNode: tandem => new RichText( stringProperty, {
      font: PreferencesDialogConstants.CONTENT_FONT,
      maxWidth: 200
    } ),
    tandemName: `${value}RadioButton`
  };
}

densityBuoyancyCommon.register( 'VolumeUnitsControl', VolumeUnitsControl );