// Interactive Challenge Arena: 3-Tier Inertia Mastery Sprint
// Satisfies Student Task Engagement Law (Archetype A & B) with interactive verification & Certificate

class ChallengeEngine {
  constructor() {
    this.currentTier = 1;
    this.scores = { 1: 0, 2: 0, 3: 0 };
    this.completed = { 1: false, 2: false, 3: false };
    this.targetHit = false;
  }

  get totalScore() {
    return this.scores[1] + this.scores[2] + this.scores[3];
  }

  isAllCompleted() {
    return this.completed[1] && this.completed[2] && this.completed[3];
  }

  submitTier1(guessAccel, app) {
    // Challenge 1: Minimum pull acceleration to slip under silk cloth (mu_s = 0.15)
    // a_min = mu_s * g = 0.15 * 9.8 = 1.47 m/s^2. Any value > 1.5 m/s^2 successfully slips!
    const val = parseFloat(guessAccel);
    const minRequired = 0.15 * 9.8;

    if (val >= minRequired && val <= 100) {
      this.scores[1] = 30;
      this.completed[1] = true;
      window.soundFx.playSuccess();

      // Trigger live simulation test
      app.switchTab('rest');
      app.simRest.setMaterial('silk');
      app.simRest.setDish('plate');
      app.simRest.setPullAccel(val);
      app.simRest.triggerPull();

      return {
        success: true,
        score: 30,
        message: `✓ BRILLIANT! a_pull = ${val} m/s² exceeds μ_s · g (1.47 m/s²). The cloth slipped cleanly underneath the plate!`
      };
    } else {
      window.soundFx.playError();
      return {
        success: false,
        score: 0,
        message: `❌ DISASTER! At ${val} m/s², the pull acceleration is LESS than static friction threshold (1.47 m/s²). The dish moves with the cloth!`
      };
    }
  }

  submitTier2(forwardForceAnswer, passengerSpeedAnswer, app) {
    // Challenge 2:
    // Part A: Forward force on passenger = 0 N (Inertia, not a force!)
    // Part B: Passenger continues forward at ~initial speed while car brakes
    const isForceZero = (forwardForceAnswer === '0');
    const isSpeedCorrect = (passengerSpeedAnswer === 'faster');

    if (isForceZero && isSpeedCorrect) {
      this.scores[2] = 35;
      this.completed[2] = true;
      window.soundFx.playSuccess();

      // Run live crash simulation
      app.switchTab('motion');
      app.simMotion.setSeatbelt(false);
      app.simMotion.setInitialVelocity(20);
      app.simMotion.triggerRun();

      return {
        success: true,
        score: 35,
        message: `✓ CORRECT! Forward force is EXACTLY ZERO. The dummy continues moving forward because matter is lazy and resists changes in velocity!`
      };
    } else {
      window.soundFx.playError();
      return {
        success: false,
        score: 0,
        message: `❌ MISCONCEPTION TRAP! There is NO forward force pushing the dummy. Everyday intuition says 'something pushed me', but physics says: in the absence of a force, you simply keep traveling at your current speed!`
      };
    }
  }

  submitTier3(pathAnswer, app) {
    // Challenge 3: Path of whirling object when string snaps
    // Answer must be 'tangent' (A straight line tangent to circle)
    if (pathAnswer === 'tangent') {
      this.scores[3] = 35;
      this.completed[3] = true;
      window.soundFx.playSuccess();

      // Run live direction simulation
      app.switchTab('direction');
      app.simDirection.reset();
      setTimeout(() => {
        app.simDirection.cutString();
      }, 700);

      return {
        success: true,
        score: 35,
        message: `✓ ACCURATE! When the string snaps, inward centripetal force drops to 0 N. By Newton's 1st Law, the object flies along the straight tangent line!`
      };
    } else {
      window.soundFx.playError();
      return {
        success: false,
        score: 0,
        message: `❌ HISTORICAL TRAP! Objects NEVER fly outward in a curved spiral or radial spoke. That is an optical illusion created by turning reference frames. In the ground frame, it is a 100% straight line tangent!`
      };
    }
  }
}

window.ChallengeEngine = ChallengeEngine;
