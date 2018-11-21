const path = require("path");
const merge = require("webpack-merge");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = env => {
    const isProduction = env === "production";
    const tsconfig = isProduction
        ? "tsconfig.prod.json"
        : "tsconfig.dev.json";

    return merge({
        entry: { main: "./src/index.ts" },
        resolve: { extensions: [".ts", ".tsx", ".js"] },
        module: {
            rules: [{ 
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: { 
                    configFile: tsconfig,
                },
            }]
        },
        plugins: [ new CleanWebpackPlugin(["dist"]) ],
        output: {
            filename: "[name].bundle.js",
            path: path.resolve(__dirname, "dist"),
            library: "[name]",
            // https://github.com/webpack/webpack/issues/5767
            // https://github.com/webpack/webpack/issues/7939            
            devtoolNamespace: "json-sink",
            libraryTarget: "umd",
            // https://github.com/webpack/webpack/issues/6677
            globalObject: "typeof self !== 'undefined' ? self : this"
        },
        node: {
            fs: "empty",
            dgram: "empty",
            net: "empty",
            tls: "empty"
        }
    }, isProduction
        ? require("./webpack.prod")
        : require("./webpack.dev"));
};