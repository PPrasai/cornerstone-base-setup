# React + TypeScript + Vite + Cornerstone3D

This template provides a minimal setup to get Cornerstone3D and React working with Vite. Following are some things right out of the box:

- Tailwind is setup
- ESLint and Prettier are setup
- Cornerstone3D ecosystem of libraries are installed
- an example stack viewport with length tool and stack scroll tools activated

**Run the app with `npm run dev`**

`dicomweb-client`'s latest version (0.11.1) has a bug on the [dicomweb-client/src/api.js > retrieveSeriesMetadata](https://github.com/dcmjs-org/dicomweb-client/blob/9c3331fcc5b78db435bfc07a9d1ebc4253446f39/src/api.js#L1112) function, where it tries to access a `withCredentails` variable, which is not in the scope.
Due to this issue, we're using an older version (0.10.4) for the package.

## Things to consider for Vite

The configuration is mostly standard Vite + React setup, with specific accommodations for:

- WASM decoders used by Cornerstone libraries
- DICOM parser which currently uses CommonJS format

Follwing are the addition packages and configuration needed to make this work with Vite

`package.json`

```
"dependencies": {
  "vite-plugin-wasm": "3.4.1"
},
"devDependencies": {
  "@rollup/plugin-commonjs": "28.0.3",
  "@rollup/plugin-wasm": "6.2.2",
  "@originjs/vite-plugin-commonjs": "1.0.3",
}
```

Following configurations are needed because of the reasons mentioned above:

`vite.config.ts`

```
plugins: [
    ...
    viteCommonjs(),
],
optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader'],
    include: ['dicom-parser'],
},
worker: {
    format: 'es',
    rollupOptions: {
        external: ['@icr/polyseg-wasm'],
    },
},
```
