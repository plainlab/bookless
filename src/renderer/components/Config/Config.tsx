/* eslint-disable react/jsx-props-no-spreading */
import classNames from 'classnames';
import { IoChevronBackOutline } from 'react-icons/io5';
import { ConfigKey } from 'renderer/state/AppState';
import { AppStateProps } from 'renderer/state/reducer';

type Kv = StringI | Textarea | NumberI | Select;

interface BaseKv {
  name: string;
  label: string;
  disabled?: boolean;
  placeholder?: string;
  onLoad?: (v: string) => string;
  onDone?: (v: string) => string;
}

interface StringI extends BaseKv {
  type: 'string';
}
interface Textarea extends BaseKv {
  type: 'textarea';
}
interface NumberI extends BaseKv {
  type: 'number';
  step: number;
}
interface Select extends BaseKv {
  type: 'select';
  options: string[];
}

const stripSurroundingStyleTags = (s: string): string =>
  s.startsWith('<style>\n') && s.endsWith('\n</style>') ? s.slice(8, -9) : s;

const renderOption = (o: string) => (
  <option key={o} value={o || 'System font, sans-serif'}>
    {o}
  </option>
);

const metaKvs: Kv[] = [
  {
    name: ConfigKey.inputFiles,
    label: 'Book chapters',
    type: 'textarea',
    disabled: true,
    onLoad: (c) => c.split(',').join('\n'),
  },
  {
    name: ConfigKey.title,
    label: 'Title',
    type: 'string',
  },
  {
    name: ConfigKey.author,
    label: 'Author',
    type: 'string',
  },
  {
    name: ConfigKey.date,
    label: 'Date',
    type: 'string',
  },
  {
    name: ConfigKey.lang,
    label: 'Language',
    type: 'string',
    placeholder: 'en',
  },
];

const layoutKvs: Kv[] = [
  {
    name: ConfigKey.fontFamily,
    label: 'Font family',
    type: 'string',
    placeholder: 'mathpazo',
  },
  {
    name: ConfigKey.fontSize,
    label: 'Font size (px)',
    type: 'number',
    step: 1,
    onLoad: (s) => (s ? parseInt(s, 10).toString() : ''),
    onDone: (s) => `${s}px`,
  },
  {
    name: ConfigKey.lineHeight,
    label: 'Line height',
    type: 'number',
    step: 0.1,
  },
  {
    name: ConfigKey.headerIncludes,
    label: 'Include CSS',
    type: 'textarea',
    onLoad: stripSurroundingStyleTags,
    onDone: (s) => `<style>\n${s}\n</style>`,
    placeholder: `blockquote {
  font-style: italic;
}`,
  },
];

const ConfigEditor = (props: AppStateProps) => {
  const { state, dispatch } = props;
  const { config } = state;

  const renderInput = (kv: Kv): JSX.Element => {
    const { onLoad, onDone, placeholder } = kv;
    const key = kv.name;
    const val = config[key]?.toString() || '';
    const value = onLoad ? onLoad(val) : val;
    const inputClasses = classNames({
      'w-full rounded disabled:cursor-not-allowed disabled:opacity-50': true,
    });
    const onChange = (
      e:
        | string
        | React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          >
    ) => {
      const v = typeof e === 'string' ? e : e.target.value;
      dispatch({
        type: 'updateConfig',
        config: {
          [ConfigKey.currentDir]: state.dir,
          [key]: onDone ? onDone(v) : v,
        },
      });
    };
    const common = {
      id: kv.name,
      placeholder,
      value,
      onChange,
      disabled: kv.disabled,
    };
    switch (kv.type) {
      case 'textarea':
        return <textarea {...common} className={inputClasses} />;
      case 'number':
        return (
          <input
            {...common}
            type="number"
            step={kv.step}
            className={inputClasses}
          />
        );
      case 'select':
        return (
          <select {...common} className={inputClasses}>
            {kv.options.map(renderOption)}
          </select>
        );
      case 'string':
      default:
        return <input {...common} type="text" className={inputClasses} />;
    }
  };

  const renderKv = (kv: Kv) => (
    <div key={kv.name} className="max-w-3xl mx-auto">
      <label htmlFor={kv.name}>{kv.label}:</label>
      {renderInput(kv)}
    </div>
  );

  return (
    <div className="flex flex-1 text-xs">
      <IoChevronBackOutline
        onClick={() => dispatch({ type: 'toggleConfig' })}
        className="w-5 h-5 m-4 cursor-pointer hover:opacity-100 opacity-70"
      />
      <div className="flex-1 px-4 py-20 space-y-4 overflow-x-hidden overflow-y-auto">
        {metaKvs.map(renderKv)}
        {layoutKvs.map(renderKv)}
      </div>
    </div>
  );
};

export default ConfigEditor;
