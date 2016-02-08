'use strict';
window.DanganNetwork = (function(undefined, $) {
  const url = '/mobile/api/evaluate/print/record';

  const _dataCache = (function() {
    let _promises = new Map(),
        _queries = [];

    function delay__(query) {
      if (query.constructor === Array) {
        return Promise.all(query.map( q => delay__(q) ));
      } else {
        if (!_promises.get(query)) {
          _queries.push(query);
          const promise = { promise: null, resolver: null };
          promise.promise = new Promise((resolve, reject) => {
            promise.resolver = resolve;
          });
          _promises.set(query, promise);
        }
        return _promises.get(query).promise;
      }
    }
    
    function query__(data, $sendReq__) {
      if (_queries.length) {
        data.queries = _queries.join(';');
        _queries = [];
        
        return new Promise((resolve, reject) => {
          $sendReq__(data).done(result => {
            result.forEach(r => _promises.get(r.query).resolver(r));
            resolve();
          });
        });
      } else
        return Promise.resolve();
    }

    return {
      delay__,
      query__
    };
  }());

  function delay__(cmd, query) {
    if (cmd === 'getData')
      return _dataCache.delay__(query);
  }

  function call__(cmd, data) {
    data.m = cmd;
    return new Promise((resolve, reject) => {
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
          _dataCache.query__( data, data => $.ajax({ url:url, data:data }) ).then(resolve);
          break;
      }
    });
  }

  return {
    call__,
    delay__,
  };
}(undefined, jQuery));