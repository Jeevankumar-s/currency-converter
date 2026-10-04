module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['dist/**', '.expo/**', 'android/**', 'ios/**'],
  rules: { 'no-void': ['warn', { allowAsStatement: true }] },
};
