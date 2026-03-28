import type { Config } from 'tailwindcss';
import nativewind from 'nativewind/preset';

const config: Config = {
  presets: [nativewind],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
