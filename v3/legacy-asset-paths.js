/* Keep the old portfolio's images in place when served from /v3/. */
(() => {
  const data = window.PORTFOLIO_DATA;
  if (!data) return;
  for (const collection of [data.assets, data.previews]) {
    for (const [key, value] of Object.entries(collection || {})) {
      if (typeof value === 'string' && value.startsWith('assets/')) collection[key] = '../' + value;
    }
  }
})();
