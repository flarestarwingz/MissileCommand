const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'missile-command.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'MissileCommand',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, '.'),
    },
    compress: true,
    port: 8080,
    hot: true,
    open: true,
  },
};
