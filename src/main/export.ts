import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { dialog } from 'electron';
import { Result } from 'helpers/result';
import { extname } from 'path';
import { JSON, Meta } from '../renderer/state/AppState';
import { loadConfig } from './config';
import { loadFile } from './file';

const exportFormats = [
  { name: 'PDF (pdf)', extensions: ['pdf'] },
  { name: 'EPUB (epub)', extensions: ['epub'] },
  { name: 'HTML (html)', extensions: ['html'] },
];

interface ExportOptions {
  dir: string;
  filename?: string;
  outputPath?: string;
  spawnOpts?: SpawnOptionsWithoutStdio;
}

interface Out {
  metadata?: Meta;
  output?: string;
  to?: string;
  standalone?: boolean;
  [key: string]: undefined | JSON;
}

const validate = (bookMeta: Meta, outputPath?: string): Out => {
  let toFormat: string;
  if (outputPath) {
    toFormat = extname(outputPath);
    if (toFormat && toFormat[0] === '.') {
      toFormat = toFormat.substring(1);
    }
    if (toFormat === 'tex') {
      toFormat = 'latex';
    }
  } else {
    return {};
  }

  const jsonToObj = (m: JSON): Meta =>
    m && typeof m === 'object' && !Array.isArray(m) ? m : {};

  const extractOut = (meta: Meta) =>
    meta?.output &&
    typeof meta.output === 'object' &&
    !Array.isArray(meta.output)
      ? jsonToObj(meta.output[toFormat])
      : {};
  const out: Out = { ...extractOut(bookMeta) };

  if (typeof out.metadata !== 'object') {
    out.metadata = {};
  }
  if (bookMeta.mainfont === undefined) {
    out.metadata.mainfont =
      '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
  }
  if (bookMeta.monobackgroundcolor === undefined) {
    out.metadata.monobackgroundcolor = '#f0f0f0';
  }

  if (outputPath) {
    out.output = outputPath;
  }

  out.standalone = true;
  return out;
};

// constructs CLI arguments from object
const toArgs = (out: Out) => {
  const args: string[] = [];

  Object.keys(out).forEach((opt) => {
    const val = out[opt];
    if (Array.isArray(val)) {
      val.forEach((v) => {
        if (typeof v === 'string') {
          args.push(`--${opt}`);
          args.push(v);
        }
      });
    } else if (val && typeof val === 'object') {
      Object.keys(val).forEach((k) => {
        args.push(`--${opt}`);
        args.push(`${k}=${val[k]}`);
      });
    } else if (val !== false) {
      args.push(`--${opt}`);
      if (val && val !== true) {
        // pandoc boolean options don't take a value
        args.push(val.toString());
      }
    }
  });

  return args;
};

const runFileExport = async (exp: ExportOptions): Promise<Result<string>> => {
  const docMeta = await loadConfig(exp.dir);
  const out = validate(docMeta, exp.outputPath);

  const cmd = 'pandoc';
  const args = toArgs(out);
  const cmdDebug = `${cmd} ${args
    .map((a) => (a.includes(' ') ? `'${a}'` : a))
    .join(' ')}`;
  let receivedError = false;

  let content = '# TODO: Render multiple MD';
  if (exp.filename) {
    const doc = await loadFile(exp.dir, exp.filename);
    content = doc?.md || '';
  }

  const resultPromise = new Promise<Result<string>>((resolve) => {
    try {
      const pandoc = spawn(cmd, args, exp.spawnOpts);
      pandoc.stdin.write(content);
      pandoc.stdin.end();

      pandoc.on('error', (err) => {
        receivedError = true;
        dialog.showMessageBox({
          type: 'error',
          message: 'Failed to call pandoc',
          detail: `Make sure you have it installed, see pandoc.org/installing

Failed to execute command:
${cmdDebug}

${err.message}`,
        });
      });

      const errout: string[] = [];
      pandoc.stderr.on('data', (data) => {
        errout.push(data.toString('utf8'));
      });

      pandoc.on('close', (exitCode) => {
        const success = exitCode === 0;
        const toMsg = `Called: ${cmdDebug}`;
        if (!receivedError) {
          const detail = [toMsg, ''].concat(errout.join('')).join('\n');
          if (success) {
            resolve(detail);
          } else {
            resolve({ error: detail });
          }
        }
      });
    } catch (e) {
      resolve({ error: `Failed to spawn pandoc ${e}` });
    }
  });
  return resultPromise;
};

const fileExport = async (exp: ExportOptions) => {
  const detail = await runFileExport(exp);

  const success = typeof detail === 'string';
  dialog.showMessageBox({
    type: success ? 'info' : 'error',
    message: success ? 'Success!' : 'Failed to export',
    detail: success ? detail : detail.error,
    buttons: ['OK'],
  });
};

const exportDialog = async (dir: string, filename?: string) => {
  const spawnOpts: SpawnOptionsWithoutStdio = {};

  const res = await dialog.showSaveDialog({
    defaultPath: dir,
    buttonLabel: 'Export',
    filters: exportFormats,
  });

  const outputPath = res.filePath;
  if (outputPath) {
    const exp = {
      dir,
      filename,
      outputPath,
      spawnOpts,
    };
    await fileExport(exp);
  }
};

export const chapExportDialog = async (dir: string, filename: string) => {
  return exportDialog(dir, filename);
};

export const bookExportDialog = async (dir: string) => {
  return exportDialog(dir);
};
