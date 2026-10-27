// Mission Definitions & Physics Logic for Projectile Target Range
// Earth gravity standard: g = 10 m/s², so Δy = 5 · t² and t = √(Δy / 5).
// Horizontal constant motion: Δx = vx · t.

const TRACKS_DATA = {
  conceptual: {
    id: 'conceptual',
    name: 'Conceptual Physics',
    tagline: 'Mental Math & Free-Fall Patterns (g = 10 m/s²)',
    missions: [
      {
        id: 'c1',
        title: 'Mission 1: The 1-Second Drop',
        description: 'A launcher fires a ball horizontally from a 5.0 meter cliff.',
        height: 5.0,
        vx: 6.0,
        expectedT: 1.0,
        expectedDx: 6.0,
        isReverse: false,
        step1Hint: 'Hint: 5 ÷ 5 = 1. What is the square root of 1? (t = √1)',
        step2Hint: 'Hint: Multiply your time (1.0 s) by your sideways speed (6.0 m/s).'
      },
      {
        id: 'c2',
        title: 'Mission 2: The 20-Meter Cliff',
        description: 'A metal sphere is launched from a high 20.0 meter cliff at 8.0 m/s.',
        height: 20.0,
        vx: 8.0,
        expectedT: 2.0,
        expectedDx: 16.0,
        isReverse: false,
        step1Hint: 'Hint: 20 ÷ 5 = 4. What number times itself equals 4? (t = √4)',
        step2Hint: 'Hint: Δx = vx · t = 8.0 m/s × 2.0 s = ?'
      },
      {
        id: 'c3',
        title: 'Mission 3: The Speed Doubler',
        description: 'Same 20.0 meter cliff, but now the launcher speed is doubled to 16.0 m/s!',
        height: 20.0,
        vx: 16.0,
        expectedT: 2.0,
        expectedDx: 32.0,
        isReverse: false,
        step1Hint: 'Notice: The cliff height is still 20 meters! Does speed change hang time?',
        step2Hint: 'Hint: The ball is in the air for 2.0 seconds at 16.0 m/s. Multiply 16 × 2.'
      },
      {
        id: 'c4',
        title: 'Mission 4: The 45-Meter High Dive',
        description: 'A 45.0 meter cliff with a launch speed of 10.0 m/s.',
        height: 45.0,
        vx: 10.0,
        expectedT: 3.0,
        expectedDx: 30.0,
        isReverse: false,
        step1Hint: 'Hint: 45 ÷ 5 = 9. What is the square root of 9? (t = √9)',
        step2Hint: 'Hint: Multiply 10.0 m/s by your hang time (3.0 s).'
      },
      {
        id: 'c5',
        title: 'Mission 5: The 80-Meter Monument',
        description: 'An 80.0 meter drop with a rapid launch speed of 12.0 m/s.',
        height: 80.0,
        vx: 12.0,
        expectedT: 4.0,
        expectedDx: 48.0,
        isReverse: false,
        step1Hint: 'Hint: 80 ÷ 5 = 16. What is the square root of 16? (t = √16)',
        step2Hint: 'Hint: 12.0 m/s for 4.0 seconds = 12 × 4.'
      }
    ]
  },

  regular: {
    id: 'regular',
    name: 'Regular Physics',
    tagline: 'Lab Scale Drops, Decimals & Reverse Target Problems',
    missions: [
      {
        id: 'r1',
        title: 'Mission 1: High School Lab Table',
        description: 'A marble rolls off a 1.25 meter classroom lab table at 4.0 m/s.',
        height: 1.25,
        vx: 4.0,
        expectedT: 0.5,
        expectedDx: 2.0,
        isReverse: false,
        step1Hint: 'Hint: 1.25 ÷ 5 = 0.25. Use your calculator to find √0.25.',
        step2Hint: 'Hint: Δx = vx · t = 4.0 m/s × 0.5 s = ?'
      },
      {
        id: 'r2',
        title: 'Mission 2: Second Story Balcony',
        description: 'A launch from a height of 3.20 meters with a speed of 5.5 m/s.',
        height: 3.2,
        vx: 5.5,
        expectedT: 0.8,
        expectedDx: 4.4,
        isReverse: false,
        step1Hint: 'Hint: 3.2 ÷ 5 = 0.64. The square root of 0.64 is ?',
        step2Hint: 'Hint: 5.5 m/s × 0.8 s = ?'
      },
      {
        id: 'r3',
        title: 'Mission 3: The 20-Meter Ridge',
        description: 'A pneumatic launch from 20.0 meters high with an exit speed of 7.5 m/s.',
        height: 20.0,
        vx: 7.5,
        expectedT: 2.0,
        expectedDx: 15.0,
        isReverse: false,
        step1Hint: 'Hint: 20 ÷ 5 = 4, and √4 = 2.0 seconds.',
        step2Hint: 'Hint: 7.5 × 2.0 = ?'
      },
      {
        id: 'r4',
        title: 'Mission 4: The 45-Meter Test',
        description: 'A ball fired horizontally from a 45.0 meter elevation at 13.5 m/s.',
        height: 45.0,
        vx: 13.5,
        expectedT: 3.0,
        expectedDx: 40.5,
        isReverse: false,
        step1Hint: 'Hint: 45 ÷ 5 = 9, and √9 = 3.0 seconds.',
        step2Hint: 'Hint: 13.5 m/s × 3.0 s = ?'
      },
      {
        id: 'r5',
        title: 'Mission 5: The Target Hunter (Reverse)',
        description: 'Target bucket is LOCKED at 18.0 m from a 20.0 m cliff! Solve for required launch speed.',
        height: 20.0,
        lockedDx: 18.0,
        expectedT: 2.0,
        expectedVx: 9.0,
        isReverse: true,
        step1Hint: 'Hint: Cliff is 20m high. First find hang time: t = √(20 / 5) = 2.0 s.',
        step2Hint: 'Hint: Speed = Distance ÷ Time. Required speed vx = 18.0 m ÷ 2.0 s = ?'
      }
    ]
  },

  honors: {
    id: 'honors',
    name: 'Honors Physics',
    tagline: 'Variable Elevations & Vector Impact Telemetry',
    missions: [
      {
        id: 'h1',
        title: 'Mission 1: Standard Table Kinematics',
        description: 'A table drop from 1.80 meters with horizontal velocity 6.0 m/s.',
        height: 1.8,
        vx: 6.0,
        expectedT: 0.6,
        expectedDx: 3.6,
        expectedVy: 6.0,
        expectedVimpact: 8.49,
        isReverse: false,
        isHonorsImpact: true,
        step1Hint: 'Hint: 1.8 ÷ 5 = 0.36. √0.36 = 0.6 s.',
        step2Hint: 'Hint: Δx = 6.0 × 0.6 = 3.6 m.',
        step3Hint: 'Hint: Downward speed vy = 10 · t = 10 × 0.6 = 6.0 m/s. Then v = √(vx² + vy²).'
      },
      {
        id: 'h2',
        title: 'Mission 2: Quarry Cliff Launch',
        description: 'A 20.0 meter cliff launch with vx = 15.0 m/s.',
        height: 20.0,
        vx: 15.0,
        expectedT: 2.0,
        expectedDx: 30.0,
        expectedVy: 20.0,
        expectedVimpact: 25.0,
        isReverse: false,
        isHonorsImpact: true,
        step1Hint: 'Hint: t = √(20/5) = 2.0 s.',
        step2Hint: 'Hint: Δx = 15.0 × 2.0 = 30.0 m.',
        step3Hint: 'Hint: vy = 10 × 2.0 = 20.0 m/s. Impact speed v = √(15² + 20²) = √625 = 25.0 m/s.'
      },
      {
        id: 'h3',
        title: 'Mission 3: High Plateau Launch',
        description: 'An elevated 45.0 meter plateau launch with vx = 12.0 m/s.',
        height: 45.0,
        vx: 12.0,
        expectedT: 3.0,
        expectedDx: 36.0,
        expectedVy: 30.0,
        expectedVimpact: 32.31,
        isReverse: false,
        isHonorsImpact: true,
        step1Hint: 'Hint: t = √(45/5) = 3.0 s.',
        step2Hint: 'Hint: Δx = 12.0 × 3.0 = 36.0 m.',
        step3Hint: 'Hint: vy = 10 × 3.0 = 30.0 m/s. Total v = √(12² + 30²) = √1044 ≈ 32.3 m/s.'
      },
      {
        id: 'h4',
        title: 'Mission 4: The Reverse Plateau Hunter',
        description: 'Target bunker is locked at 42.0 m from a 45.0 m drop. Dial the launcher velocity!',
        height: 45.0,
        lockedDx: 42.0,
        expectedT: 3.0,
        expectedVx: 14.0,
        isReverse: true,
        isHonorsImpact: false,
        step1Hint: 'Hint: t = √(45/5) = 3.0 s.',
        step2Hint: 'Hint: vx = Δx / t = 42.0 / 3.0 = ? m/s.'
      },
      {
        id: 'h5',
        title: 'Mission 5: High Velocity Impact Finale',
        description: 'Launch from 80.0 meters at 30.0 m/s. Calculate final impact velocity magnitude.',
        height: 80.0,
        vx: 30.0,
        expectedT: 4.0,
        expectedDx: 120.0,
        expectedVy: 40.0,
        expectedVimpact: 50.0,
        isReverse: false,
        isHonorsImpact: true,
        step1Hint: 'Hint: t = √(80/5) = √16 = 4.0 s.',
        step2Hint: 'Hint: Δx = 30.0 × 4.0 = 120.0 m.',
        step3Hint: 'Hint: vy = 10 × 4.0 = 40.0 m/s. Pythagorean: v = √(30² + 40²) = √2500 = 50.0 m/s.'
      }
    ]
  }
};

window.TRACKS_DATA = TRACKS_DATA;
