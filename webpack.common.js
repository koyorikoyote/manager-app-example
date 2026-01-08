const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/client/index.tsx',
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      'react-native': 'react-native-web',
      '@': path.resolve(__dirname, 'src'),
      '@/client': path.resolve(__dirname, 'src/client'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
    },
    // Exclude Prisma client from client-side bundle
    fallback: {
      '@prisma/client': false,
      'prisma': false,
    },
  },
  externals: {
    // Prevent Prisma from being bundled in client code
    '@prisma/client': 'commonjs @prisma/client',
    'prisma': 'commonjs prisma',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        router: {
          test: /[\\/]node_modules[\\/]react-router-dom[\\/]/,
          name: 'router',
          chunks: 'all',
          priority: 18,
        },
        ui: {
          test: /[\\/]src[\\/]client[\\/]components[\\/]ui[\\/]/,
          name: 'ui-components',
          chunks: 'all',
          priority: 15,
        },
        layout: {
          test: /[\\/]src[\\/]client[\\/]components[\\/]layout[\\/]/,
          name: 'layout-components',
          chunks: 'all',
          priority: 16,
        },
        pages: {
          test: /[\\/]src[\\/]client[\\/]components[\\/]pages[\\/]/,
          name: 'page-components',
          chunks: 'async',
          priority: 14,
        },
        contexts: {
          test: /[\\/]src[\\/]client[\\/]contexts[\\/]/,
          name: 'contexts',
          chunks: 'all',
          priority: 13,
        },
        shared: {
          test: /[\\/]src[\\/]shared[\\/]/,
          name: 'shared',
          chunks: 'all',
          priority: 12,
        },

        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    usedExports: true,
    sideEffects: false,
    // Enable module concatenation for better performance
    concatenateModules: true,
  },
};