const fs = require('fs');
const path = require('path');

const filesToProcess = [
  path.join(__dirname, '../src/app/page.tsx'),
  path.join(__dirname, '../src/app/account/[id]/page.tsx')
];

const replacements = {
  'bg-zinc-950': 'bg-background',
  'bg-zinc-900': 'bg-card',
  'bg-zinc-800': 'bg-muted',
  'border-zinc-900': 'border-border',
  'border-zinc-850': 'border-border',
  'border-zinc-800': 'border-border',
  'text-zinc-50': 'text-foreground',
  'text-zinc-100': 'text-foreground',
  'text-zinc-200': 'text-foreground',
  'text-zinc-300': 'text-muted-foreground',
  'text-zinc-350': 'text-muted-foreground',
  'text-zinc-400': 'text-muted-foreground',
  'text-zinc-450': 'text-muted-foreground',
  'text-zinc-455': 'text-muted-foreground',
  'text-zinc-500': 'text-muted-foreground',
  'text-zinc-550': 'text-muted-foreground',
  'text-zinc-555': 'text-muted-foreground',
  'text-zinc-650': 'text-muted-foreground',
  'text-zinc-750': 'text-muted-foreground',
  'bg-zinc-950/40': 'bg-background/40',
  'bg-zinc-950/20': 'bg-background/20',
  'bg-zinc-950/80': 'bg-background/80',
  'bg-zinc-900/60': 'bg-card/60',
  'bg-zinc-900/50': 'bg-card/50',
  'bg-zinc-900/40': 'bg-card/40',
  'bg-zinc-900/30': 'bg-card/30',
  'border-zinc-900/50': 'border-border/50',
  'border-zinc-900/40': 'border-border/40',
  'border-zinc-800/80': 'border-border/80',
  'hover:border-zinc-700': 'hover:border-border',
  'hover:border-zinc-750': 'hover:border-border',
  'hover:text-zinc-200': 'hover:text-foreground',
  'hover:text-zinc-150': 'hover:text-foreground',
  'hover:bg-zinc-900': 'hover:bg-card',
  'hover:bg-zinc-800': 'hover:bg-muted'
};

for (const filePath of filesToProcess) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We want to replace whole words. Using a regex with boundaries.
  // But CSS classes can have slashes, so boundaries need to handle slashes.
  for (const [search, replace] of Object.entries(replacements)) {
    // Escape slash and dash for regex
    const escapedSearch = search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?<=\\s|['"\`])(${escapedSearch})(?=\\s|['"\`]|/)`, 'g');
    content = content.replace(regex, replace);
  }

  // Handle specific dynamic strings like text-zinc-[something] that might not be caught, just manually replace simple strings too as fallback
  for (const [search, replace] of Object.entries(replacements)) {
    content = content.split(search).join(replace);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`No changes needed in ${filePath}`);
  }
}

console.log('Theme refactor complete!');
