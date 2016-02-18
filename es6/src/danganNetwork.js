const DanganNetwork = (($) => {
  const url = '/mobile/api/evaluate/print/record';

  const _dataCache = (() => {
    const _promises = new Map();
    let _queries = [];

    function _delay__(query) {
      if (query.constructor === Array) {
        return Promise.all(query.map(q => delay__(q)));
      }

      if (!_promises.get(query)) {
        _queries.push(query);
        const promise = { promise: null, resolver: null };
        promise.promise = new Promise((resolve) => {
          promise.resolver = resolve;
        });
        _promises.set(query, promise);
      }
      return _promises.get(query).promise;
    }

    function delay__(query) {
      try {
        return _delay__(query);
      } catch(err) {
        throw new Error(`DanganNetwork getData delay: ${query}\n${err}`);
      }
    }

    function query__(data, $ajaxSend) {
      if (_queries.length) {
        const sendData = { queries: _queries.join(';') };
        Object.assign(sendData, data);
        const sendQueries = Object.assign([], _queries);
        _queries = [];

        let nReturned = 0;
        return new Promise((resolve, reject) => {
          $ajaxSend(sendData).done(result => {
            if (result && result.length) {
              result.forEach(r => {
                if (sendQueries.indexOf(r.query) > -1) {
                  _promises.get(r.query).resolver(r);
                  nReturned++;
                } else {
                  throw new Error(`DanganNetwork cmd getData: no ${r.query} for queries [${sendQueries.join(';')}]`);
                }
              });
              if (nReturned === sendQueries.length-1) {
                resolve();
              } else {
                reject(`DanganNetwork cmd getData: miss queries`);
              }
            } else {
              reject(`DanganNetwork cmd getData: empty return for queries [${sendQueries.join(';')}]`);
            }
          }).fail((_, reason) => {
            reject(`DanganNetwork cmd getData: ${reason}`);
          });
        });
      }

      return Promise.resolve();
    }

    return {
      delay__,
      query__,
    };
  })();

  function delay__(cmd, query) {
    if (cmd === 'getData') return _dataCache.delay__(query);
  }

  function _call__(cmd, inputData) {
    const data = { m: cmd };
    Object.assign(data, inputData);
    return new Promise((resolve, reject) => {
      switch (cmd) {
        case 'getSysTmpl':
        case 'loadUserTmpl':
          $.ajax({ url, data }).done(resolve).fail((_, reason) => {
            reject(`DanganNetwork cmd ${cmd}: ${reason}`);
          });
          break;
        case 'saveUserTmpl':
          $.ajax({ type: 'POST', url, data }).done(resolve).fail((_, reason) => {
            reject(`DanganNetwork cmd ${cmd}: ${reason}`);
          });
          break;
        case 'getGrowth':
          data.page++;
          data.pageSize = data.pageSize || 3;
          data.pageNum = data.pageNum || 1;
          $.ajax({ url, data }).done(resolve).fail((_, reason) => {
            reject(`DanganNetwork cmd ${cmd}: ${reason}`);
          });
          break;
        case 'getData':
          _dataCache.query__(data, d => $.ajax({ url, data: d })).then(resolve, reject);
          break;
        default:
          reject(`DanganNetwork unknown cmd: ${cmd}`);
      }
    });
  }

  function call__(cmd, inputData) {
    try {
      return _call__(cmd, inputData);
    } catch (err) {
      throw new Error(`DanganNetwork call: ${cmd} || ${inputData}\n${err}`);
    }
  }

  return {
    call__,
    delay__,
  };
})(jQuery);
