/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';

if (typeof (global as any).Worker === 'undefined') {
    (global as any).Worker = class {
        constructor(_scriptUrl: string, _options?: any) {}
        postMessage(_message?: any): void {}
        terminate(): void {}
        addEventListener(_type: string, _listener: any): void {}
        removeEventListener(_type: string, _listener: any): void {}
    };
}

if (typeof global.WebGLRenderingContext === 'undefined') {
    (global as any).WebGLRenderingContext = class {};
    (global as any).WebGL2RenderingContext = class {};
}
