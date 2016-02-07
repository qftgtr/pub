window.DanganNetwork = (function(undefined, $) {
  //var LOG = Math.max(LOG||0, 0);
  
  const url = '/mobile/api/evaluate/print/record';
  
  var dataCache = (function() {
    var _promises = {};
    
    var delay = function(qs) {
      if (qs.constructor === Array) {
        return Promise.all(qs.map(q => delay(q)));
      } else {
        return new Promise((resolve, reject) => {
          _promises[qs].then(result => {
            resolve(result);
          });
        });
      }
    };
    
    var query = function(sendReq, data) {
      if (data.queries)
        delay(data.queries);
      
      if (_delaying.length > 0) {
        data.queries = _delaying.join(';');
        _delaying = [];
        
        sendReq(data).then(result => {
          result.forEach(r => {
            _promises[r.query].resolve(r);
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
    return new Promise((resolve, reject) => {
      if (cmd === 'getSysTmpl') {
        if (LOG) console.log('Network.call getSysTmpl');
        data.m = 'getSysTmpl';
        $.ajax({ url: url, data: data }).done(result => {
          if (LOG > 1) console.log('Network.call getSysTmpl done');
          if (LOG > 1) console.log(JSON.stringify(result));
          resolve(result);
        });
      }
      
      if (cmd === 'loadUserTmpl') {
        if (LOG) console.log('Network.call loadUserTmpl');
        data.m = 'loadUserTmpl';
        $.ajax({ url: url, data: data }).done(result => {
          if (LOG > 1) console.log('Network.call loadUserTmpl done');
          if (LOG > 1) console.log(JSON.stringify(result));
          resolve(result);
        });
      }
      
      if (cmd === 'saveUserTmpl') {
        if (LOG > 1) console.log('Network.call saveUserTmpl page '+(data.page-1));
        if (LOG > 1) console.log(data);
        data.m = 'saveUserTmpl';
        $.ajax({ type: 'POST', url: url, data: data }).done(result => {
          if (LOG) console.log('Network.call saveUserTmpl done page '+(data.page-1));
          if (LOG) console.log(JSON.stringify(result));
          resolve(result);
        });
      }
      
      if (cmd === 'getData') {
        if (LOG) console.log('Network.call getData');
        if (LOG) console.log(JSON.stringify(data));
        var didQuery = dataCache.query(data => {
          if (LOG) console.log(JSON.stringify(data));
          data.m = 'getData';
          return $.ajax({ url: url, data: data }).done(result => {
            if (LOG) console.log('Network.call getData done');
            if (LOG) console.log(result.map(function(q){return q.query;}).join(';'));
            if (LOG) console.log([JSON.stringify(result)]);
            resolve(result);
          });
        }, data);

        if (!didQuery)
          resolve();
      }
      
      if (cmd === 'getGrowth') {
        data.m = 'getGrowth';
        data.pageSize = data.pageSize || 3;
        data.pageNum = data.pageNum || 1;
        if (LOG > 2) console.log('Network.call getGrowth');
        if (LOG > 2) console.log(JSON.stringify(data));
        $.ajax({ url: url, data: data }).done(result => {
          if (LOG) console.log('Network.call getGrowth done');
          if (LOG) console.log(result.map(function(g){return g.query;}).join(';'));
          if (LOG) console.log([JSON.stringify(result)]);
          resolve(result);
        });
      }
    });
  };
  
  
  return {
    call: call,
    delay: delay
  };
}(undefined, jQuery));