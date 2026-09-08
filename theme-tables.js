const fs = require('fs');
const path = require('path');

function processDir(dir) {
  let filesToProcess = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      filesToProcess = filesToProcess.concat(processDir(fullPath));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx')) {
      filesToProcess.push(fullPath);
    }
  }
  return filesToProcess;
}

const allFiles = processDir('web/src');

const replacements = [
  // Table alignments
  { regex: /<table([^>]*)>/g, replacement: '<table$1>' }, // Keep as is, we'll fix the thead and tbody
  { regex: /<thead className="([^"]*)"/g, replacement: (match, p1) => {
      return `<thead className="text-[10px] font-bold text-[#8F8F8F] bg-[#1C1C1C] uppercase border-b border-[#2E2E2E] tracking-wider"`;
  }},
  { regex: /<tbody className="([^"]*)"/g, replacement: (match, p1) => {
      return `<tbody className="divide-y divide-[#2E2E2E] text-xs font-mono text-[#EDEDED] bg-[#232323]"`;
  }},
  { regex: /<tr className="hover:bg-\[[^\]]+\]([^"]*)"/g, replacement: '<tr className="hover:bg-[#2A2A2A] transition-colors"' },
  { regex: /<tr key=\{([^\}]+)\} className="hover:bg-\[[^\]]+\]([^"]*)"/g, replacement: '<tr key={$1} className="hover:bg-[#2A2A2A] transition-colors"' }
];

allFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let originalContent = content;
  
  replacements.forEach(rep => {
    content = content.replace(rep.regex, rep.replacement);
  });

  if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log('Processed Table:', file);
  }
});
