import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';

export default [
  // UMD single-file bundle
  {
    input: 'src/loader.js',           // single entry only
    plugins: [ resolve(), commonjs(), postcss({ inject: true, minimize: true }) ],
    output: {
      file: 'lib/video-note-taking.umd.js',
      format: 'umd',
      name: 'VideoNoteTaking',
      sourcemap: true,
      inlineDynamicImports: true     // force single-file by inlining dynamic imports
    }
  },
  // ESM bundle (single file)
  {
    input: 'src/loader.js',
    plugins: [ resolve(), commonjs(), postcss({ extract: false }) ],
    output: {
      file: 'lib/video-note-taking.esm.js',
      format: 'es',
      sourcemap: true,
      inlineDynamicImports: true
    }
  }
];
