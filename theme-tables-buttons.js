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
  // Primary Button enforcement
  // We want to target anything that was made green, to make sure it has the Supabase look:
  { regex: /className="([^"]*)bg-\[#3ECF8E\]([^"]*)"/g, replacement: (match, p1, p2) => {
      // If it already contains text-black, leave it, else force text-black
      let updatedP2 = p2;
      if (!updatedP2.includes('text-black')) {
          updatedP2 = updatedP2.replace(/text-\[[^\]]+\]/, 'text-black').replace(/text-white/, 'text-black');
          if (!updatedP2.includes('text-black')) updatedP2 += ' text-black';
      }
      if (!updatedP2.includes('hover:bg-[#34b27b]')) {
          updatedP2 = updatedP2.replace(/hover:bg-\[[^\]]+\]/, 'hover:bg-[#34b27b]');
          if (!updatedP2.includes('hover:bg-[#34b27b]')) updatedP2 += ' hover:bg-[#34b27b]';
      }
      return `className="${p1}bg-[#3ECF8E]${updatedP2}"`;
  }},

  // Secondary Button enforcement (dark grey)
  { regex: /className="([^"]*)bg-\[#2E2E2E\]([^"]*)"/g, replacement: (match, p1, p2) => {
      let updatedP2 = p2;
      if (updatedP2.includes('border') && !updatedP2.includes('hover:bg-[#3E3E3E]')) {
         updatedP2 += ' hover:bg-[#3E3E3E]';
      }
      return `className="${p1}bg-[#2A2A2A] border border-[#3E3E3E] hover:border-[#8F8F8F]${updatedP2.replace(/bg-\[#2E2E2E\]/g, '').replace(/border-\[#2E2E2E\]/g, '')}"`;
  }},

  // Table alignments
  { regex: /<table([^>]*)>/g, replacement: '<table$1>' }, // Keep as is, we'll fix the thead and tbody
  { regex: /<thead className="([^"]*)"/g, replacement: (match, p1) => {
      // Supabase thead
      return `<thead className="text-xs font-medium text-[#8F8F8F] bg-[#232323] uppercase border-b border-[#2E2E2E] tracking-wider"`;
  }},
  { regex: /<tbody className="([^"]*)"/g, replacement: (match, p1) => {
      return `<tbody className="divide-y divide-[#2E2E2E] text-sm text-[#EDEDED] bg-[#1C1C1C]"`;
  }},
  { regex: /<tr key=\{([^\}]+)\} className="([^"]*)"/g, replacement: (match, p1, p2) => {
      // Fix tr hover
      return `<tr key={${p1}} className="hover:bg-[#2A2A2A] transition-colors"`;
  }},
  { regex: /<tr className="hover:bg-\[[^\]]+\]([^"]*)"/g, replacement: '<tr className="hover:bg-[#2A2A2A] transition-colors"' },

  // Any remaining generic slate button hovers
  { regex: /hover:bg-slate-400/g, replacement: 'hover:bg-[#3E3E3E]' },
  { regex: /bg-slate-300/g, replacement: 'bg-[#2A2A2A]' },
  
  // Specific table borders
  { regex: /divide-y divide-slate-100/g, replacement: 'divide-y divide-[#2E2E2E]' },
  { regex: /divide-y divide-slate-200/g, replacement: 'divide-y divide-[#2E2E2E]' },
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
      console.log('Processed:', file);
  }
});
