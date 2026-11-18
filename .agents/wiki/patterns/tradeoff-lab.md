# Pulleys and Ramps Lab (Unit 3 Day 3)

> **Tags**: `work`, `simple-machines`, `pulley`, `ramp`, `tap-to-pull`, `data-table`, `single-page`, `pulley-work-style`, `firestore`, `monitor`, `inline-build`
> **Last Updated**: 2026-11-18

`Unit_3/tradeoff_lab/` (assignment `unit3_day3_tradeoff_lab`). A copy of the **Ideal Pulley System Lab's style** (`pulley-work/`): one page of numbered white cards (1 Setup, 2 Simulation, 3 My Data, 4 What It Shows), the student moves freely, very few words. Pulleys and smooth ramps share one scene. No friction and no force components. Monitor: `admin/tradeoff_lab_monitor.html`.

## The teacher's direction (2026-11-17)
- A first version was built on the Day 2 studio framework (step-by-step task card, locked parts, predictions before any data, Desmos-only answers, Mastery Check). The teacher rejected it: they had asked to copy pulley-work's style. Predictions with no reference, odd controls (pick, then "Use this pulley"), and too many words were the named problems.
- **Visual load like a children's book, without kindergarten rigor.** Big pictures, short labels, icons, one-line status messages.
- When the teacher points at an app as the model, copy that app's structure and look. Don't swap in a different framework.

## How it works
- **Setup:** two big machine buttons (⚙️ Pulley / 📐 Ramp) and one slider (supporting ropes 1–4, or ramp length 1.5–6.5 m in 0.5 m steps). Changing either resets the lift. Each student has their own load (12–24 kg), shown on the crate. Lift height is always 1.5 m.
- **Tap-to-pull:** 35 N per tap per second, smoothed with `1 − e^(−8 dt)`, as in pulley-work. The tap rate comes from the gaps between the last few taps (counting taps in a 0.5 s window moves in 70 N steps, and light loads can't be held still). Rope coordinate x, acceleration (F − F<sub>need</sub> − 30·v) / m<sub>eff</sub> with m<sub>eff</sub> = m / n² for a pulley and m for a ramp.
- **Hold to read:** 1.5 s in the green zone latches the load, and the scale shows exactly F<sub>need</sub>.
- **My Data:** the student types d, F and W = F × d and presses Add. d and F are checked against the sim and W against their own F × d. A miss names what to look at again and waits a few seconds. One row per setup, at most 8.
- **What It Shows:** F against d plots itself from their rows (dot = pulley, a bigger triangle = ramp, so a dot inside a triangle shows a shared point), and the work bars show every trial at about the same height.
- **After 3 pulley + 3 ramp rows:** two questions (force when the rope goes 2× as far; work for each machine). A miss shuffles the choices and waits 6 s. Then a prediction **with reference to their data**: the force for a ramp length not in their table. They set it up, lift it and read the scale. Within 8% (or 4 N) counts.
- **Points (10):** 1 per correct row up to 3 pulley + 3 ramp, 1 per question, 2 for the tested prediction. The best score is kept.

## Calculator and teacher view (2026-11-18)
- A Desmos scientific calculator sits in the Setup card. The W box is read-only and is filled only by **📥 Use as W**, which needs a real calculation that uses the student's own F and d (`FL.workProblem` with that route). The same button fills the prediction box once it is showing. The work line is saved with each row. If Desmos doesn't load, W can be typed and `calc_unavailable` is saved.
- My Data messages are big callouts: "Lift and hold to record", "This setup is already in your table" (amber), and "Your table is full".
- Teacher view: a 🧑‍🏫 Teacher menu for teacher accounts (and `?teacher` on localhost, no sign-in): show the true readings, fill 6 sample rows, skip to the prediction, start over. Students never see it.

## Ramp, questions, calculator size, full screen (2026-11-18)
- The ramp board runs 0.3 m higher than the 1.5 m hold line, with the same green band as the pulley, so the cart is held mid-ramp, not pinned at the top. "Ramp length" is the distance up to the hold line, and the slider tops out at 6 m so the rope tape still fits.
- Once 3 pulley + 3 ramp rows are in, a **Think about your data** view covers cards 2–4 (the calculator stays on the left). Each question uses the student's own trials, with a big chart (highlighted points or bars) and their table (highlighted rows) beside it. Q1: two pulley rows where d is 2× (or 3× or 4×) the other, "what happened to the force?". Q2: least vs. most rope, "how does their work compare?". Q3: predict F for a ramp not in the table, with the curve through their points and a dashed line at that length. The test happens back in the lab.
- The calculator fills the rest of the Setup card (about 20 rem), so earlier lines stay visible above the input.
- Full screen: a ⛶ button in the header, plus a banner whenever the window isn't full screen (it names the Chromebook full-screen key). ✕ hides it for the visit.

## Pulley animation, rope texture, class views (2026-11-18)
- **Reeving:** strands are numbered from the dead end. With an even n the dead end is on the top block, with an odd n on the moving block. Wheel k joins strands k and k+1 on the block where strand k ends, and a last top wheel turns strand n toward the free end. Strands are 2r apart, so they meet each wheel at its edge. Rope speeds in load-speed units: the dead end moves with its block, and across a wheel moving at b, w(k+1) = 2b − w(k). So the free end moves at n, and the wheels turn at relative speeds 1, 2, …, n (`Scene.reeving`, covered by a jest test).
- **Rope texture:** each rope section is a solid stroke plus a dashed "braid". The dash offset follows that section's material speed, so a strand tied to a block stands still and the free end moves fastest. The floor run uses the tape's 76 px/m so it matches the red tag. The cart-to-ramp-pulley section is drawn from the pulley end.
- **Wheels:** spokes rotate by (relative rope travel × px/m) ÷ r.
- **Ramp length:** a drafting-style dimension line on the open side above the cart path, with a "4 m" pill along it. The rope tape is just labeled "d (m)".
- **Class views:** Periods 1–3 (roster tier `conceptual`) get a green digital readout under the spring scale. It shows whole newtons while pulling and one decimal once latched. Teachers switch views with Teacher → View as.

## Finish, certificate, and analysis by class (2026-11-18)
- **Finish:** a "You finished the lab!" card pops up once, with a summary of what they did and **📄 Download my certificate (PDF)** (`js/certificate.js`, jsPDF from `assets/vendor`). A 🎓 Certificate chip stays in the header, and the done callout in My Data repeats the button. Guests are told certificates are for signed-in students; previews and teachers get a SAMPLE. The code and date are saved as `certificate_code` and `certificate_earned_at`.
- **Questions by class:** Periods 1–3: force pattern, work pattern, predict a ramp. Periods 4–6 add **mechanical advantage** (MA = F_g ÷ F and d ÷ h for their longest-rope row; the two match) and **explain in a sentence** (inline dropdowns: "the force ___ and the work ___"). Period 0 also gets **design a ramp**: given a pull limit, find the shortest ramp L = W ÷ F, then build it on the sim and read the scale.
- **Points:** 6 for rows plus 4 shared by that class's steps (each question 1, predict 2, design 2), so each class still totals 10 and partial scores can be decimals.
- In the big view, the calculator's 📥 button fills the box the student last clicked (or else the first empty one).

## Testing
Use puppeteer with an in-page tapping bot (`TradeoffLab.debug()` exposes `st`, `sim`, `tap`, `machine`). It reaches 10/10 with no console errors at 1366 × 768. At 1366 × 650 only the My Data card scrolls.
