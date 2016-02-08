'use strict';
window.DanganNetwork = (function(undefined, $) {
  const url = '/mobile/api/evaluate/print/record';

  var _dataCache = (function() {
    let _promises = {},
        _queries = [];

    var delay__ = function(query) {
      if (query.constructor === Array) {
        return Promise.all(query.map( q => delay__(q) ));
      } else {
        if (!_promises[query]) {
          _promises[query] = {};
          _queries.push(query);
          _promises[query].promise = new Promise((resolve, reject) => {
            _promises[query].resolver = resolve;  
          });
        }
        return _promises[qs].promise;
      }
    };
    
    var query__ = function(data, $sendReq__) {
      if (_queries.length) {
        data.queries = _queries.join(';');
        _queries = [];
        
        return new Promise((resolve, reject) => {
          $sendReq__(data).done(result => {
            result.forEach(r => _promises[r.query].resolver(r));
            resolve();
          });
        });
      } else
        return Promise.resolve();
    };

    return {
      delay__: delay__,
      query__: query__
    };
  }());

  var delay__ = function(cmd, query) {
    if (cmd === 'getData')
      return _dataCache.delay__(query);
  };

  var call__ = function(cmd, data) {
    return new Promise((resolve, reject) => {
      if (cmd === 'getSysTmpl' || cmd === 'loadUserTmpl') {
        data.m = cmd;
        $.ajax({ url: url, data: data }).done(resolve);
      }

      if (cmd === 'saveUserTmpl') {
        data.m = cmd;
        $.ajax({ type: 'POST', url: url, data: data }).done(resolve);
      }

      if (cmd === 'getGrowth') {
        data.m = cmd;
        data.pageSize = data.pageSize || 3;
        data.pageNum = data.pageNum || 1;
        $.ajax({ url: url, data: data }).done(resolve);
      }
      
      if (cmd === 'getData') {
        data.m = cmd;
        _dataCache.query__( data, data => $.ajax({url:url,data:data}) ).then(resolve);
      }
    });
  };

  return {
    call__: call__,
    delay__: delay__
  };
}(undefined, jQuery));