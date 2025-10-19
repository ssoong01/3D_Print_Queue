import path from 'path';
import { fileURLToPath } from 'url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_PORT = process.env.WEB_PORT || 8080;
const API_PORT = process.env.API_PORT || 3000;

export default {
  mode: 'development',
  entry: './src/client/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/client'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.css'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      inject: 'body'
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    port: WEB_PORT,
    hot: true,
    open: true,
    proxy: [{
      context: ['/api', '/uploads'],  // Added /uploads to proxy
      target: `http://localhost:${API_PORT}`,
      secure: false,
      changeOrigin: true
    }]
  },
};