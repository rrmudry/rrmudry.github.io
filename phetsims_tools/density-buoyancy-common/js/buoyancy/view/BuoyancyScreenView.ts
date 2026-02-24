// Copyright 2024, University of Colorado Boulder

/**
 * Abstract type for Buoyancy ScreenView classes. This is mostly a marker/placeholder, but it does capture the default
 * canShowForces: true value which is common among the Buoyancy ScreenView classes.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import Bounds2 from '../../../../dot/js/Bounds2.js';
import Vector3 from '../../../../dot/js/Vector3.js';
import optionize, { EmptySelfOptions } from '../../../../phet-core/js/optionize.js';
import DensityBuoyancyCommonConstants from '../../common/DensityBuoyancyCommonConstants.js';
import DensityBuoyancyModel from '../../common/model/DensityBuoyancyModel.js';
import DensityBuoyancyScreenView, { DensityBuoyancyScreenViewOptions } from '../../common/view/DensityBuoyancyScreenView.js';
import PoolScaleHeightControl from '../../common/view/PoolScaleHeightControl.js';
import densityBuoyancyCommon from '../../densityBuoyancyCommon.js';
import BuoyancyDisplayOptionsPanel from './BuoyancyDisplayOptionsPanel.js';

// constants
const MARGIN = DensityBuoyancyCommonConstants.MARGIN_SMALL;

export type BuoyancyScreenViewOptions = DensityBuoyancyScreenViewOptions;

export default abstract class BuoyancyScreenView<T extends DensityBuoyancyModel> extends DensityBuoyancyScreenView<T> {

  protected readonly poolScaleHeightControl: PoolScaleHeightControl | null = null;

  protected readonly displayOptionsPanel: BuoyancyDisplayOptionsPanel;

  protected constructor( model: T,
                         providedOptions: BuoyancyScreenViewOptions ) {

    const options = optionize<BuoyancyScreenViewOptions, EmptySelfOptions, DensityBuoyancyScreenViewOptions>()( {
      canShowForces: true,
      cameraLookAt: DensityBuoyancyCommonConstants.BUOYANCY_CAMERA_LOOK_AT
    }, providedOptions );

    super( model, options );

    const tandem = options.tandem;

    if ( model.pool.scale ) {
      this.poolScaleHeightControl = new PoolScaleHeightControl( model.pool.scale,
        model.poolBounds, model.pool.fluidYInterpolatedProperty, this, {
          tandem: options.tandem.createTandem( 'poolScaleHeightControl' )
        } );
      this.addChild( this.poolScaleHeightControl );
    }

    this.displayOptionsPanel = new BuoyancyDisplayOptionsPanel( this.displayProperties, {
      tandem: tandem.createTandem( 'displayOptionsPanel' ),
      visiblePropertyOptions: {
        phetioFeatured: true
      },
      contentWidth: this.modelToViewPoint( new Vector3(
        this.model.poolBounds.left,
        this.model.poolBounds.top,
        this.model.poolBounds.front
      ) ).x - 2 * MARGIN
    } );
  }

  private positionScaleHeightControl(): void {

    // If the simulation was not able to load for WebGL, bail out
    if ( this.sceneNode && this.poolScaleHeightControl && this.model.pool.scale ) {

      // X margin should be based on the front of the pool
      this.poolScaleHeightControl.x = this.modelToViewPoint( new Vector3(
        this.model.poolBounds.maxX,
        this.model.poolBounds.minY,
        this.model.poolBounds.maxZ
      ) ).plusXY( DensityBuoyancyCommonConstants.MARGIN_SMALL, 0 ).x;

      // Y should be based on the bottom of the front of the scale (in the middle of the pool)
      this.poolScaleHeightControl.y = this.modelToViewPoint( new Vector3(
        this.model.poolBounds.maxX,
        this.model.poolBounds.minY,
        this.model.pool.scale.getBounds().maxZ
      ) ).y;
    }
  }

  public override layout( viewBounds: Bounds2 ): void {
    super.layout( viewBounds );
    this.positionScaleHeightControl();
  }
}

densityBuoyancyCommon.register( 'BuoyancyScreenView', BuoyancyScreenView );