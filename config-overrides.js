const path = require('path')

module.exports = {
    paths: function (paths, env) {
        paths.appSrc = path.resolve(__dirname, 'web/src')
        paths.appPublic = path.resolve(__dirname, 'web/public')
        paths.appHtml = path.resolve(__dirname, 'web/public/index.html')
        paths.appIndexJs = path.resolve(__dirname, 'web/src/index.tsx')
        paths.appBuild = path.resolve(__dirname, 'build/web')
        return paths
    },
    override: function (config) {
        config.resolve = {
            ...config.resolve,
            alias: {
                ...config.alias,
                'src': path.resolve(__dirname, 'web/src')
            },
        };

        return config;
    }
}
