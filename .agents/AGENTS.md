# Workspace Rules & Guidelines

## 📚 Automatic NGSS Standards Alignment
Whenever creating or updating a new unit dashboard, lesson plan, activity, assignment, or student webapp across `rrmudry.github.io`:

1. **Declarative HTML Standards Alignment**:
   Include a container element with the `data-ngss` attribute (e.g. `<div data-ngss="HS-PS2-1,HS-PS2-2"></div>`) or `data-ngss-is` attribute (e.g. `<div data-ngss-is="IS1"></div>`) in the layout.
2. **Automatic Script Execution**:
   Because `assets/partials.js` automatically loads `assets/ngss-helper.js` on every page, `NGSSHelper.autoInit()` will scan the DOM and render interactive NGSS standard badges & popovers automatically.
