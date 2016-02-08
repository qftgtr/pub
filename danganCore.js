'use strict';
const DanganNetwork = window.DanganNetwork,
      DanganUtil = window.DanganUtil;
window.DanganCore = (function(undefined) {
  let _studentId, _userTemplate, _sysTemplate, _termId,
      _nPage, _tmplBasic, _userTmpl = [],
      _growthCache = [], _growthCacheIndex = { first: 0, second: 0 };

  function _saveTmplBasic({ nPage, width, height, pages }) {
    if (LOG>2) console.log('Core._saveTmplData');
    
    _nPage = nPage;
    _tmplBasic = {
      nPage,
      width,
      height,
      titles: pages.map(page => page.title),
      remarks: pages.map(page => page.remark),
      save: undefined;
    };
    
    _userTmpl = new Array(_nPage);
    
    if (LOG>2) console.log(_tmplBasic);
    return _tmplBasic;
  };

  function _loadSystemTmpl__() {
    if (LOG) console.log('Core._loadSystemTmpl__');
    return DanganNetwork.call__('getSysTmpl', {
      templateId: _sysTemplate
    });
  };

  function _loadUserTmpl__() {
    if (LOG) console.log('Core._loadUserTmpl__');
    return DanganNetwork.call__('loadUserTmpl', {
      templateId: _userTemplate
    });
  };

  function init__(method, { studentId, sysTemplate, userTemplate, termId }) {
    if (LOG) console.log('Core.init__ for method '+method);

    [_studentId, _sysTemplate, _userTemplate, _termId] = 
      [studentId, sysTemplate, userTemplate, termId];
    _growthCacheIndex = {first: 0, second: 0};

    if (method === 'loadSystem' || method === 'randomGrowth') {
      return _loadSystemTmpl__().then(result => {
        let basicData = _saveTmplBasic(result);
        basicData.save = 'all';

        result.pages.forEach(({json, bg, bg2}, page) => {
          if (LOG>2) console.log('Core.init__.(sysTmpl json) for page '+page);
          if (LOG>2) console.log(json);
          
          let pageObj = JSON.parse(json);
          [pageObj.bg, pageObj.bg2] = [bg, bg2];
          
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

        result.pages.forEach(({json, bg, bg2}, page) => {
          if (LOG>2) console.log('Core.init__.(userTmpl json) for page '+page);
          if (LOG>2) console.log(json);

          if (json === '')
            needSysPages.push(page);
          else if (method === 'loadUser')
            _userTmpl[page] = Promise.resolve(JSON.parse(json));
          else
            _userTmpl[page] = _parseTmpl__(page, JSON.parse(json));
        });


        if (needSysPages.length) {
          _loadSystemTmpl__().then(({pages}) => {
            needSysPages.forEach(page => {
              const pageData = pages[page];
              let pageObj = JSON.parse(pageData.json);
              [pageObj.bg, pageObj.bg2] = [pageData.bg, pageData.bg2];
              
              _userTmpl[page] = _parseTmpl__(page, pageObj);
            });
          });
        }
        
        if (LOG) console.log('Core.init__ resolved');
        return basicData;
      });
    }
  };

  function _parseTmpl__(page, pageObj, randomGrowth) {
    if (LOG > 1) console.log(`Core._parseTmpl__ for page ${page}`);

    let __promises = [];
    
    if (!pageObj.elem)
      throw new Error(`pageObj.elem empty for page ${page}`);
    
    pageObj.elem.forEach(({data, growth, query, key, filter}) => {
      if (growth) {
        if (randomGrowth) {
          const ps = data.map(d => {
            return getGrowthFromCache().then(({img, text}) => {
              d.value = img || DanganUtil.defaultGrowth;
              d.gText = text || undefined;
            });
          });
          __promises = __promises.concat(ps);
        } else {
          const p = DanganNetwork.call__('getGrowth', {
            tagId: growth,
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
          __promises.push(p);
        }
      }
      
      if (query) {
        const p = DanganNetwork.delay__('getData', query).then(result => {
          const resultData = _handleFilter(result.data, filter, key) || result.data || [];
          data.forEach((d,i) => { d.value = resultData[i]; });
        });
        __promises.push(p);        
      } else {
        data.forEach(d => {
          if (!d.query) return;
          
          const p = DanganNetwork.delay__('getData', d.query).then(result => {
            d.value = (d.filter && result.length) ? _handleFilter(result, d.filter) : result.data;
          });
          __promises.push(p);
        });
      }
    });
    
    __promises.push(DanganNetwork.call__('getData', {
      studentId: _studentId,
      termId: _termId
    }));

    return Promise.all(__promises).then(() => {
      if (LOG>2) console.log(`Core._parseHelper for page ${page}`);
      if (LOG>2) console.log([JSON.stringify(pageObj)]);
      return _parseHelper(pageObj);
    });
  };

  function _handleFilter(data, filter, key) {
    if (filter && DanganUtil.filters[filter]) {
      const resultData = DanganUtil.filters[filter](data || []);
      if (key)
        return resultData.map(d => d.key);
      else
        return resultData;
    }
  };
  
  function _parseHelper(pageObj) {
    pageObj.elem.forEach(elem => {
      elem.data.forEach(d => {
        const h = d.helper || elem.helper;
        if (h && DanganUtil.helpers[h]) {
          if (LOG>2) console.log('Core._parseHelper for helper '+h);
          DanganUtil.helpers[h](d);
        }
        d.value = d.value || d.empty || '';
      });
    });
    return pageObj;
  }

  function getGrowthFromCache__() {
    return getGrowth__(_growthCacheIndex.first).then(growth => {
      if (growth[_growthCacheIndex.second])
        return growth[_growthCacheIndex.second++];

      if (_growthCacheIndex.second) {
        _growthCacheIndex.second = 0;
        _growthCacheIndex.first++;
        return getGrowthFromCache__();
      }

      return {};
    });
  }

  function getGrowth__(page, pageSize) {
    if (_growthCache[page])
      return Promise.resolve(_growthCache[page]);
    else {
      return DanganNetwork.call__('getGrowth', {
        pageSize,
        pageNum: page+1,
        studentId: _studentId,
        termId: _termId
      }).then(result => {
        let growth = [];
        result[0] && result[0].data.forEach(r => {
          r.imgs.map((img,i) => growth.push({
            img,
            text: r.text,
            preview: r.preview[i]
          }));
        });

        if (!pageSize)
          _growthCache[page] = growth;

        return growth;
      });
    }
  }

  function savePage__(page, svg, json) {
    if (LOG) console.log('Core.savePage__ for page '+page);
    if (LOG) console.log({svg, json});

    return DanganNetwork.call__('saveUserTmpl', {
      svg,
      json,
      page,
      templateId: _userTemplate,
    });
  }

  return {
    init__,
    getGrowth__,
    savePage__,
    getPage__: page => _userTmpl[page],
  };
}(undefined));