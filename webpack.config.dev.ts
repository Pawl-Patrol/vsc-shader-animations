import * as HtmlWebpackPlugin from "html-webpack-plugin";
import { join, resolve } from "path";
import type { Configuration } from "webpack";
import "webpack-dev-server";

export default {
  target: "web",
  mode: "development",
  entry: "./src/devserver/main.ts",
  output: {
    path: resolve(__dirname, "dist"),
    filename: "devserver.bundle.js",
  },
  devServer: {
    static: {
      directory: join(__dirname, "public"),
    },
    compress: true,
    port: 9000,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: resolve(__dirname, "tsconfig.script.json"),
            },
          },
        ],
      },
      {
        test: /\.wgsl$/,
        type: "asset/source",
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: "asset/inline",
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: join(__dirname, "index.html"),
    }),
  ],
  devtool: "source-map",
} as Configuration;
