export const pathToName = (pathname: string) =>
  pathname.split('\\').pop()?.split('/').pop();

export const truncate = (str: string, num = 60) => {
  if (str.length > num) {
    return `${str.slice(0, num)}...`;
  }
  return str;
};
