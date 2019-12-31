import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';
import {terser} from 'rollup-plugin-terser';

const env = process.env.NODE_ENV;

export default {
  input: 'src/index.js',
  output: {
    name: pkg.name,
    file: {
      es: pkg.module,
      cjs: pkg.main,
      umd: `umd/${pkg.name}.js`,
    }[env],
    format: env,
    exports: 'named', /** Disable warning for default imports */
    sourcemap: true,
  },
  external: pkg.dependencies,
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**',
      // plugins: ['@babel/plugin-external-helpers'],
      // if external helpers true then use global babel object
      // externalHelpers: true
    }),
    commonjs(),
    terser(),
    filesize(),
  ].filter(Boolean)
}; 
