const DanganNetwork = window.DanganNetwork,
      DanganUtil = window.DanganUtil;
window.DanganCore = (function(undefined) {
  //var LOG = Math.max(LOG||0,0);
  var _width, _height, _nPage, _titles, _remarks,
      _sysTmpl = [], _userTmpl = [],
      _pageReady = [], // undefined for nothing, false for sysTmpl, true for userTmpl
      _growthCache = [], _growthCacheIndex = {first: 0, second: 0};
  
  var _studentId, _userTemplate, _sysTemplate, _termId;

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
                  d.value = DanganUtil.defaultGrowth;
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
                  d.value = d.value || DanganUtil.defaultGrowth;
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

            if (filter && DanganUtil.filters[filter]) {
              resultData = DanganUtil.filters[filter](resultData);
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
              if (filter && DanganUtil.filters[filter]) {
                data = DanganUtil.filters[filter](result || []);
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
        if (h && DanganUtil.helpers[h]) {
          if (LOG) console.log('Core.(helper) '+h);
          DanganUtil.helpers[h](d);
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
