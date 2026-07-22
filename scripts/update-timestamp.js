const fs = require('fs');
const path = require('path');

const footerPath = path.join(__dirname, '../partials/footer.html');

function updateTimestamp() {
  if (!fs.existsSync(footerPath)) return;
  
  let content = fs.readFileSync(footerPath, 'utf8');
  const now = new Date();
  
  const options = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  };
  const formattedDate = now.toLocaleString('en-US', options);

  if (content.includes('id="last-updated"')) {
    content = content.replace(
      /<span id="last-updated">.*?<\/span>/,
      `<span id="last-updated">${formattedDate}</span>`
    );
  } else {
    content = content.replace(
      '</footer>',
      `  <div style="font-size: 0.72rem; opacity: 0.6; margin-top: 0.4rem;">Site Updated: <span id="last-updated">${formattedDate}</span></div>\n</footer>`
    );
  }

  fs.writeFileSync(footerPath, content, 'utf8');
  console.log(`⏱️ Site deployment timestamp updated: ${formattedDate}`);
}

updateTimestamp();
