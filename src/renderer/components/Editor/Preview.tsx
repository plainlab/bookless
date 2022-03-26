/* eslint-disable react/no-danger */
import convertMd from 'renderer/export/convertMd';
import { AppStateProps } from 'renderer/state/reducer';

const Preview = (props: AppStateProps) => {
  const { state } = props;
  return (
    <main className="absolute inset-0 p-20 overflow-auto">
      <div
        className="relative prose"
        dangerouslySetInnerHTML={{ __html: convertMd(state.doc) }}
      />
    </main>
  );
};

export default Preview;
