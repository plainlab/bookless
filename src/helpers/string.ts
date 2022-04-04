const numformatter = new Intl.NumberFormat('en-US');

export const pathToName = (pathname: string) =>
  pathname.split('\\').pop()?.split('/').pop();

export const truncate = (str: string, num = 60) => {
  if (str.length > num) {
    const remain = str.slice(0, num).split(' ');
    remain.pop();
    return `${remain.join(' ')}...`;
  }
  return str;
};

export const words = (str: string): string => {
  return str ? numformatter.format(str.split(' ').length) : '0';
};
