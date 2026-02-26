import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
export function runWorker(scriptRelPath, payload, timeoutMs = 30000, signal) {
    return new Promise((resolve, reject) => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const workerPath = path.join(__dirname, scriptRelPath);
        const worker = new Worker(workerPath, { workerData: payload });
        let timer;
        if (timeoutMs) {
            timer = setTimeout(() => {
                worker.terminate();
                reject(new Error('Worker timeout'));
            }, timeoutMs);
        }
        if (signal) {
            signal.addEventListener('abort', () => {
                worker.terminate();
                reject(new Error('Worker aborted'));
            });
        }
        worker.on('message', (msg) => {
            if (timer)
                clearTimeout(timer);
            resolve(msg);
        });
        worker.on('error', (err) => {
            if (timer)
                clearTimeout(timer);
            reject(err);
        });
        worker.on('exit', (code) => {
            if (code !== 0)
                reject(new Error(`Worker exit code ${code}`));
        });
    });
}
