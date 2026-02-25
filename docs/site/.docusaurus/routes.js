import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/',
    component: ComponentCreator('/docs/', 'd6e'),
    routes: [
      {
        path: '/docs/',
        component: ComponentCreator('/docs/', '3ab'),
        routes: [
          {
            path: '/docs/',
            component: ComponentCreator('/docs/', 'c4b'),
            routes: [
              {
                path: '/docs/coldlight/architecture',
                component: ComponentCreator('/docs/coldlight/architecture', '158'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/coldlight/inventory',
                component: ComponentCreator('/docs/coldlight/inventory', '2be'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/coldlight/overview',
                component: ComponentCreator('/docs/coldlight/overview', '0c0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/coldlight/primitives/',
                component: ComponentCreator('/docs/coldlight/primitives/', 'fa8'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/coldlight/primitives/contracts',
                component: ComponentCreator('/docs/coldlight/primitives/contracts', '787'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/coldlight/primitives/testing',
                component: ComponentCreator('/docs/coldlight/primitives/testing', 'c84'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/coldlight/recipes/',
                component: ComponentCreator('/docs/coldlight/recipes/', '469'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/coldlight/tokens/',
                component: ComponentCreator('/docs/coldlight/tokens/', '4d4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/platform/header-compliance',
                component: ComponentCreator('/docs/platform/header-compliance', '338'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/platform/namespaces',
                component: ComponentCreator('/docs/platform/namespaces', '241'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/sprints/',
                component: ComponentCreator('/docs/sprints/', '5ae'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', 'be8'),
                exact: true,
                sidebar: "docs"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
