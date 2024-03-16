const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const package = require("./package.json");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: "./src/snake.js",
  output: {
    filename: "snake.min.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
      version: package.version,
      title: package.displayName,
      description: package.description,
    }),
    new MiniCssExtractPlugin({
      filename: "snake.min.css",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
};
