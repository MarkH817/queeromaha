module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  
  // Strip HTML comments from output
  eleventyConfig.addTransform("stripComments", function(content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      return content.replace(/<!--[\s\S]*?-->/g, "");
    }
    return content;
  });
  
  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
