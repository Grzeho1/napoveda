export {};

export function renumberSections(
    entries: [string, { label: string; content: string; parent?: string }][],
    parentId: string | undefined,
    prefix: string = "",
    level: number = 1
  ) {
    if (level > 2) return;
    const siblings = entries
      .filter(([_, s]) => s.parent === parentId)
      .sort((a, b) =>
        a[1].label.localeCompare(b[1].label, undefined, { numeric: true })
      );
  
    let counter = 1;
    for (const [id, section] of siblings) {
      const newPrefix = prefix ? `${prefix}.${counter}` : `${counter}`;
      section.label = `${newPrefix} ${section.label.replace(/^[\d\.]+\s/, "")}`;
      renumberSections(entries, id, newPrefix, level + 1);
      counter++;
    }
  }
  