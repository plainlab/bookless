/* eslint-disable react/no-danger */
import convertMd from 'renderer/export/convertMd';
import { AppStateProps } from 'renderer/state/reducer';

import 'katex/dist/katex.min.css';

const interceptClicks = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
  e.preventDefault();
  if (e.target && 'href' in e.target) {
    const target = e.target as HTMLAnchorElement;
    const { href } = target;
    const hrefStart = href.substring(0, 7);
    if (hrefStart === 'http://' || hrefStart === 'https:/') {
      if (window.ipcAPI) {
        window.ipcAPI.send.openLink(href);
      } else {
        window.open(href, '_blank');
      }
    }
  }
  return false;
};

const Preview = (props: AppStateProps) => {
  const { state } = props;
  return (
    <main
      className="absolute inset-0 p-20 overflow-auto"
      onClick={(e) => interceptClicks(e)}
      role="presentation"
    >
      <div
        className="relative max-w-2xl mx-auto prose"
        dangerouslySetInnerHTML={{ __html: convertMd(state.doc) }}
      />
    </main>
  );
};

export default Preview;
