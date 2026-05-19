module.exports = {
  eleventyComputed: {
    eleventyExcludeFromCollections: data => data.public === false,
    permalink: data => {
      if (data.public === false) return false;
      // preserve explicit permalink: false set by directory data files
      if (data.permalink === false) return false;
    }
  }
};
