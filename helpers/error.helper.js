class ProjectError extends Error {
  constructor(message) {
    super(message);

    let _status = 0;
    let _data = {};

    this.getStatusCode = function () {
      return _status;
    };

    this.setStatusCode = function (code) {
      _status = code;
    };

    this.getData = function () {
      return _data;
    };

    this.setData = function (errorData) {
      _data = errorData;
    };
  }
}

module.exports = ProjectError;
