import fs from 'fs';
import path from 'path';

export interface ChangelogEntry {
  date: string;
  sections: {
    title: string;
    items: string[];
  }[];
}

export function parseChangelog(): ChangelogEntry[] {
  const changelogPath = path.join(process.cwd(), 'docs', 'project-log', 'CHANGELOG.md');

  try {
    const content = fs.readFileSync(changelogPath, 'utf-8');
    return parseChangelogContent(content);
  } catch {
    return [];
  }
}

function parseChangelogContent(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = content.split('\n');

  let currentEntry: ChangelogEntry | null = null;
  let currentSection: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    // Match date headers like "## 2025-12-03"
    const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      if (currentEntry) {
        if (currentSection) {
          currentEntry.sections.push(currentSection);
        }
        entries.push(currentEntry);
      }
      currentEntry = {
        date: dateMatch[1],
        sections: [],
      };
      currentSection = null;
      continue;
    }

    // Match section headers like "### Added"
    const sectionMatch = line.match(/^### (.+)/);
    if (sectionMatch && currentEntry) {
      if (currentSection) {
        currentEntry.sections.push(currentSection);
      }
      currentSection = {
        title: sectionMatch[1],
        items: [],
      };
      continue;
    }

    // Match list items like "- Something"
    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && currentSection) {
      currentSection.items.push(itemMatch[1]);
      continue;
    }

    // Match indented list items like "  - Sub item"
    const subItemMatch = line.match(/^  - (.+)/);
    if (subItemMatch && currentSection && currentSection.items.length > 0) {
      // Append to last item as a sub-item
      const lastItem = currentSection.items[currentSection.items.length - 1];
      currentSection.items[currentSection.items.length - 1] = lastItem + ' | ' + subItemMatch[1];
    }
  }

  // Don't forget the last entry
  if (currentEntry) {
    if (currentSection) {
      currentEntry.sections.push(currentSection);
    }
    entries.push(currentEntry);
  }

  return entries;
}

export function getRecentChanges(limit: number = 3): ChangelogEntry[] {
  return parseChangelog().slice(0, limit);
}
