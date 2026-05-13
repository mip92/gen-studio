import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { writeFileSync, createWriteStream, existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { buildKohyaConfig, TrainingConfigInput, BuiltConfig } from './config.builder';

const KOHYA_DIR    = process.env.KOHYA_DIR    ?? 'E:\\kohya_ss';
const KOHYA_PYTHON = process.env.KOHYA_PYTHON ?? path.join(KOHYA_DIR, 'venv', 'Scripts', 'python.exe');
const KOHYA_SCRIPT = process.env.KOHYA_SCRIPT ?? path.join(KOHYA_DIR, 'sd-scripts', 'sdxl_train_network.py');

export interface KohyaRunHandle {
  pid:        number;
  configPath: string;
  logPath:    string;
  outputLora: string;          // expected final .safetensors path
  done:       Promise<void>;
}

@Injectable()
export class TrainerService {
  private readonly logger = new Logger(TrainerService.name);

  /**
   * Materialise dataset.toml + spawn `accelerate launch sdxl_train_network.py`.
   * The returned promise resolves when the subprocess exits cleanly.
   */
  start(input: TrainingConfigInput, opts?: { onLog?: (line: string) => void }): KohyaRunHandle {
    if (!existsSync(KOHYA_PYTHON)) {
      throw new Error(`kohya python not found: ${KOHYA_PYTHON}. Set KOHYA_PYTHON env var.`);
    }
    if (!existsSync(KOHYA_SCRIPT)) {
      throw new Error(`kohya script not found: ${KOHYA_SCRIPT}. Set KOHYA_SCRIPT env var.`);
    }

    mkdirSync(input.outputDir, { recursive: true });
    const built: BuiltConfig = buildKohyaConfig(input);
    writeFileSync(built.datasetTomlPath, built.datasetTomlBody, 'utf-8');

    // Truncate train.log per run ('w' instead of 'a') — each kohya invocation
    // starts with a clean slate, so debugging a failure is easy and the file
    // doesn't grow unbounded across many trainings.
    const logPath = path.join(input.outputDir, 'train.log');
    const logStream = createWriteStream(logPath, { flags: 'w' });

    // Use python -m accelerate.commands.launch to avoid PATH issues with the
    // accelerate.exe shim inside the embedded venv. `-X utf8` forces Python's
    // UTF-8 mode so accelerate's print of "学習開始" doesn't crash with
    // UnicodeEncodeError on Russian Windows (default cp1251 console).
    const argv = [
      '-X', 'utf8',
      '-m', 'accelerate.commands.launch',
      '--num_cpu_threads_per_process', '4',
      KOHYA_SCRIPT,
      ...built.trainArgs,
    ];

    this.logger.log(`Launching kohya: ${KOHYA_PYTHON} ${argv.join(' ')}`);
    const proc = spawn(KOHYA_PYTHON, argv, {
      cwd: path.dirname(KOHYA_SCRIPT),
      stdio: ['ignore', 'pipe', 'pipe'],
      env:  {
        ...process.env,
        // Belt-and-suspenders UTF-8: PYTHONUTF8 propagates to accelerate's
        // child subprocess (where -X utf8 doesn't reach). Without this, kohya
        // crashes with `UnicodeEncodeError: 'charmap' codec can't encode …`
        // when accelerator.print() emits Japanese characters.
        PYTHONUTF8:              '1',
        PYTHONIOENCODING:        'utf-8',
        PYTORCH_CUDA_ALLOC_CONF: 'expandable_segments:True',
      },
    });

    const pump = (chunk: Buffer) => {
      const text = chunk.toString();
      logStream.write(text);
      opts?.onLog?.(text.trimEnd());
    };
    proc.stdout.on('data', pump);
    proc.stderr.on('data', pump);

    // Use 'close' (not 'exit') so stdout/stderr are fully drained before we
    // resolve. Otherwise tail-end stack traces from kohya can be lost — they
    // arrive AFTER 'exit' fires but BEFORE 'close', and the writeStream gets
    // ended too early.
    const done = new Promise<void>((resolve, reject) => {
      proc.on('error', (err) => { logStream.end(); reject(err); });
      proc.on('close', (code) => {
        logStream.end();
        if (code === 0) resolve();
        else reject(new Error(`kohya exited with code ${code} — see ${logPath}`));
      });
    });

    return {
      pid:        proc.pid ?? -1,
      configPath: built.datasetTomlPath,
      logPath,
      outputLora: path.join(input.outputDir, `${input.outputName}.safetensors`),
      done,
    };
  }
}
