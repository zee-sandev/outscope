/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make package boundaries hard to reason about.',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'packages-must-not-import-apps',
      severity: 'error',
      from: {
        path: '^packages/',
      },
      to: {
        path: '^(apps|examples|templates)/',
      },
    },
    {
      name: 'runtime-must-not-import-cli',
      severity: 'error',
      from: {
        path: '^packages/(nova|nova-fn)/',
      },
      to: {
        path: '^packages/cli/',
      },
    },
    {
      name: 'cli-must-not-import-package-internals',
      severity: 'error',
      from: {
        path: '^packages/cli/',
      },
      to: {
        path: '^packages/(nova|nova-fn)/src/',
      },
    },
    {
      name: 'no-generated-or-build-output-imports',
      severity: 'error',
      from: {},
      to: {
        path: '(^|/)(dist|node_modules|generated)(/|$)',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    exclude: {
      path: '(^|/)(dist|node_modules|\\.git)(/|$)',
    },
    tsPreCompilationDeps: false,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'types', 'node', 'default'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },
  },
}
