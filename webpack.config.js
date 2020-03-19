const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const FindReplacePlugin = require('find-replace-webpack-plugin');

const src = './src/';
const isProduction = process.env.NODE_ENV === 'production';

let version = require('./package.json').version;

var replaceRules = [
    {
        find: /X\.X\.X/g,
        replace(stats, match, name, dothash, hash, ext) {
            return version;
        }
    }
];


let plugins = [
    new CopyPlugin([
            {from: '.', to: '../'}
        ],
        {context: 'public'}
    ),
    new (FindReplacePlugin)({
        src: 'dist/manifest.json',
        dest: 'dist/manifest.json',
        rules: replaceRules
    })
];

if (!isProduction) {
    plugins.push(new ChromeExtensionReloader({
        port: 8081,
        reloadPage: true,
        entries: {
            contentScript: ["marker-content-script", "printful-content-script", "fulfillomat-content-script"],
            background: "background"
        }
    }));
}

module.exports = {
    mode: isProduction ? "production" : "development",
    entry: {
        'background': path.join(__dirname, src + 'background.ts'),

        'content': path.join(__dirname, src + 'content.ts'),
        'content-style': path.join(__dirname, src + 'content.scss'),

        'popup': path.join(__dirname, src + 'popup.ts'),
        'popup-style': path.join(__dirname, src + 'popup.scss'),
    },
    output: {
        path: path.join(__dirname, './dist/js'),
        filename: '[name].js'
    },
    optimization: {
        splitChunks: {
            name: 'vendor',
            chunks: "initial"
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].css',
                            outputPath: '../css/'
                        }
                    },
                    {
                        loader: 'extract-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    plugins: plugins
};
