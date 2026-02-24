// Copyright 2024-2025, University of Colorado Boulder

/**
 * Common class for DensityAccordionBox and SubmergedAccordionBox. This class is used to create an AccordionBox that
 * displays a list of readouts. The readouts are created by passing an array of CustomReadoutObjects to the setReadoutItems
 * method.
 *
 * @author Agustín Vallejo (PhET Interactive Simulations)
 */

import DerivedStringProperty from '../../../../axon/js/DerivedStringProperty.js';
import Disposable from '../../../../axon/js/Disposable.js';
import PatternStringProperty from '../../../../axon/js/PatternStringProperty.js';
import TinyEmitter from '../../../../axon/js/TinyEmitter.js';
import TinyProperty from '../../../../axon/js/TinyProperty.js';
import { TReadOnlyProperty } from '../../../../axon/js/TReadOnlyProperty.js';
import { combineOptions, optionize4 } from '../../../../phet-core/js/optionize.js';
import WithRequired from '../../../../phet-core/js/types/WithRequired.js';
import PhetFont from '../../../../scenery-phet/js/PhetFont.js';
import AlignGroup from '../../../../scenery/js/layout/constraints/AlignGroup.js';
import HBox from '../../../../scenery/js/layout/nodes/HBox.js';
import VBox from '../../../../scenery/js/layout/nodes/VBox.js';
import RichText, { RichTextOptions } from '../../../../scenery/js/nodes/RichText.js';
import Text from '../../../../scenery/js/nodes/Text.js';
import AccordionBox, { AccordionBoxOptions } from '../../../../sun/js/AccordionBox.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import DensityBuoyancyCommonStrings from '../../DensityBuoyancyCommonStrings.js';

const DEFAULT_FONT = new PhetFont( 14 );
const HBOX_SPACING = 5;
const DEFAULT_CONTENT_WIDTH = ( 200 + HBOX_SPACING ) / 2;

const TEXT_OPTIONS = {
  font: DEFAULT_FONT
};

type SelfOptions<ReadoutType> = {

  // Provide the ideal max content width for the accordion box content. This is used to apply maxWidths to the Texts of the readout.
  contentWidthMax?: number | TReadOnlyProperty<number>;

  readoutItems?: ReadoutItemOptions<ReadoutType>[];
};

export type ReadoutItemOptions<ReadoutType> = {
  readoutItem: ReadoutType; // Provided for use by generateReadoutData() to create the name/value Properties

  // By default, the implementation of generateReadoutData() will create a default nameProperty, but you can supply your
  // own to be used instead.
  readoutNameProperty?: TReadOnlyProperty<string>;
  onCleanup?: () => void;

  readoutFormat?: RichTextOptions; // Any extra formatting options to be passed ONLY to the value text.
};

export type ReadoutData = {
  nameProperty: TReadOnlyProperty<string>;
  valueProperty: TReadOnlyProperty<string>;
};

export type ReadoutListAccordionBoxOptions<ReadoutType> = SelfOptions<ReadoutType> & WithRequired<AccordionBoxOptions, 'tandem'>;

export default abstract class ReadoutListAccordionBox<ReadoutType> extends AccordionBox {

  protected readonly cleanupEmitter = new TinyEmitter();

  private readonly readoutBox: VBox;
  private readonly contentWidthMaxProperty: TReadOnlyProperty<number>;

  protected constructor(
    titleStringProperty: TReadOnlyProperty<string>,
    providedOptions?: ReadoutListAccordionBoxOptions<ReadoutType>
  ) {

    const titleNode = new Text( titleStringProperty, {
      font: DensityBuoyancyCommonConstants.TITLE_FONT
    } );

    const options = optionize4<ReadoutListAccordionBoxOptions<ReadoutType>, SelfOptions<ReadoutType>, AccordionBoxOptions>()( {},
      DensityBuoyancyCommonConstants.ACCORDION_BOX_OPTIONS, {
        titleNode: titleNode,
        layoutOptions: { stretch: true },
        contentWidthMax: DEFAULT_CONTENT_WIDTH,
        readoutItems: [],
        useExpandedBoundsWhenCollapsed: false
      }, providedOptions );

    const readoutBox = new VBox( {
      spacing: DensityBuoyancyCommonConstants.SPACING_SMALL,
      align: 'center'
    } );

    super( readoutBox, options );

    this.readoutBox = readoutBox;
    this.contentWidthMaxProperty = typeof options.contentWidthMax === 'number' ?
                                   new TinyProperty( options.contentWidthMax ) :
                                   options.contentWidthMax;

    // 90% accounts for the expand/collapse button pretty well
    const maxWidthListener = ( maxWidth: number ) => { titleNode.maxWidth = maxWidth * 0.9; };
    this.contentWidthMaxProperty.link( maxWidthListener );
    this.disposeEmitter.addListener( () => this.contentWidthMaxProperty.unlink( maxWidthListener ) );

    options.readoutItems && this.setReadoutItems( options.readoutItems );
  }

  public setReadoutItems( readoutItems: ReadoutItemOptions<ReadoutType>[] ): void {

    // Clear the previous materials that may have been created.
    this.cleanupEmitter.emit();
    this.cleanupEmitter.removeAllListeners();

    this.readoutBox.children = readoutItems.map( readoutItem => {

      const readoutData = this.generateReadoutData( readoutItem.readoutItem );
      const nameProperty = readoutItem.readoutNameProperty || readoutData.nameProperty;
      const nameColonProperty = new PatternStringProperty(
        DensityBuoyancyCommonStrings.nameColonPatternStringProperty, {
          name: nameProperty
        } );

      const labelText = new RichText( nameColonProperty, TEXT_OPTIONS );
      const readoutFormat = readoutItem.readoutFormat ? readoutItem.readoutFormat : {};
      const derivedStringProperty = new DerivedStringProperty( [ nameColonProperty, readoutData.valueProperty ], ( name, value ) => {
        return `${name} ${value}`;
      } );
      const valueText = new RichText( readoutData.valueProperty,
        combineOptions<RichTextOptions>( {

          // A11y content for the PDOM
          tagName: 'p',
          innerContent: derivedStringProperty
        }, TEXT_OPTIONS, readoutFormat ) );

      const maxWidthListener = ( contentWidthMax: number ) => {
        const maxWidth = ( contentWidthMax - HBOX_SPACING ) / 2;
        labelText.maxWidth = maxWidth;
        valueText.maxWidth = maxWidth;
      };
      this.contentWidthMaxProperty.link( maxWidthListener );

      this.cleanupEmitter.addListener( () => {
        this.contentWidthMaxProperty.unlink( maxWidthListener );
        valueText.dispose();
        derivedStringProperty.dispose();
        labelText.dispose();
        nameColonProperty.dispose();
        readoutItem.onCleanup && readoutItem.onCleanup();
      } );

      const alignGroup = new AlignGroup();
      return new HBox( {
        children: [
          alignGroup.createBox( labelText, { xAlign: 'right' } ),
          alignGroup.createBox( valueText, { xAlign: 'left' } )
        ],
        align: 'origin',
        justify: 'center',
        spacing: DensityBuoyancyCommonConstants.SPACING_SMALL
      } );
    } );
  }

  protected abstract generateReadoutData( readoutType: ReadoutType ): ReadoutData;

  public override dispose(): void {
    Disposable.assertNotDisposable();
  }
}

densityBuoyancyCommon.register( 'ReadoutListAccordionBox', ReadoutListAccordionBox );