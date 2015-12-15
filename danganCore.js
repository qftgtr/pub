var DanganCore = (function(undefined) {
  var LOG = Math.max(LOG||0, 1);
  var _width, _height, _nPage, _titles,
      _sysTmpl, _userTmpl = [],
      _pageReady = []; // undefined for nothing, false for sysTmpl, true for userTmpl
  
  var _studentId, _userTemplate, _sysTemplate;
  
  var _imageObj = {
    '优秀':   'score_1.png',
    '良好':   'score_2.png',
    '一般':   'score_3.png',
    '中等':   'score_3.png',
    '达标':   'score_4.png',
    '不达标': 'score_5.png',
    '合格':   'score_6.png',
    '不合格': 'score_7.png',
  };
  
  var _star1 = {
    '优秀':   'stars_5.png',
    '良好':   'stars_4.png',
    '中等':   'stars_3.png',
    '一般':   'stars_2.png',
    '不合格': 'stars_1.png',
  };
  
  var _defaultGrowth = '/static/images/print/template/photo.png';
  
  var _helpers = {
    'gradeImage': function(d) {
      d.value = '/static/images/print/template/'+(_imageObj[d.value] || 'score.png');
    },
    'star1': function(d) {
      d.value = '/static/images/print/template/'+(_star1[d.value] || 'stars_0.png');
    }
  };
  
  var _filter = {
    'evaluation': function(result) {
      var newResult = [];
      newResult.push(result.find(function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '语文')
            return true;
      }));
      
      newResult.push(result.find(function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '数学')
            return true;
      }));
      
      newResult.push(result.find(function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '英语')
            return true;
      }));
      
      newResult.push(result.find(function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '信息技术')
            return true;
      }));
      
      newResult.push(result.find(function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '科学')
            return true;
      }));
      if (LOG>2) console.log('Core.(filtered evaluation)')
      if (LOG>2) console.log(newResult)
      return newResult;
    },
    'musicArt': function(result) {
      var newResult = [];
      newResult.push(result.find(function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '音乐')
            return true;
      }));
      
      newResult.push(result.find(function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '美术')
            return true;
      }));
      if (LOG>2) console.log('Core.(filtered musicArt)')
      if (LOG>2) console.log(newResult)
      return newResult;
    }
    
  };
  
  var _saveTmplData = function(result) {
    if (LOG) console.log('Core._saveTmplData');
    if (LOG > 2) console.log(JSON.stringify(result));
    _width = result.width;
    _height = result.height;
    _nPage = result.nPage;
    _titles = [];
    
    for (var page=0; page<_nPage; page++) {
      _titles.push(result.pages[page].title);
    }
  };
  
  var _loadSystemTmpl = function(callback) {
    if (LOG > 2) console.log('Core._loadSystemTmpl');
    var defer = $.Deferred();
    DanganNetwork.call('getSysTmpl', {
      templateId: _sysTemplate
    }).done(function(result) {
      if (LOG) console.log('Core._loadSystemTmpl finished');
      if (LOG) console.log(result);
      defer.resolve(result);
    });
    return $.when(defer.promise());
  };
  
  var _loadUserTmpl = function() {
    if (LOG > 2) console.log('Core._loadUserTmpl');
    var defer = $.Deferred();
    DanganNetwork.call('loadUserTmpl', {
        templateId: _userTemplate
    }).done(function(result) {
      if (LOG) console.log('Core._loadUserTmpl finished');
      if (LOG) console.log(result);
      defer.resolve(result);
    });
    return $.when(defer.promise());
  };
  
  var init = function(method, options) {
    if (LOG) console.log('Core.init with method '+method);
    
    _studentId = options.studentId;
    _sysTemplate = options.sysTemplate;
    _userTemplate = options.userTemplate;
    
    if (method === 'loadSystem') {
      var defer = $.Deferred();
      _loadSystemTmpl().done(function(result) {
        _saveTmplData(result);
        
        _sysTmpl = new Array(_nPage);
        _userTmpl = new Array(_nPage);
        _pageReady = new Array(_nPage);
        
        for (var page = 0; page < _nPage; page++) {
          var pageObj = JSON.parse(result.pages[page].json);
          if (result.pages[page].bg !== '')
            pageObj.bg = result.pages[page].bg;
          _sysTmpl[page] = pageObj;
          _pageReady[page] = false;
        }
        
        for (var page = 0; page < _nPage; page++) {
          _parseSysTmpl(page);
        }
        
        if (LOG) console.log('Core.init resolved');
        defer.resolve({
          width: _width,
          height: _height,
          nPage: _nPage,
          titles: _titles
        });
      });
      
      return $.when(defer.promise());
    }
    
    if (method === 'loadUser') {
      var defer = $.Deferred();
      _loadUserTmpl().done(function(result) {
        _saveTmplData(result);
        if (LOG) console.log('Core.init resolved');
        
        defer.resolve({
          width: _width,
          height: _height,
          nPage: _nPage,
          titles: _titles
        });
        
        _userTmpl = new Array(_nPage);
        _pageReady = new Array(_nPage);
        
        var needSystem = false;
        for (var page = 0; page < _nPage; page++) {
          if (LOG > 2) console.log('Core.(raw sysTempl) page '+page+':');
          if (LOG > 2) console.log(result.pages[page].json);
          
          _pageReady[page] = true;
          
          if (result.pages[page].json === '') {//no result
            _pageReady[page] = false;
            needSystem = true;
          } else {
            _userTmpl[page] = JSON.parse(result.pages[page].json);
          }
        }
        
        if (needSystem) {
          _loadSystemTmpl().done(function(result) {
            _sysTmpl = new Array(_nPage);
            for (var page = 0; page < _nPage; page++) {
              var pageObj = JSON.parse(result.pages[page].json);
              if (result.pages[page].bg !== '')
                pageObj.bg = result.pages[page].bg;
              _sysTmpl[page] = pageObj;
              if (!_pageReady[page])
                _parseSysTmpl(page);
            }
          });
        }
      }); // _loadUserTmpl().done
      
      return $.when(defer.promise());
    } // if (method === 'loadUser')
  };
  
  var _parseSysTmpl = function(page) {
    var defer = $.Deferred();
    _userTmpl[page] = defer.promise();
    ///// the most compliated part
    if (LOG > 1) console.log('Core._parseSysTmpl for page '+page);
    var elements = _sysTmpl[page].elem;
    
    var queries = [],
        growthTags, growthTarget;
    elements && elements.forEach(function(elem) {
      var data = elem.data,
          q = elem.query,
          g = elem.growth;
      
      if (g) {
//        DanganNetwork.delay('getGrowth', g).done(function(result) {
        var __defer = $.Deferred();
        queries.push(__defer.promise());
        
        DanganNetwork.call('getGrowth', {
          tagId: g,
          pageNum: 1,
          pageSize: data.length,
          studentId: _studentId
        }).done(function(result) {
          var i=0;
          
          result.forEach(function(r) {
            r.data.forEach(function(d) {
              if (i<data.length) {
                data[i].value = d.imgs[0];
                data[i].gText = d.text;
                i++;
              }
            });
          });
          
          for (;i<data.length;i++) {
            data[i].value = _defaultGrowth;
          }
          
          __defer.resolve();
        });
      }
      
      
      if (q) {
        (function() {
          var __defer = $.Deferred();
          queries.push(__defer.promise());
          
          DanganNetwork.delay('getData', q).done(function(result) {
            var qResult = result.data || [],
                filter = elem.filter;
            
            if (filter && _filter[filter]) {
              qResult = _filter[filter](qResult);
            }

            length = Math.min(data.length, qResult.length);

            if (elem.key) {
              for (var l=0; l<length; l++) {
                data[l].value = qResult[l] && qResult[l][elem.key];
              }
            } else {
              for (var l=0; l<length; l++) {
                data[l].value = qResult[l];
              }
            }

            __defer.resolve();
          });
        }());
      } else {
        data.forEach(function(d) {
          if (d.query) {
            var __defer = $.Deferred();
            queries.push(__defer.promise());
            
            DanganNetwork.delay('getData', d.query).done(function(r) {
              d.value = (r.data===null) ? (d.empty||'') : r.data;
              __defer.resolve();
            });
          }
        });
      }
    });
    
    
    if (LOG > 2) console.log('Core._parseSysTmpl query for data');
    DanganNetwork.call('getData', {
      studentId: _studentId
    }).done(function(result) {
      $.when.apply(this, queries).done(function() {
        setTimeout(function() {
          _pageReady[page] = true;
          if (LOG > 2) console.log('Core._parseSysTmpl done for page '+page);
          defer.resolve(_parseHelper(_sysTmpl[page], page));
        }, 100);
      });
    });
  };
  
  var _parseHelper = function(pageObj, page) {
    pageObj.elem.forEach(function(elem) {
      var helper = elem.helper;
      if (helper && _helpers[helper]) {
        elem.data.forEach(_helpers[helper]);
      }
    });
    
    if (LOG) console.log('Core.(sysTempl parsed) page '+page);
    if (LOG) console.log([JSON.stringify(pageObj)]);
    return pageObj;
  };
  
  var getPage = function(page) {
    return $.when(_userTmpl[page]);
  };
  
  var getGrowth = function(page) {
    var defer = $.Deferred();
    
//    DanganNetwork.call('getGrowth', {
//      pageNum: page,
//      studentId: _studentId
//    }).done(function(result) {
//      var growth = [];
//      result[0].data.forEach(function(r) {
//        r.imgs.forEach(function(img) {
//          growth.push({ text:r.text, img:img });
//        });
//      });
//      
//      defer.resolve(growth);
//    });
    
    return $.when(defer.promise());
  };
  
  var setImage = function(page, id, url) {
    return true; // success
  };
  
  var savePage = function(page, svg, json) {
    if (LOG) console.log('Core.savePage page: '+page);
    if (LOG) console.log({svg: svg, json: json});
    
    DanganNetwork.call('saveUserTmpl', {
      page: page+1,
      templateId: _userTemplate,
      svg: svg, json: json
    });
  };
  
  
  return {
    init: init,
    getPage: getPage,
    getGrowth: getGrowth,
    setImage: setImage,
//    clearImage: clearImage,
//    setText: setText,
    savePage: savePage
  }

}(undefined));