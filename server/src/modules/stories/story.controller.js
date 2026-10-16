const webstoryController = require('../posts/webstory.controller');
const { notifyAllIndexing } = require('../../shared/utils/google-indexing');

module.exports = {
  ...webstoryController,
  notifyAllIndexing
};
