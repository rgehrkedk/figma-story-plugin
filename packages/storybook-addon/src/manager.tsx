// Storybook addon manager for figma-story-plugin

import React from 'react';
import { addons, types } from '@storybook/manager-api';
import { AddonPanel } from '@storybook/components';

const ADDON_ID = 'figma-story-plugin';
const PANEL_ID = `${ADDON_ID}/panel`;

const FigmaPanel: React.FC = () => {
  return (
    <AddonPanel active>
      <div style={{ padding: 16 }}>
        <h3>Figma Variables Sync</h3>
        <p>Token extraction and synchronization panel.</p>
        {/* TODO: Implement token extraction UI */}
      </div>
    </AddonPanel>
  );
};

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Figma Sync',
    render: ({ active }) => (
      <AddonPanel active={active}>
        <FigmaPanel />
      </AddonPanel>
    ),
  });
});