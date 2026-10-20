// The shared query cache (services/cache/queryCache.ts) lives for the whole JS
// process, like in the app: without this, data one test loaded would be the
// cached answer for the next test in the same file. Cleared before each test
// (not after), when nothing from the previous test is mounted any more.
const { clearQueryCache } = require('./services/cache/queryCache');

beforeEach(() => {
  void clearQueryCache();
});
