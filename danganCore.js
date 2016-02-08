const DanganNetwork = window.DanganNetwork,
      DanganUtil = window.DanganUtil;
window.DanganCore = (function(undefined) {
  //var LOG = Math.max(LOG||0,0);
  let _studentId, _userTemplate, _sysTemplate, _termId,
      _nPage, _tmplBasic, _userTmpl = [],
      _growthCache = [], _growthCacheIndex = {first: 0, second: 0};

  var _saveTmplBasic = function(result) {
    if (LOG) console.log('Core._saveTmplData');
    if (LOG > 2) console.log(result);
    _nPage = result.nPage;
    
    _tmplBasic.width = result.width;
    _tmplBasic.height = result.height;
    _tmplBasic.nPage = result.nPage;
    _tmplBasic.titles = [];
    _tmplBasic.remarks = [];
    _tmplBasic.save = undefined;
    
    for (let page=0; page<_nPage; page++) {
      _tmplBasic.titles.push(result.pages[page].title);
      _tmplBasic.remarks.push(result.pages[page].remark);
    }
    
    _userTmpl = new Array(_nPage);

    return _tmplBasic;
  };

  var _loadSystemTmpl__ = function() {
    if (LOG > 2) console.log('Core._loadSystemTmpl__');
    return DanganNetwork.call__('getSysTmpl', {
      templateId: _sysTemplate
    }).then(result => {
      if (LOG) console.log('Core._loadSystemTmpl__ resolved');
      if (LOG) console.log(result);
    });
  };

  var _loadUserTmpl__ = function() {
    if (LOG > 2) console.log('Core._loadUserTmpl__');
    return DanganNetwork.call__('loadUserTmpl', {
      templateId: _userTemplate
    }).then(result => {
      if (LOG) console.log('Core._loadUserTmpl__ resolved');
      if (LOG) console.log(result);
    });
  };

  var init__ = function(method, options) {
    if (LOG) console.log('Core.init__ for method '+method);

    if (options) {
      _studentId = options.studentId;
      _sysTemplate = options.sysTemplate;
      _userTemplate = options.userTemplate;
      _termId = options.termId;
    }
    _growthCacheIndex = {first: 0, second: 0};

    if (method === 'loadSystem' || method === 'randomGrowth') {
      return _loadSystemTmpl__().then(result => {
        let basicData = _saveTmplBasic(result);
        basicData.save = 'all';

        result.pages.forEach((pageData, page) => {
          if (LOG) console.log('Core.init__.(sysTmpl json) for page '+page);
          let pageObj = JSON.parse(pageData.json);
          pageObj.bg = pageData.bg;
          pageObj.bg2 = pageData.bg2;

          _userTmpl[page] = _parseTmpl__(page, pageObj, method==='randomGrowth');
        });
        
        if (LOG) console.log('Core.init__ resolved');
        return basicData;
      });
    }

    if (method === 'loadUser' || method === 'autoRefresh') {
      return _loadUserTmpl__().then(result => {
        let basicData = _saveTmplBasic(result);
        basicData.save = [];
        let needSysPages = basicData.save;

        result.pages.forEach((pageData, page) => {
          if (LOG > 2) console.log('Core.init__.(userTmpl json) for page '+page);
          if (LOG > 2) console.log(pageData.json);

          if (pageData.json === '')
            needSysPages.push(page);
          else if (method === 'loadUser')
            _userTmpl[page] = Promise.resolve(JSON.parse(pageData.json));
          else
            _userTmpl[page] = _parseTmpl__(page, JSON.parse(pageData.json));
        });


        if (needSysPages.length) {
          _loadSystemTmpl__().then(result => {
            needSysPages.forEach(page => {
              let pageData = result.pages[page],
                  pageObj = JSON.parse(pageData.json);
              pageObj.bg = pageData.bg;
              pageObj.bg2 = pageData.bg2;
              _userTmpl[page] = _parseTmpl__(page, pageObj);
            });
          });
        }
        
        if (LOG) console.log('Core.init__ resolved');
        return basicData;
      }); // _loadUserTmpl() done
    }
  };

  var _parseTmpl__ = function(page, pageObj, randomGrowth) {
    ///// the most compliated part
    if (LOG > 1) console.log('Core._parseTmpl__ for page '+page);

    let __promises = [];
    
    pageObj.elem && pageObj.elem.forEach(elem => {
      if (elem.growth) {
        if (randomGrowth) {
          let ps = elem.data.map(d => {
            return getGrowthFromCache().then(g => {
              if (g) {
                d.value = g.img;
                d.gText = g.text;
              } else {
                d.value = DanganUtil.defaultGrowth;
              }
            });
          });
          __promises = __promises.concat(ps);
        } else {
          let p = DanganNetwork.call('getGrowth', {
            tagId: elem.growth,
            pageNum: 1,
            pageSize: elem.data.length,
            studentId: _studentId
          }).then(result => {
            elem.data.forEach((d,i) => {
              if (result[i]) {
                d.value = d.value || result[i].imgs[0];
                d.gText = d.gText || result[i].text;
              } else {
                d.value = d.value || DanganUtil.defaultGrowth;
              }
            });
          });
          __promises.push(p);
        }
      }
      
      if (elem.query) {
        let p = DanganNetwork.delay('getData', elem.query).then(result => {
          let resultData = _handleFilter(elem.filter, result.data);

          if (elem.key) {
            elem.data.forEach((d,i) => {
              d.value = resultData[i] && resultData[i][elem.key];
            });
          } else {
            elem.data.forEach((d,i) => {
              d.value = resultData[i];
            });
          }
        });
        __promises.push(p);        
      } else {
        elem.data.forEach(d => {
          if (d.query) {
            let p = DanganNetwork.delay('getData', d.query).then(result => {
              let data = _handleFilter(d.filter, result) || result.data;
              d.value = (data==null) ? (d.empty||'') : data;
            });
            __promises.push(p);
          }
        });
      }
    });
    
    
    if (LOG > 2) console.log('Core._parseTmpl__');
    __promises.push(DanganNetwork.call('getData', {
      studentId: _studentId,
      termId: _termId
    }));

    return Promise.all(__promises).then(() => {
      if (LOG>2) console.log('Core._parseHelper for page '+page);
      if (LOG>2) console.log([JSON.stringify(pageObj)]);
      return _parseHelper(pageObj);
    }).then((pageObj) => {
      if (LOG) console.log('Core._parseHelper done for page '+page);
      if (LOG) console.log([JSON.stringify(pageObj)]);
      return pageObj;
    });
  };

  var _handleFilter = function(data, filter) {
    if (filter && DanganUtil.filters[filter]) {
      return DanganUtil.filters[filter](data || [])
    }
  };
  
  var _parseHelper = function(pageObj, page) {
    pageObj.elem.forEach(elem => {
      elem.data.forEach(d => {
        var h = d.helper || elem.helper;
        if (h && DanganUtil.helpers[h]) {
          if (LOG>2) console.log('Core._parseHelper for helper '+h);
          DanganUtil.helpers[h](d);
        }
        d.value = d.value || d.empty || '';
      });
    });
    
    return pageObj;
  };

  var getGrowthFromCache__ = function() {
    return getGrowth__(_growthCacheIndex.first).then(growth => {
      if (growth[_growthCacheIndex.second])
        return growth[_growthCacheIndex.second++];

      if (_growthCacheIndex.second) {
        _growthCacheIndex.second = 0;
        _growthCacheIndex.first++;
        return getGrowthFromCache__();
      }

      return null;
    });
  };

  var getGrowth__ = function(page, pageSize) {
    if (_growthCache[page])
      return Promise.resolve(_growthCache[page]);
    else {
      return DanganNetwork.call__('getGrowth', {
        pageNum: page+1,
        studentId: _studentId,
        pageSize: pageSize,
        termId: _termId
      }).then(result => {
        var growth = [];
        result[0] && result[0].data.forEach(r => {
          r.imgs.map((img,i) => growth.push({
            text: r.text,
            img: img,
            preview: r.preview[i]
          }));
        });

        if (!pageSize)
          _growthCache[page] = growth;

        return growth;
      });
    }
  };

  var savePage__ = function(page, svg, json) {
    if (LOG) console.log('Core.savePage__ for page '+page);
    if (LOG) console.log({svg: svg, json: json});

    return DanganNetwork.call('saveUserTmpl', {
      page: page+1,
      templateId: _userTemplate,
      svg: svg, json: json
    });
  };

  return {
    init__: init__,
    getPage__: page => _userTmpl[page],
    getGrowth__: getGrowth__,
    savePage__: savePage__
  };

}(undefined));