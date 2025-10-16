// Minimal multer shim used only when multer is not installed.
// This shim provides diskStorage and a multer factory with a .single() method
// that returns a no-op middleware. It's intended only to keep the server running
// during development when the real multer cannot be installed; it does NOT
// process multipart uploads.
module.exports = function () {
  return {
    single: function (_fieldName) {
      return function (_req, _res, next) {
        // do nothing - no file parsing
        next();
      };
    },
  };
};

module.exports.diskStorage = function (opts) {
  // return a dummy storage object; the real multer.diskStorage uses callbacks
  return {
    _opts: opts,
  };
};

module.exports.memoryStorage = function () {
  return {};
};
