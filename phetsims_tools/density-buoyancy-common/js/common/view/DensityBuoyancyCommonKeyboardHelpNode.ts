// Copyright 2024, University of Colorado Boulder

/**
 * DensityBuoyancyCommonKeyboardHelpNode is the keyboard help for all screens, with parameters that determine whether
 * slider or "change choice" (combo box) help should be shown.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import BasicActionsKeyboardHelpSection from '../../../../scenery-phet/js/keyboard/help/BasicActionsKeyboardHelpSection.js';
import ComboBoxKeyboardHelpSection from '../../../../scenery-phet/js/keyboard/help/ComboBoxKeyboardHelpSection.js';
import GrabReleaseKeyboardHelpSection from '../../../../scenery-phet/js/keyboard/help/GrabReleaseKeyboardHelpSection.js';
import KeyboardHelpSection from '../../../../scenery-phet/js/keyboard/help/KeyboardHelpSection.js';
import MoveDraggableItemsKeyboardHelpSection from '../../../../scenery-phet/js/keyboard/help/MoveDraggableItemsKeyboardHelpSection.js';
import SliderControlsKeyboardHelpSection from '../../../../scenery-phet/js/keyboard/help/SliderControlsKeyboardHelpSection.js';
import TwoColumnKeyboardHelpContent from '../../../../scenery-phet/js/keyboard/help/TwoColumnKeyboardHelpContent.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';

export default class DensityBuoyancyCommonKeyboardHelpNode extends TwoColumnKeyboardHelpContent {

  public constructor( showSliderHelp: boolean, showChangeChoiceHelp: boolean ) {

    const leftColumn: KeyboardHelpSection[] = [
      new GrabReleaseKeyboardHelpSection(
        DensityBuoyancyCommonStrings.itemTitlecaseStringProperty,
        DensityBuoyancyCommonStrings.itemLowercaseStringProperty
      ),
      new MoveDraggableItemsKeyboardHelpSection()
    ];

    const rightColumn: KeyboardHelpSection[] = [];

    if ( showSliderHelp ) {
      leftColumn.push( new SliderControlsKeyboardHelpSection() );
      if ( showChangeChoiceHelp ) {
        rightColumn.push( new ComboBoxKeyboardHelpSection() );
      }
    }
    else if ( showChangeChoiceHelp ) {
      leftColumn.push( new ComboBoxKeyboardHelpSection() );
    }

    rightColumn.push( new BasicActionsKeyboardHelpSection( { withCheckboxContent: true } ) );

    super( leftColumn, rightColumn );
  }
}

densityBuoyancyCommon.register( 'DensityBuoyancyCommonKeyboardHelpNode', DensityBuoyancyCommonKeyboardHelpNode );