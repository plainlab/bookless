import { spawn } from 'child_process';
import { dialog } from 'electron';
import { Result } from 'helpers/result';
import path from 'path';
import { JSON, Meta } from '../renderer/state/AppState';
import { bookConfigFile, loadConfig } from './config';

const exportFormats = [
  { name: 'PDF (pdf)', extensions: ['pdf'] },
  { name: 'EPUB (epub)', extensions: ['epub'] },
  { name: 'HTML (html)', extensions: ['html'] },
];

interface ExportOptions {
  dir: string;
  filename?: string;
  outputPath?: string;
}

interface Out {
  metadata?: Meta;
  output?: string;
  to?: string;
  standalone?: boolean;
  [key: string]: undefined | JSON;
}

const buildOut = (exp: ExportOptions): Out => {
  if (!exp.outputPath) {
    return {};
  }

  const out: Out = {};
  out.output = exp.outputPath;
  out.from = 'markdown+header_attributes+footnotes+tex_math_dollars';
  out.standalone = true;
  out['number-sections'] = true;
  out['top-level-division'] = 'chapter';
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
        args.push(val.toString());
      }
    }
  });

  return args;
};

const runFileExport = async (exp: ExportOptions): Promise<Result<string>> => {
  const out = buildOut(exp);

  // List of md files
  let inputFiles: string[] = [];
  if (exp.filename) {
    inputFiles = [path.join(exp.dir, exp.filename)];
  } else {
    const conf = await loadConfig(exp.dir);
    inputFiles = (conf.inputFiles as string[]).map((f) =>
      path.join(exp.dir, f)
    );
  }

  // Build command
  const cmd = 'pandoc';
  const args = toArgs(out).concat(...inputFiles);
  const cmdDebug = `${cmd} ${args
    .map((a) => (a.includes(' ') ? `'${a}'` : a))
    .join(' ')}`;
  let receivedError = false;

  const resultPromise = new Promise<Result<string>>((resolve) => {
    try {
      const pandoc = spawn(cmd, args);
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
