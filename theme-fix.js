const fs = require('fs');
const path = require('path');

const dir = 'web/src/views/admin-console';
const filesToProcess = fs.readdirSync(dir)
  .filter(file => file.endsWith('.tsx'))
  .map(file => path.join(dir, file));

const replacements = [
  // Backgrounds
  { regex: /bg-slate-900/g, replacement: 'bg-[#1C1C1C]' },
  { regex: /bg-slate-800/g, replacement: 'bg-[#232323]' },
  { regex: /bg-slate-50/g, replacement: 'bg-[#181818]' },
  { regex: /bg-slate-100/g, replacement: 'bg-[#232323]' },
  { regex: /bg-white/g, replacement: 'bg-[#232323]' },
  
  // Text Colors
  { regex: /text-slate-900/g, replacement: 'text-[#EDEDED]' },
  { regex: /text-slate-800/g, replacement: 'text-[#EDEDED]' },
  { regex: /text-slate-700/g, replacement: 'text-[#EDEDED]' },
  { regex: /text-slate-600/g, replacement: 'text-[#8F8F8F]' },
  { regex: /text-slate-500/g, replacement: 'text-[#8F8F8F]' },
  { regex: /text-slate-400/g, replacement: 'text-[#8F8F8F]' },
  { regex: /text-gray-900/g, replacement: 'text-[#EDEDED]' },
  { regex: /text-gray-800/g, replacement: 'text-[#EDEDED]' },
  { regex: /text-gray-700/g, replacement: 'text-[#EDEDED]' },
  { regex: /text-gray-600/g, replacement: 'text-[#8F8F8F]' },
  { regex: /text-gray-500/g, replacement: 'text-[#8F8F8F]' },
  { regex: /text-gray-400/g, replacement: 'text-[#8F8F8F]' },
  
  // Borders
  { regex: /border-slate-800/g, replacement: 'border-[#2E2E2E]' },
  { regex: /border-slate-700/g, replacement: 'border-[#2E2E2E]' },
  { regex: /border-slate-300/g, replacement: 'border-[#2E2E2E]' },
  { regex: /border-slate-200/g, replacement: 'border-[#2E2E2E]' },
  { regex: /border-slate-100/g, replacement: 'border-[#2E2E2E]' },
  { regex: /border-gray-200/g, replacement: 'border-[#2E2E2E]' },
  { regex: /border-gray-300/g, replacement: 'border-[#2E2E2E]' },
  
  // Hovers
  { regex: /hover:bg-slate-800/g, replacement: 'hover:bg-[#2A2A2A]' },
  { regex: /hover:bg-slate-100/g, replacement: 'hover:bg-[#2E2E2E]' },
  { regex: /hover:bg-slate-50/g, replacement: 'hover:bg-[#2A2A2A]' },
  { regex: /hover:text-slate-900/g, replacement: 'hover:text-[#EDEDED]' },
  { regex: /hover:text-slate-700/g, replacement: 'hover:text-[#EDEDED]' },
  { regex: /hover:text-slate-600/g, replacement: 'hover:text-[#EDEDED]' },
  
  // Specific Blue overrides to Emerald Green (for active tabs, badges, buttons)
  { regex: /bg-blue-600/g, replacement: 'bg-[#3ECF8E]' },
  { regex: /bg-blue-500/g, replacement: 'bg-[#3ECF8E]' },
  { regex: /text-blue-600/g, replacement: 'text-[#3ECF8E]' },
  { regex: /text-blue-500/g, replacement: 'text-[#3ECF8E]' },
  { regex: /border-blue-500/g, replacement: 'border-[#3ECF8E]' },
  { regex: /border-blue-600/g, replacement: 'border-[#3ECF8E]' },
  { regex: /ring-blue-500/g, replacement: 'ring-[#3ECF8E]' },
  { regex: /bg-blue-50/g, replacement: 'bg-[#3ECF8E]/10' },

  // Remaining fixes from Shipper Portal
  { regex: /focus:border-slate-900/g, replacement: 'focus:border-[#3ECF8E]' },
  { regex: /divide-slate-100/g, replacement: 'divide-[#2E2E2E]' },
  { regex: /divide-slate-200/g, replacement: 'divide-[#2E2E2E]' },
  { regex: /text-slate-300/g, replacement: 'text-[#8F8F8F]' },
  { regex: /bg-slate-200/g, replacement: 'bg-[#2E2E2E]' },
  { regex: /border-white/g, replacement: 'border-[#1C1C1C]' },
  { regex: /text-white/g, replacement: 'text-[#EDEDED]' },
  { regex: /text-slate-200/g, replacement: 'text-[#EDEDED]' },
  { regex: /bg-slate-300 border border-black hover:bg-slate-400/g, replacement: 'bg-[#2E2E2E] border border-[#2E2E2E] hover:bg-[#3E3E3E]' },
];

const buttonFixes = [
  { regex: /bg-\[#1C1C1C\] text-white/g, replacement: 'bg-[#3ECF8E] text-black hover:bg-[#34b27b] transition-colors font-bold' },
  { regex: /className="([^"]*)bg-slate-900([^"]*)text-white([^"]*)"/g, replacement: 'className="$1bg-[#3ECF8E] text-black hover:bg-[#34b27b] transition-colors font-bold$2$3"' },
  { regex: /className="([^"]*)bg-gradient-to-r from-slate-900 to-slate-800([^"]*)text-white([^"]*)"/g, replacement: 'className="$1bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-bold$2$3"' }
];

filesToProcess.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  replacements.forEach(rep => {
    content = content.replace(rep.regex, rep.replacement);
  });
  
  buttonFixes.forEach(rep => {
    content = content.replace(rep.regex, rep.replacement);
  });

  fs.writeFileSync(fullPath, content);
  console.log('Processed:', file);
});
