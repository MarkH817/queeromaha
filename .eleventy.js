module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  // Copy `img/favicon/` to `_site/`
  eleventyConfig.addPassthroughCopy({ img: "/" });

  let markdownLibrary;
  eleventyConfig.amendLibrary("md", (mdLib) => {
    // Add rel="noopener noreferrer" to external links
    const ext_link =
      mdLib.renderer.rules.link_open ||
      ((tokens, idx) => mdLib.utils.escapeHtml(tokens[idx].content));

    mdLib.renderer.rules.link_open = (tokens, idx, options, env, renderer) => {
      const token = tokens[idx];
      const href = token.attrGet("href");

      // Check if link is external
      if (href && !href.startsWith("/") && !href.startsWith("#")) {
        token.attrSet("rel", "noopener noreferrer");
      }

      return ext_link(tokens, idx, options, env, renderer);
    };

    markdownLibrary = mdLib;
  });

  eleventyConfig.addFilter("markdown", (content) => {
    if (!content) return "";
    return markdownLibrary.render(String(content));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};
