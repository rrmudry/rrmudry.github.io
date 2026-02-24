// Copyright 2024, University of Colorado Boulder

/**
 * BottleOrBoat is a string literal union enumeration that describes whether the sim is showing the bottle or boat scene
 * in the Buoyancy - Applications screen.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
export const BottleOrBoatValues = [ 'bottle', 'boat' ] as const;

export type BottleOrBoat = typeof BottleOrBoatValues[number];