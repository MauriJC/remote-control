export const parseWatchUrl = (url: string) => {
  const urlObj = new URL(url);
  const searchParams = urlObj.searchParams;
  const videoId = searchParams.get("v");
  const time = searchParams.get("t");
  return {
    videoId,
    time: time ? parseInt(time) : undefined,
  };
};
