// Manual mock for @expo/vector-icons, auto-applied by Jest for this node_module.
//
// The real package pulls in `expo-font` at import time (via its lazy icon-set
// barrel). `expo-font` isn't installed in this project, so any test that renders
// a component importing an icon set (components/ui/icon.tsx, ActiveChallengeSection,
// the Home screen, …) would fail to even load the module. This stub replaces every
// icon set (Ionicons, AntDesign, …) with a no-op component so those tests can run
// without the native font dependency.
const React = require('react');

function createMockIconSet(name) {
  const MockIcon = (props) => React.createElement(name, props, props && props.children);
  MockIcon.glyphMap = {};
  MockIcon.font = {};
  MockIcon.loadFont = () => Promise.resolve();
  return MockIcon;
}

module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      return createMockIconSet(typeof prop === 'string' ? prop : 'Icon');
    },
  },
);
