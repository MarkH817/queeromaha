module.exports = {
  eleventyComputed: {
    eleventyExcludeFromCollections: (data) => data.public === false,
    permalink: (data) => {
      if (data.public === false) return false
      if (data.permalink === false) return false
      if (data.permalink) return data.permalink
    },
  },
}
