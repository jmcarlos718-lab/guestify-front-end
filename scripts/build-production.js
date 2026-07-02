process.env.CI = 'false';
process.env.DISABLE_ESLINT_PLUGIN = 'true';

require('react-scripts/scripts/build');
