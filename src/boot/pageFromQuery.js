// Copy ?page=<name> into #root[data-page] so existing router can see it
(function () {
  try {
    const p = new URLSearchParams(location.search).get("page");
    if (!p) return;
    const root = document.getElementById("root");
    if (root) root.setAttribute("data-page", p);
  } catch (e) {
    console.warn("pageFromQuery bootstrap failed", e);
  }
})();
