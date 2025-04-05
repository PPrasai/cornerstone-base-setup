## 🧪 React + TypeScript + Vite + Cornerstone3D Template

This template provides a minimal setup to get [Cornerstone3D](https://github.com/cornerstonejs/cornerstone3D) working with React and Vite. It includes several tools and libraries out of the box to speed up your development process.

### ✅ Features

- ⚛️ React with TypeScript and Vite
- 💨 Tailwind CSS configured
- 🧹 ESLint and Prettier setup
- 🧱 Cornerstone3D ecosystem pre-installed
- 📦 Example stack viewport with `LengthTool` and `StackScrollTool` enabled

---

### 🚀 Getting Started

To run the development server:

```bash
npm install
npm run dev
```

---

### ⚠️ dicomweb-client Compatibility Note

The latest version of `dicomweb-client` (`0.11.1`) contains a bug in the [`retrieveSeriesMetadata`](https://github.com/dcmjs-org/dicomweb-client/blob/9c3331fcc5b78db435bfc07a9d1ebc4253446f39/src/api.js#L1112) function, where it tries to access an undefined variable `withCredentails`.

To avoid this issue, we are using an older, stable version:

```json
"dicomweb-client": "0.10.4"
```

---

### ⚙️ Vite-Specific Considerations

This setup includes additional configuration to support the Cornerstone3D ecosystem, specifically:

- WASM decoders used internally by Cornerstone libraries
- CommonJS-based libraries like `dicom-parser` that require special handling in Vite

#### 🧩 Required Packages

```json
"dependencies": {
  "vite-plugin-wasm": "3.4.1"
},
"devDependencies": {
  "@rollup/plugin-commonjs": "28.0.3",
  "@rollup/plugin-wasm": "6.2.2",
  "@originjs/vite-plugin-commonjs": "1.0.3"
}
```

#### 🔧 Vite Config Snippet (`vite.config.ts`)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCommonjs from '@originjs/vite-plugin-commonjs'

export default defineConfig({
    plugins: [react(), viteCommonjs()],
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
})
```

---
