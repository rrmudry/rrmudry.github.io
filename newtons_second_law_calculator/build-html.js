// Builds dist/index.html for the Newton's 2nd Law Calculator (Fnet = m · a).
// Sources are plain files (no template-literal escaping):
//   src/template.html  page markup and styles
//   src/app.js         game logic (questions injected at /*__QUESTIONS__*/)
//   questions.js       curated word problems + solver (run `node questions.js` to check answers)
// Usage: node build-html.js
const fs = require('fs');
const path = require('path');
const { QUESTIONS, solveQuestion } = require('./questions.js');

const template = fs.readFileSync(path.join(__dirname, 'src', 'template.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, 'src', 'app.js'), 'utf8');

// The page shares the build-time solver so answers can't drift from questions.js
const signedValue = require('./questions.js').signedValue;
const questionsJs = [
  `const QUESTIONS = ${JSON.stringify(QUESTIONS)};`,
  signedValue.toString(),
  solveQuestion.toString()
].join('\n\n    ');

if (!appJs.includes('/*__QUESTIONS__*/')) throw new Error('src/app.js is missing the /*__QUESTIONS__*/ marker');

const htmlContent = `${template}
  <script>
${appJs.split('/*__QUESTIONS__*/').join(questionsJs)}
  </script>
</body>
</html>
`;

const distPath = path.join(__dirname, 'dist', 'index.html');
fs.mkdirSync(path.dirname(distPath), { recursive: true });
fs.writeFileSync(distPath, htmlContent);
console.log('Successfully generated:', distPath);

// Also generate newtons_second_law_calculator/index.html (convenience redirect)
const rootIndexPath = path.join(__dirname, 'index.html');
const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Redirecting to Newton's 2nd Law Calculator...</title>
</head>
<body>
  <script>
    const search = window.location.search || '';
    const hash = window.location.hash || '';
    window.location.replace("dist/index.html" + search + hash);
  </script>
  <p>Redirecting to <a href="dist/index.html">Newton's 2nd Law Calculator</a>...</p>
</body>
</html>`;
fs.writeFileSync(rootIndexPath, redirectHtml);
console.log('Successfully generated:', rootIndexPath);
