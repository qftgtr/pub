'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var DanganNetwork = function ($) {
  var url = '/mobile/api/evaluate/print/record';

  var _dataCache = function () {
    var _promises = new Map();
    var _queries = [];

    function _delay__(query) {
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

    function delay__(query) {
      try {
        return _delay__(query);
      } catch (err) {
        throw new Error('DanganNetwork getData delay: ' + query + '\n' + err);
      }
    }

    function query__(data, $ajaxSend) {
      if (_queries.length) {
        var _ret2 = function () {
          var sendData = { queries: _queries.join(';') };
          Object.assign(sendData, data);
          var sendQueries = Object.assign([], _queries);
          _queries = [];

          var nReturned = 0;
          return {
            v: new Promise(function (resolve, reject) {
              $ajaxSend(sendData).done(function (result) {
                if (result && result.length) {
                  result.forEach(function (r) {
                    if (sendQueries.indexOf(r.query) > -1) {
                      _promises.get(r.query).resolver(r);
                      nReturned++;
                    } else {
                      throw new Error('DanganNetwork cmd getData: no ' + r.query + ' for queries [' + sendQueries.join(';') + ']');
                    }
                  });
                  if (nReturned === sendQueries.length) {
                    resolve();
                  } else {
                    reject('DanganNetwork cmd getData: miss queries');
                  }
                } else {
                  reject('DanganNetwork cmd getData: empty return for queries [' + sendQueries.join(';') + ']');
                }
              }).fail(function (_, reason) {
                reject('DanganNetwork cmd getData: ' + reason);
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

  function _call__(cmd, inputData) {
    var data = { m: cmd };
    Object.assign(data, inputData);
    return new Promise(function (resolve, reject) {
      switch (cmd) {
        case 'getSysTmpl':
        case 'loadUserTmpl':
          $.ajax({ url: url, data: data }).done(resolve).fail(function (_, reason) {
            reject('DanganNetwork cmd ' + cmd + ': ' + reason);
          });
          break;
        case 'saveUserTmpl':
          $.ajax({ type: 'POST', url: url, data: data }).done(resolve).fail(function (_, reason) {
            reject('DanganNetwork cmd ' + cmd + ': ' + reason);
          });
          break;
        case 'getGrowth':
          data.page++;
          data.pageSize = data.pageSize || 3;
          data.pageNum = data.pageNum || 1;
          $.ajax({ url: url, data: data }).done(resolve).fail(function (_, reason) {
            reject('DanganNetwork cmd ' + cmd + ': ' + reason);
          });
          break;
        case 'getData':
          _dataCache.query__(data, function (d) {
            return $.ajax({ url: url, data: d });
          }).then(resolve, reject);
          break;
        default:
          reject('DanganNetwork unknown cmd: ' + cmd);
      }
    });
  }

  function call__(cmd, inputData) {
    try {
      return _call__(cmd, inputData);
    } catch (err) {
      throw new Error('DanganNetwork call: ' + cmd + ' || ' + inputData + '\n' + err);
    }
  }

  return {
    call__: call__,
    delay__: delay__
  };
}(jQuery);