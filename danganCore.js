var DanganCore = (function(undefined) {
  //var LOG = Math.max(LOG||0,0);
  var _width, _height, _nPage, _titles, _remarks,
      _sysTmpl = [], _userTmpl = [],
      _pageReady = []; // undefined for nothing, false for sysTmpl, true for userTmpl
  
  var _studentId, _userTemplate, _sysTemplate, _termId;
  
  var _imageObj = {
    '优秀':   'score_1.png',
    '良好':   'score_2.png',
    '一般':   'score_3.png',
    '中等':   'score_8.png',
    '达标':   'score_4.png',
    '不达标': 'score_5.png',
    '合格':   'score_6.png',
    '不合格': 'score_7.png',
    '加油': 'score_9.png'
  };
  
  var _star1 = {
    '优秀':   'stars_5.png',
    '良好':   'stars_4.png',
    '中等':   'stars_3.png',
    '一般':   'stars_2.png',
    '不合格': 'stars_1.png'
  };
  
  var _star2 = {
    '优秀':   'star_4.png',
    '良好':   'star_3.png',
    '合格':   'star_2.png',
    '不合格': 'star_1.png'
  };
  
  var _defaultGrowth = '/static/images/print/template/growth_default.png';
  
  var _helpers = {
    'gradeImage': function(d) {
      d.value = '/static/images/print/template/'+(_imageObj[d.value] || 'score.png');
    },
    'star1': function(d) {
      d.value = '/static/images/print/template/'+(_star1[d.value] || 'stars_0.png');
    },
    'artGrade': function(d) {
      var v = d.value;
      if (v >= 90)
        d.value = '优秀';
      else if (v >= 75)
        d.value = '良好';
      else if (v >= 60)
        d.value = '合格';
      else if (v > -1)
        d.value = '不合格';
    },
    'artStars': function(d) {
      var v = d.value;
      if (v >= 90)
        v = '优秀';
      else if (v >= 75)
        v = '良好';
      else if (v >= 60)
        v = '合格';
      else if (v > 0)
        v = '不合格';
      
      d.value = '/static/images/print/template/'+(_star2[v] || 'star_0.png');
    },
    'emptyFlower': function(d) {
      if (typeof d.value === 'number') {
        if (d.value === 0 && !d.offset) {
          d.x = d.x+106;
          d.offset = true;
        }
        
        if (d.value > 0 && d.offset) {
            d.x = d.x-106;
            d.offset = false;
          }
        
        d.value = '/static/images/print/template/red%20flower.png';
      }
    },
    'hideZero': function(d) {
      if (!d.value)
        d.value = '';
      else
        d.value = 'x '+d.value;
    },
    'getAstro': function(d) {
      if (d.value) {
		  var ymd = d.value.split('-');
	      if (ymd.length === 1)
	        ymd = d.value.split('/');
	      if (ymd.length === 1) {
	        var yMD = d.value.split('年'),
	            mD = yMD[1].split('月'),
	            D = mD[1].split('日');
	        
	        ymd = [yMD[0], mD[0], D[0]];
	      }

        if (ymd.length === 1)
          d.value = '';
        else {
          var m = ymd[1], day = ymd[2];
          d.value = '魔羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手魔羯'.substr(m*2-(day<'102123444543'.charAt(m-1)- -19)*2,2)+'座';
        }
      } else {
        d.value = '未知星座'
      }
    },
    'percent': function(d) {
      d.value = Math.round(d.value)+'%'
    }
  };
  
  var _array_find = function(array, cond) {
    for (var i=0; i<array.length; i++) {
      if (cond(array[i]))
        return array[i];
    }
  };
  
  var _filter = {
    'skip8': function(result) {
      return result.slice(8);
    },
    'sum': function(result) {
      console.log('****');
      console.log(result);
      var total = 0;
      result.forEach(function(r) {
        total += parseFloat(r.data)*100 || 0;
      });
      
      return total/100;
    },
    'evaluation': function(result) {
      var newResult = [];
      newResult.push(_array_find(result, function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '语文')
            return true;
      }));
      
      newResult.push(_array_find(result, function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '数学')
            return true;
      }));
      
      newResult.push(_array_find(result, function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '英语')
            return true;
      }));
      
      newResult.push(_array_find(result, function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '信息技术')
            return true;
      }));
      
      newResult.push(_array_find(result, function(x) {
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
      newResult.push(_array_find(result, function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '音乐')
            return true;
      }));
      
      newResult.push(_array_find(result, function(x) {
        for (var key in x.subjects)
          if (x.subjects[key] === '美术')
            return true;
      }));
      if (LOG>2) console.log('Core.(filtered musicArt)')
      if (LOG>2) console.log(newResult)
      return newResult;
    },
    'bars': function(result) {
      var max = 0;
      result.forEach(function(r) {
        if (max < r.percentage)
          max = r.percentage;
      });
      
      return result.map(function(r) {
        return [r.percentage/max, r.color];
      })
    }
    
  };
  
  var _saveTmplData = function(result) {
    if (LOG) console.log('Core._saveTmplData');
    if (LOG > 2) console.log(result);
    _width = result.width;
    _height = result.height;
    _nPage = result.nPage;
    _titles = [];
    _remarks = [];
    
    for (var page=0; page<_nPage; page++) {
      _titles.push(result.pages[page].title);
      _remarks.push(result.pages[page].remark);
    }
  };
  
  var _loadSystemTmpl = function(callback) {
    if (LOG > 2) console.log('Core._loadSystemTmpl');
    return DanganNetwork.call('getSysTmpl', {
      templateId: _sysTemplate
    }).done(function(result) {
      if (LOG) console.log('Core._loadSystemTmpl finished');
      if (LOG) console.log(result);
    });
  };
  
  var _loadUserTmpl = function() {
    if (LOG > 2) console.log('Core._loadUserTmpl');
    return DanganNetwork.call('loadUserTmpl', {
        templateId: _userTemplate
    }).done(function(result) {
      if (LOG) console.log('Core._loadUserTmpl finished');
      if (LOG) console.log(result);
    });
  };
  
  var init = function(method, options) {
    if (LOG) console.log('Core.init with method '+method);
    
    if (method !== 'randomGrowth') {
      _studentId = options.studentId;
      _sysTemplate = options.sysTemplate;
      _userTemplate = options.userTemplate;
      _termId = options.termId;
    }
    
    if (method === 'loadSystem' || method === 'randomGrowth') {
      var defer = $.Deferred();
      _loadSystemTmpl().done(function(result) {
        _saveTmplData(result);
        
        _sysTmpl = new Array(_nPage);
        _userTmpl = new Array(_nPage);
        _pageReady = new Array(_nPage);
        
        for (var page = 0; page < _nPage; page++) {
          if (LOG) console.log('Core.(parsing json) page '+page);
          var pageObj = JSON.parse(result.pages[page].json);
          if (result.pages[page].bg !== '')
            pageObj.bg = result.pages[page].bg;
          if (result.pages[page].bg2 !== '')
            pageObj.bg2 = result.pages[page].bg2;
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
          titles: _titles,
          remarks: _remarks,
          save: 'all'
        });
      });
      
      return $.when(defer.promise());
    }
    
    if (method === 'loadUser' || method === 'autoRefresh') {
      var defer = $.Deferred();
      _loadUserTmpl().done(function(result) {
        _saveTmplData(result);
        var __save = [];
        
        _sysTmpl = new Array(_nPage);
        _userTmpl = new Array(_nPage);
        _pageReady = new Array(_nPage);
        
        var needSystem = false;
        for (var page = 0; page < _nPage; page++) {
          if (LOG > 2) console.log('Core.(raw userTmpl) page '+page+':');
          if (LOG > 2) console.log(result.pages[page].json);

          _pageReady[page] = true;

          if (result.pages[page].json === '') {//no result
            __save.push(page);
            _userTmpl[page] = $.Deferred();
            _pageReady[page] = false;
            needSystem = true;
          } else {
            _userTmpl[page] = JSON.parse(result.pages[page].json);
            if (method === 'autoRefresh')
              _parseUserTmpl(page);
          }
        }
        
        if (needSystem) {
          _loadSystemTmpl().done(function(result) {
            _sysTmpl = new Array(_nPage);
            for (var page = 0; page < _nPage; page++) {
              var pageObj = JSON.parse(result.pages[page].json);
              if (result.pages[page].bg !== '')
                pageObj.bg = result.pages[page].bg;
              if (result.pages[page].bg2 !== '')
                pageObj.bg2 = result.pages[page].bg2;
              _sysTmpl[page] = pageObj;
              if (!_pageReady[page])
                _parseSysTmpl(page);
            }
          });
        }
        
        if (LOG) console.log('Core.init resolved');
        defer.resolve({
          width: _width,
          height: _height,
          nPage: _nPage,
          titles: _titles,
          remarks: _remarks,
          save: __save
        });
      }); // _loadUserTmpl().done
      
      return $.when(defer.promise());
    } // if (method === 'loadUser')
  };
  
  var _parseUserTmpl = function(page) {
    _sysTmpl[page] = _userTmpl[page];
    _userTmpl[page] = undefined;
    _parseSysTmpl(page, false);
  }
  
  var _parseSysTmpl = function(page, noGrowth) {
    if (!_userTmpl[page]) {
      _userTmpl[page] = $.Deferred();
    }
    ///// the most compliated part
    if (LOG > 1) console.log('Core._parseSysTmpl for page '+page);
    var elements = _sysTmpl[page].elem;
    
    var queries = [],
        growthTags, growthTarget;
    elements && elements.forEach(function(elem) {
      var data = elem.data,
          q = elem.query,
          g = elem.growth;
      
      if (g && !noGrowth) {
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
                data[i].value = data[i].value || d.imgs[0];
                if ($.trim(d.text))
                  data[i].gText = data[i].gText || d.text;
                i++;
              }
            });
          });
          
          for (;i<data.length;i++) {
            data[i].value = data[i].value || _defaultGrowth;
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

            //length = Math.min(data.length, qResult.length);
            length=data.length;
            
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
              var data,
                  filter = d.filter;
              if (filter && _filter[filter]) {
                data = _filter[filter](r || []);
              } else {
                data = r.data;
              }
              
              d.value = (data===null) ? (d.empty||'') : data;
              __defer.resolve();
            });
          }
        });
      }
    });
    
    
    if (LOG > 2) console.log('Core._parseSysTmpl query for data');
    DanganNetwork.call('getData', {
      studentId: _studentId,
      termId: _termId
    }).done(function(result) {
      $.when.apply(this, queries).done(function() {
        setTimeout(function() {
          _pageReady[page] = true;
          if (LOG > 2) console.log('Core._parseSysTmpl done for page '+page);
          _userTmpl[page].resolve(_parseHelper(_sysTmpl[page], page));
        }, 100);
      });
    });
  };
  
  var _parseHelper = function(pageObj, page) {
    pageObj.elem.forEach(function(elem) {
      if (LOG>2) console.log('Core._parseHelper page '+page);
      if (LOG>2) console.log([JSON.stringify(elem)]);
      var helper = elem.helper;
      
      elem.data.forEach(function(d) {
        var h = d.helper || helper;
        if (h && _helpers[h]) {
          if (LOG) console.log('Core.(helper) '+h);
          _helpers[h](d);
        }
        
        d.value = d.value || d.empty || '';
      });
    });
    
    if (LOG) console.log('Core.(sysTmpl parsed) page '+page);
    if (LOG) console.log([JSON.stringify(pageObj)]);
    return pageObj;
  };
  
  var getPage = function(page) {
    return $.when(_userTmpl[page]);
  };
  
  var getGrowth = function(page, pageSize) {
    var defer = $.Deferred();
    
    DanganNetwork.call('getGrowth', {
      pageNum: page,
      studentId: _studentId,
      pageSize: pageSize,
      termId: _termId
    }).done(function(result) {
      var growth = [];
      result[0] && result[0].data.forEach(function(r) {
        var i=0;
        r.imgs.forEach(function(img) {
          growth.push({ text:r.text, img:img, preview: r.preview[i]});
          i++;
        });
      });
      
      defer.resolve(growth);
    });
    
    return $.when(defer.promise());
  };
  
  var setImage = function(page, id, url) {
    return true; // success
  };
  
  var savePage = function(page, svg, json) {
    if (LOG) console.log('Core.savePage page: '+page);
    if (LOG) console.log({svg: svg, json: json});
    
    return DanganNetwork.call('saveUserTmpl', {
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