import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';

export function runWorker<T = any>(scriptRelPath: string, payload: any, timeoutMs = 30000, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const workerPath = path.join(__dirname, scriptRelPath);

    const worker = new Worker(workerPath, { workerData: payload });

    let settled = false;
    let timer: NodeJS.Timeout | undefined;

    function settle(fn: () => void) {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      fn();
    }

    if (timeoutMs) {
      timer = setTimeout(() => {
        worker.terminate();
        settle(() => reject(new Error('Worker timeout')));
      }, timeoutMs);
    }

    if (signal) {
      signal.addEventListener('abort', () => {
        worker.terminate();
        settle(() => reject(new Error('Worker aborted')));
      });
    }

    worker.on('message', (msg) => {
      settle(() => resolve(msg as T));
    });
    worker.on('error', (err) => {
      settle(() => reject(err));
    });
    worker.on('exit', (code) => {
      if (code === 0) {
        // Worker completed cleanly without sending a message — resolve with undefined
        settle(() => resolve(undefined as unknown as T));
      } else {
        settle(() => reject(new Error(`Worker exited with code ${code}`)));
      }
    });
  });
}
