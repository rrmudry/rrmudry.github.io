// Copyright 2019-2024, University of Colorado Boulder

/**
 * The main model for the Compare screen of the Density simulation.
 *
 * @author Jonathan Olson (PhET Interactive Simulations)
 */

import Range from '../../../../dot/js/Range.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import StrictOmit from '../../../../phet-core/js/types/StrictOmit.js';
import BlockSet from '../../common/model/BlockSet.js';
import CompareBlockSetModel, { CompareBlockSetModelOptions } from '../../common/model/CompareBlockSetModel.js';
import Cuboid from '../../common/model/Cuboid.js';
import DensityBuoyancyModel from '../../common/model/DensityBuoyancyModel.js';
import MassTag from '../../common/model/MassTag.js';
import DensityBuoyancyCommonColors from '../../common/view/DensityBuoyancyCommonColors.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';

export type DensityCompareModelOptions = StrictOmit<CompareBlockSetModelOptions, 'positionMassesCallback' | 'cubesData'>;

export default class DensityCompareModel extends CompareBlockSetModel {

  public constructor( providedOptions: DensityCompareModelOptions ) {
    const tandem = providedOptions.tandem;

    const blockSetsTandem = tandem.createTandem( 'blockSets' );

    const options = optionize<DensityCompareModelOptions, EmptySelfOptions, CompareBlockSetModelOptions>()( {
      fluidSelectionType: 'justWater',
      usePoolScale: false,
      sameDensityValue: 500,
      sameDensityRange: new Range( 100, 2000 ),

      positionMassesCallback: ( model: DensityBuoyancyModel, blockSet: BlockSet, masses: Cuboid[] ) => {
        assert && assert( masses.length === 4, 'four masses please' );
        switch( blockSet ) {
          case BlockSet.SAME_MASS:
            model.positionMassesLeft( [ masses[ 0 ], masses[ 1 ] ] );
            model.positionMassesRight( [ masses[ 2 ], masses[ 3 ] ] );
            break;
          case BlockSet.SAME_VOLUME:
            model.positionMassesLeft( [ masses[ 3 ], masses[ 0 ] ] );
            model.positionMassesRight( [ masses[ 1 ], masses[ 2 ] ] );
            break;
          case BlockSet.SAME_DENSITY:
            model.positionMassesLeft( [ masses[ 0 ], masses[ 1 ] ] );
            model.positionMassesRight( [ masses[ 2 ], masses[ 3 ] ] );
            break;
          default:
            throw new Error( `unknown blockSet: ${blockSet}` );
        }
      },
      cubesData: [
        {
          sameMassVolume: 0.01,
          sameVolumeMass: 8,
          sameDensityVolume: 0.006,
          colorProperty: DensityBuoyancyCommonColors.compareYellowColorProperty,
          sameMassCubeOptions: {
            tag: MassTag.B,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_MASS.tandemName ).createTandem( 'blockB' )
          },
          sameVolumeCubeOptions: {
            tag: MassTag.A,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_VOLUME.tandemName ).createTandem( 'blockA' )
          },
          sameDensityCubeOptions: {
            tag: MassTag.B,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_DENSITY.tandemName ).createTandem( 'blockB' )
          }
        }, {
          sameMassVolume: 0.005,
          sameVolumeMass: 6,
          sameDensityVolume: 0.004,
          colorProperty: DensityBuoyancyCommonColors.compareBlueColorProperty,
          sameMassCubeOptions: {
            tag: MassTag.A,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_MASS.tandemName ).createTandem( 'blockA' )
          },
          sameVolumeCubeOptions: {
            tag: MassTag.C,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_VOLUME.tandemName ).createTandem( 'blockC' )
          },
          sameDensityCubeOptions: {
            tag: MassTag.A,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_DENSITY.tandemName ).createTandem( 'blockA' )
          }
        }, {
          sameMassVolume: 0.0025,
          sameVolumeMass: 4,
          sameDensityVolume: 0.002,
          colorProperty: DensityBuoyancyCommonColors.compareGreenColorProperty,
          sameMassCubeOptions: {
            tag: MassTag.C,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_MASS.tandemName ).createTandem( 'blockC' )
          },
          sameVolumeCubeOptions: {
            tag: MassTag.D,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_VOLUME.tandemName ).createTandem( 'blockD' )
          },
          sameDensityCubeOptions: {
            tag: MassTag.C,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_DENSITY.tandemName ).createTandem( 'blockC' )
          }
        }, {
          sameMassVolume: 0.00125,
          sameVolumeMass: 2,
          sameDensityVolume: 0.001,
          colorProperty: DensityBuoyancyCommonColors.compareRedColorProperty,
          sameMassCubeOptions: {
            tag: MassTag.D,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_MASS.tandemName ).createTandem( 'blockD' )
          },
          sameVolumeCubeOptions: {
            tag: MassTag.B,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_VOLUME.tandemName ).createTandem( 'blockB' )
          },
          sameDensityCubeOptions: {
            tag: MassTag.D,
            tandem: blockSetsTandem.createTandem( BlockSet.SAME_DENSITY.tandemName ).createTandem( 'blockD' )
          }
        } ]
    }, providedOptions );

    super( options );
  }
}

densityBuoyancyCommon.register( 'DensityCompareModel', DensityCompareModel );