'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var DanganNetwork = function ($) {
  var url = '/mobile/api/evaluate/print/record';

  var _dataCache = function () {
    var _promises = new Map();
    var _queries = [];

    function delay__(query) {
      if (query.constructor === Array) {
        return Promise.all(query.map(function (q) {
          return delay__(q);
        }));
      }

      if (!_promises.get(query)) {
        (function () {
          _queries.push(query);
          var promise = { promise: null, resolver: null };
          promise.promise = new Promise(function (resolve) {
            promise.resolver = resolve;
          });
          _promises.set(query, promise);
        })();
      }
      return _promises.get(query).promise;
    }

    function query__(data, $sendReq__) {
      if (_queries.length) {
        var _ret2 = function () {
          var sendData = { queries: _queries.join(';') };
          Object.assign(sendData, data);
          _queries = [];

          return {
            v: new Promise(function (resolve) {
              $sendReq__(sendData).done(function (result) {
                result.forEach(function (r) {
                  return _promises.get(r.query).resolver(r);
                });
                resolve();
              });
            })
          };
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
      }

      return Promise.resolve();
    }

    return {
      delay__: delay__,
      query__: query__
    };
  }();

  function delay__(cmd, query) {
    if (cmd === 'getData') return _dataCache.delay__(query);
  }

  function call__(cmd, inputdata) {
    var data = { m: cmd };
    Object.assign(data, inputdata);
    return new Promise(function (resolve) {
      switch (cmd) {
        case 'getSysTmpl':
        case 'loadUserTmpl':
          $.ajax({ url: url, data: data }).done(resolve);
          break;
        case 'saveUserTmpl':
          $.ajax({ type: 'POST', url: url, data: data }).done(resolve);
          break;
        case 'getGrowth':
          data.page++;
          data.pageSize = data.pageSize || 3;
          data.pageNum = data.pageNum || 1;
          $.ajax({ url: url, data: data }).done(resolve);
          break;
        case 'getData':
          _dataCache.query__(data, function (d) {
            return $.ajax({ url: url, data: d });
          }).then(resolve);
          break;
        default:
          resolve();
      }
    });
  }

  return {
    call__: call__,
    delay__: delay__
  };
}(jQuery);