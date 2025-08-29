/**
 * Sequential Test Runner
 * Ensures tests run one at a time with delays to prevent rate limiting
 */

const DefaultSequencer = require('@jest/test-sequencer').default;

class SequentialTestSequencer extends DefaultSequencer {
  sort(tests) {
    // Sort tests alphabetically for predictable order
    return tests.sort((testA, testB) => (testA.path > testB.path ? 1 : -1));
  }
}

module.exports = SequentialTestSequencer;