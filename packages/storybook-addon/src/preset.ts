// Storybook preset for figma-story-plugin

export function config(entry: string[] = []) {
  return [...entry, require.resolve('./manager')];
}

export function managerEntries(entry: string[] = []) {
  return [...entry, require.resolve('./manager')];
}