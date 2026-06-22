/**
 * Background effect registry. To add an effect: create a component file in this
 * folder that takes an `options` prop, then add one entry here. The settings
 * panel and effect layer pick it up automatically.
 */
import { EFFECT } from '@/core/constants.js';
import Starfield from './starfield.jsx';
import Rain from './rain.jsx';

const EFFECTS = {
  [EFFECT.STARFIELD]: { label: 'Space stars', component: Starfield, defaults: { density: 0.6, speed: 1 } },
  [EFFECT.RAIN]: { label: 'Rain', component: Rain, defaults: { density: 0.6, speed: 1 } },
};

export function getEffect(type) {
  return EFFECTS[type] || null;
}

export function listEffects() {
  return Object.entries(EFFECTS).map(([key, value]) => ({ key, label: value.label }));
}
