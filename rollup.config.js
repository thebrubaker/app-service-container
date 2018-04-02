import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import async from 'rollup-plugin-async';

export default [
	// browser-friendly UMD build
	{
		input: 'src/main.js',
		output: {
			name: 'AppServiceContainer',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			babel({
				babelrc: false,
				exclude: 'node_modules/**',
				presets: [
					'stage-2',
				],
			}),
			async(),			
			resolve(), // so Rollup can find `ms`
			commonjs(), // so Rollup can convert `ms` to an ES module
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify 
	// `file` and `format` for each target)
	{
		input: 'src/main.js',
		external: ['ms'],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
];