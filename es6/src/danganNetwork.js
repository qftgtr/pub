const DanganNetwork = (($) => {
  const url = '/mobile/api/evaluate/print/record';

  const _dataCache = (() => {
    const _promises = new Map();
    let _queries = [];

    function delay__(query) {
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

    function query__(data, $sendReq__) {
      if (_queries.length) {
        const sendData = { queries: _queries.join(';') };
        Object.assign(sendData, data);
        _queries = [];

        return new Promise((resolve) => {
          $sendReq__(sendData).done(result => {
            result.forEach(r => _promises.get(r.query).resolver(r));
            resolve();
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

  function call__(cmd, inputdata) {
    const data = { m: cmd };
    Object.assign(data, inputdata);
    return new Promise((resolve) => {
      switch (cmd) {
        case 'getSysTmpl':
        case 'loadUserTmpl':
          $.ajax({ url, data }).done(resolve);
          break;
        case 'saveUserTmpl':
          $.ajax({ type: 'POST', url, data }).done(resolve);
          break;
        case 'getGrowth':
          data.page++;
          data.pageSize = data.pageSize || 3;
          data.pageNum = data.pageNum || 1;
          $.ajax({ url, data }).done(resolve);
          break;
        case 'getData':
          _dataCache.query__(data, d => $.ajax({ url, data: d })).then(resolve);
          break;
        default:
          resolve();
      }
    });
  }

  return {
    call__,
    delay__,
  };
})(jQuery);
