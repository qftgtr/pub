const DanganNetwork = window.DanganNetwork;
window.DanganCore = (function(undefined) {
  //var LOG = Math.max(LOG||0,0);
  var _width, _height, _nPage, _titles, _remarks,
      _sysTmpl = [], _userTmpl = [],
      _pageReady = [], // undefined for nothing, false for sysTmpl, true for userTmpl
      _growthCache = [], _growthCacheIndex = {first: 0, second: 0};
  
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
      });
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
    
    _sysTmpl = new Array(_nPage);
    _userTmpl = new Array(_nPage);
    _pageReady = new Array(_nPage);
    
    return {
      width: _width,
      height: _height,
      nPage: _nPage,
      titles: _titles,
      remarks: _remarks,
      save: undefined
    };
  };
  
  var _loadSystemTmpl = function() {
    if (LOG > 2) console.log('Core._loadSystemTmpl');
    return DanganNetwork.call('getSysTmpl', {
      templateId: _sysTemplate
    }).then(result => {
      if (LOG) console.log('Core._loadSystemTmpl finished');
      if (LOG) console.log(result);
    });
  };
  
  var _loadUserTmpl = function() {
    if (LOG > 2) console.log('Core._loadUserTmpl');
    return DanganNetwork.call('loadUserTmpl', {
      templateId: _userTemplate
    }).then(result => {
      if (LOG) console.log('Core._loadUserTmpl finished');
      if (LOG) console.log(result);
    });
  };
  
  var init = function(method, options) {
    if (LOG) console.log('Core.init with method '+method);
    
    if (options) {
      _studentId = options.studentId;
      _sysTemplate = options.sysTemplate;
      _userTemplate = options.userTemplate;
      _termId = options.termId;
    }
    _growthCacheIndex = {first: 0, second: 0};
    
    if (method === 'loadSystem' || method === 'randomGrowth') {
      return new Promise((resolve, reject) => {
        _loadSystemTmpl().then(result => {
          let basicData = _saveTmplData(result);
          basicData.save = 'all';
          
          for (var page = 0; page < _nPage; page++) {
            if (LOG) console.log('Core.(parsing json) page '+page);
            let pageObj = JSON.parse(result.pages[page].json);
            pageObj.bg = result.pages[page].bg;
            pageObj.bg2 = result.pages[page].bg2;
            _sysTmpl[page] = pageObj;
            _pageReady[page] = false;
            
            _parseSysTmpl(page, method==='randomGrowth');
          }

          if (LOG) console.log('Core.init resolved');
          resolve(basicData);
        });
      });
    }
    
    if (method === 'loadUser' || method === 'autoRefresh') {
      return new Promise((resolve, reject) => {
        _loadUserTmpl().then(result => {
          let basicData = _saveTmplData(result);
          basicData.save = [];

          var needSystem = false;
          for (var page = 0; page < _nPage; page++) {
            if (LOG > 2) console.log('Core.(raw userTmpl) page '+page+':');
            if (LOG > 2) console.log(result.pages[page].json);

            _pageReady[page] = true;
            
            if (result.pages[page].json === '') {//no result
              basicData.save.push(page);
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
            _loadSystemTmpl().then(result => {
              _sysTmpl = new Array(_nPage);
              for (var page = 0; page < _nPage; page++) {
                var pageObj = JSON.parse(result.pages[page].json);
                pageObj.bg = result.pages[page].bg;
                pageObj.bg2 = result.pages[page].bg2;
                _sysTmpl[page] = pageObj;
                
                if (!_pageReady[page])
                  _parseSysTmpl(page);
              }
            });
          }

          if (LOG) console.log('Core.init resolved');
          resolve(basicData);
      }); // _loadUserTmpl() done
    }); // if (method === 'loadUser')
  };
  
  var _parseUserTmpl = function(page) {
    _sysTmpl[page] = _userTmpl[page];
    _userTmpl[page] = undefined;
    _parseSysTmpl(page, false);
  };
  
  var _parseSysTmpl = function(page, randomGrowth) {
    if (!_userTmpl[page]) {
      _userTmpl[page] = $.Deferred();
    }
    ///// the most compliated part
    if (LOG > 1) console.log('Core._parseSysTmpl for page '+page);
    let elements = _sysTmpl[page].elem;
    
    let __promises = [],
        growthTags, growthTarget;
    elements && elements.forEach(elem => {
      let data = elem.data,
          q = elem.query,
          g = elem.growth;
      
      if (g) {
        if (randomGrowth) {
          data.forEach(d => {
            __promises.push(
              getGrowthFromCache().then(g => {
                if (g) {
                  d.value = g.img;
                  d.gText = g.text;
                } else {
                  d.value = _defaultGrowth;
                }
              });
            );
          });
        } else {
          __promises.push(
            DanganNetwork.call('getGrowth', {
              tagId: g,
              pageNum: 1,
              pageSize: data.length,
              studentId: _studentId
            }).then(result => {
              data.forEach((d,i) => {
                if (result[i]) {
                  d.value = d.value || result[i].imgs[0];
                  d.gText = d.gText || result[i].text;
                } else {
                  d.value = d.value || _defaultGrowth;
                }
              });
            });
          );
        }
      }
      
      
      if (q) {
        __promises.push(
          DanganNetwork.delay('getData', q).then(result => {
            let resultData = result.data || [],
                filter = elem.filter;
            
            if (filter && _filter[filter]) {
              resultData = _filter[filter](resultData);
            }
            
            if (elem.key) {
              data.forEach((d,i) => {
                d.value = resultData[i] && resultData[i][elem.key];
              });
            } else {
              data.forEach((d,i) => {
                d.value = resultData[i];
              });
            }
          });
        );
      } else {
        data.forEach(d => {
          d.query && __promises.push(
            DanganNetwork.delay('getData', d.query).then(result => {
              let filter = d.filter, data;
              if (filter && _filter[filter]) {
                data = _filter[filter](result || []);
              } else {
                data = result.data;
              }

              d.value = (data==null) ? (d.empty||'') : data;
            });
          );
        });
      }
    });
    
    
    if (LOG > 2) console.log('Core._parseSysTmpl query for data');
    DanganNetwork.call('getData', {
      studentId: _studentId,
      termId: _termId
    }).then(() => {
      Promise.all(__promises).then(() => {
        _pageReady[page] = true;
        if (LOG > 2) console.log('Core._parseSysTmpl done for page '+page);
        _userTmpl[page].resolve(_parseHelper(_sysTmpl[page], page));
      });
    });
  };
  
  var _parseHelper = function(pageObj, page) {
    pageObj.elem.forEach(elem => {
      if (LOG>2) console.log('Core._parseHelper page '+page);
      if (LOG>2) console.log([JSON.stringify(elem)]);
      var helper = elem.helper;
      
      elem.data.forEach(d => {
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
  
  var getGrowthFromCache = function() {
    return new Promise((resolve, reject) => {
      getGrowth(_growthCacheIndex.first).then(growth => {
        if (growth[_growthCacheIndex.second])
          return resolve(growth[_growthCacheIndex.second++]);
        
        if (_growthCacheIndex.second > 0) {
          _growthCacheIndex.second = 0;
          _growthCacheIndex.first++;
          return getGrowthFromCache().then(resolve);
        }
        
        resolve(undefined);
      });
    });
  };
  
  var getGrowth = function(page, pageSize) {
    return new Promise((resolve, reject) => {
      if (_growthCache[page])
        return resolve(_growthCache[page]);
      
      DanganNetwork.call('getGrowth', {
        pageNum: page+1,
        studentId: _studentId,
        pageSize: pageSize,
        termId: _termId
      }).then(result => {
        var growth = [];
        result[0] && result[0].data.forEach(r => {
          r.imgs.forEach((img,i) => growth.push({
            text: r.text,
            img: img,
            preview: r.preview[i]
          }));
        });
        
        if (!pageSize)
          _growthCache[page] = growth;

        resolve(growth);
      });
    });
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
    savePage: savePage,
    getGrowthFromCache: getGrowthFromCache,
    growthIndex: _growthCacheIndex
  }

}(undefined));