const forms = require('@tailwindcss/forms');
const typos = require('@tailwindcss/typography');

module.exports = {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {},
  },
  plugins: [forms, typos],
};
