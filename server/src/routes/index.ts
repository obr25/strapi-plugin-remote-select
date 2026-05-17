export default {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'POST',
        path: '/options-proxy',
        handler: 'FetchOptionsProxyController.index',
        config: {
          policies: [],
        },
      },
    ],
  },
  'content-api': {
    type: 'content-api',
    routes: [],
  },
};
