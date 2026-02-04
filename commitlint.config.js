module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting, no code change
        'refactor', // Code change, no feature/fix
        'perf',     // Performance improvement
        'test',     // Adding tests
        'chore',    // Maintenance
        'ci',       // CI/CD changes
        'build',    // Build system changes
        'revert',   // Revert previous commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        // Core
        'engine',
        'maestro',
        'desktop',
        
        // Design System
        'coldlight',
        'primitives',
        'tokens',
        'recipes',
        'taxonomy',
        
        // Hubs
        'devpulse',
        'devforge',
        'wiredfront',
        'overmind',
        'ui-demo',
        'pixvix',

        // Domains
        'chat',
        
        // Infrastructure
        'xtask',
        'ci',
        'deps',
        'config',
        'lab',
        
        // Docs
        'docs',
        'changelog',
      ],
    ],
    'scope-empty': [1, 'never'],  // Warn on missing scope
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
};
