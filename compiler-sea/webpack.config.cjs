const webpack = require('webpack');
const {resolve} = require('path');
const nodeExternals = require('webpack-node-externals');
const os = require("os");

module.exports = {
    entry: "./src/mindar-compile.cjs",
    output: {
        filename: `compiler.bundle.cjs`,
        path: resolve(__dirname, 'dist', 'bundle'),
        clean: true,
    },
    target: 'node',
    mode: 'production',
    node: {
        __dirname: false,
    },
    plugins: [
        // bundle everything into single file
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
        }),
    ],
    module: {
        rules: [
            {
                parser: {
                    amd: false,
                },
                test: /\.node$/,
                use: [
                    {
                        loader: "@vercel/webpack-asset-relocator-loader",
                        options: {
                            name: "[name].[ext]",
                            flags: os.constants.dlopen.RTLD_NOW,
                        },
                    }
                ],
            },
        ],
    },
    externalsPresets: {
        node: true,
    },
    externals: [nodeExternals()],
};