module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/admin");
  // Copy `img/favicon/` to `_site/`
  eleventyConfig.addPassthroughCopy({ "img": "/" });

  let markdownLibrary;
  eleventyConfig.amendLibrary("md", mdLib => {
    markdownLibrary = mdLib;
  });

  eleventyConfig.addFilter("markdown", content => {
    if (!content) return '';
    return markdownLibrary.render(String(content));
  });

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
