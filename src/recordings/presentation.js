const SIZES = {
  blocks: { width: 1600, height: 1200 },
  "simulator-frame": { width: 1600, height: 1120 },
  "simulator-screen": { width: 1600, height: 900 },
};

export function getPresentationSize(layout = "simulator-frame") {
  if (!Object.hasOwn(SIZES, layout))
    throw new RangeError(`Unknown presentation layout: ${layout}`);
  return { ...SIZES[layout] };
}

/** Same-origin assets keep the shared preview/export canvas readable. */
export async function loadPresentationAssets(baseUrl = "./") {
  const root = new URL(baseUrl, document.baseURI);
  const load = (path) =>
    new Promise((resolve) => {
      const url = new URL(path, root);
      if (url.origin !== new URL(document.baseURI).origin) {
        resolve(null);
        return;
      }
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = url.href;
    });
  const [logo, wordmark] = await Promise.all([
    load("images/fresenius-kabi-logo.png"),
    load("images/conox-wordmark.png"),
  ]);
  return { logo, wordmark };
}
