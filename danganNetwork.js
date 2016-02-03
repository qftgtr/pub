var DanganNetwork = (function(undefined, $) {
  //var LOG = Math.max(LOG||0, 0);
  
  var url = '/mobile/api/evaluate/print/record';
  
  var dataCache = (function() {
    var _delaying = [],
        _waiting = {},
        _ready = {};
    
    var delay = function(qs) {
      if (qs.constructor === Array) {
        var defer = $.Deferred();
        $.when.apply(this, qs.map(function(q) {
          return delay(q);
        })).done(function() {
          var len = arguments.length,
              args = new Array(len);
          for(var i = 0; i < len; ++i) {
            args[i] = arguments[i];
          }
          defer.resolve(args);
        });
        return defer.promise();
      } else {
        if (_ready[qs]) {
          return _ready[qs];
        } else if (_waiting[qs]) {
          return _waiting[qs].promise();
        } else {
          if (_delaying.indexOf(qs) === -1) {
            _delaying.push(qs);
            var defer = $.Deferred();
            _waiting[qs] = defer;
            return _waiting[qs].promise();
          }
        }
      }
    };
    
    var query = function(sendReq, data) {
      if (data.queries)
        delay(data.queries);
      
      if (_delaying.length > 0) {
        data.queries = _delaying.join(';');
        _delaying = [];
        
        sendReq(data).done(function(result) {
          result.forEach(function(r) {
            var q = r.query;
            _ready[q] = r;
            _waiting[q].resolve(r);
          });
        });
        return true;
      }
      return false;
    };
    
    return {
      delay: delay,
      query: query
    };
  }());
  
  var delay = function(cmd, query) {
    if (cmd === 'getData') {
      if (LOG > 2) console.log('Network.delay getData '+query);
      return $.when(dataCache.delay(query));
    }
  };
  
  var call = function(cmd, data) {
    var defer = $.Deferred();
    
    if (cmd === 'getSysTmpl') {
      if (LOG) console.log('Network.call getSysTmpl');
      data.m = 'getSysTmpl';
      $.ajax({ url: url, data: data }).done(function(result) {
        if (LOG > 1) console.log('Network.call getSysTmpl done');
        if (LOG > 1) console.log(JSON.stringify(result));
        defer.resolve(result);
      });
    }
    
    if (cmd === 'loadUserTmpl') {
      if (LOG) console.log('Network.call loadUserTmpl');
      data.m = 'loadUserTmpl';
      $.ajax({ url: url, data: data }).done(function(result) {
        if (LOG > 1) console.log('Network.call loadUserTmpl done');
        if (LOG > 1) console.log(JSON.stringify(result));
        defer.resolve(result);
      });
    }
    
    if (cmd === 'saveUserTmpl') {
      if (LOG > 1) console.log('Network.call saveUserTmpl page '+(data.page-1));
      if (LOG > 1) console.log(data);
      data.m = 'saveUserTmpl';
      $.ajax({ type: 'POST', url: url, data: data }).done(function(result) {
        if (LOG) console.log('Network.call saveUserTmpl done page '+(data.page-1));
        if (LOG) console.log(JSON.stringify(result));
        defer.resolve(result);
      }).fail(function(jqXHR, textStatus, errorThrown) {
        
      });
    }
    
    if (cmd === 'getData') {
      var didQuery = dataCache.query(function(data) {
        if (LOG) console.log('Network.call getData');
        if (LOG) console.log(JSON.stringify(data));
        data.m = 'getData';
        return $.ajax({ url: url, data: data }).done(function(result) {
          if (LOG) console.log('Network.call getData done');
          if (LOG) console.log(result.map(function(q){return q.query;}).join(';'));
          if (LOG) console.log([JSON.stringify(result)]);
          defer.resolve(result);
        });
      }, data);
      
      if (!didQuery)
        defer.resolve();
    }
    
    if (cmd === 'getGrowth') {
      data.m = 'getGrowth';
      data.pageSize = data.pageSize || 3;
      data.pageNum = data.pageNum || 1;
      if (LOG > 2) console.log('Network.call getGrowth');
      if (LOG > 2) console.log(JSON.stringify(data));
      $.ajax({ url: url, data: data }).done(function(result) {
        if (LOG) console.log('Network.call getGrowth done');
        if (LOG) console.log(result.map(function(g){return g.query;}).join(';'));
        if (LOG) console.log([JSON.stringify(result)]);
        defer.resolve(result);
      });
    }
    
    return $.when(defer.promise());
  };
  
  
  return {
    call: call,
    delay: delay
  };
}(undefined, jQuery));