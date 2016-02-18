const DanganCore = (() => {
  let _studentId;
  let _userTemplate;
  let _sysTemplate;
  let _termId;

  let _nPage;
  let _tmplBasic;
  let _userTmpl = [];

  const _growthCache = [];
  const _growthCacheIndex = { first: 0, second: 0 };

  function _saveTmplBasic({ nPage, width, height, pages }) {
    _nPage = nPage;
    _tmplBasic = {
      nPage,
      width,
      height,
      titles: pages.map(page => page.title),
      remarks: pages.map(page => page.remark),
      save: undefined,
    };

    _userTmpl = new Array(_nPage);
    return _tmplBasic;
  }

  function _loadSystemTmpl__() {
    return DanganNetwork.call__('getSysTmpl', {
      templateId: _sysTemplate,
    }).then(result => result, reason => {
      throw new Error(`DanganCore load SYSTEM template: ${reason}`);
    });
  }

  function _loadUserTmpl__() {
    return DanganNetwork.call__('loadUserTmpl', {
      templateId: _userTemplate,
    }).then(result => result, reason => {
      throw new Error(`DanganCore load USER template: ${reason}`);
    });
  }

  function init__(method, { studentId, sysTemplate, userTemplate, termId } = {}) {
    if (LOG) console.log('Core.init__ for method '+method);

    if (method !== 'randomGrowth') {
      [_studentId, _sysTemplate, _userTemplate, _termId] =
        [studentId, sysTemplate, userTemplate, termId];
    }
    _growthCacheIndex.first = 0;
    _growthCacheIndex.second = 0;

    if (method === 'loadSystem' || method === 'randomGrowth') {
      return _loadSystemTmpl__().then(result => {
        let basicData;
        try {
          basicData = _saveTmplBasic(result);
          basicData.save = 'all';
        } catch (err) {
          throw new Error(`DanganCore saveTmplBasic\n  ${JSON.stringify(result)}\n  ${err}`);
        }

        result.pages.forEach(({ json, bg, bg2 }, page) => {
          const pageObj = JSON.parse(json);
          [pageObj.bg, pageObj.bg2] = [bg, bg2];

          _userTmpl[page] = _parseTmpl__(page, pageObj, method==='randomGrowth');
        });

        return basicData;
      });
    }

    if (method === 'loadUser' || method === 'autoRefresh') {
      return _loadUserTmpl__().then(result => {
        let basicData;
        try {
          basicData = _saveTmplBasic(result);
          basicData.save = [];
        } catch (err) {
          throw new Error(`DanganCore saveTmplBasic\n  ${JSON.stringify(result)}\n  ${err}`);
        }

        const needSysPages = basicData.save;
        result.pages.forEach(({ json, bg, bg2 }, page) => {
          if (json === '') needSysPages.push(page);
          else if (method === 'loadUser') _userTmpl[page] = Promise.resolve(JSON.parse(json));
          else _userTmpl[page] = _parseTmpl__(page, JSON.parse(json));
        });


        if (needSysPages.length) {
          _loadSystemTmpl__().then(({ pages }) => {
            needSysPages.forEach(page => {
              const pageData = pages[page];
              const pageObj = JSON.parse(pageData.json);
              [pageObj.bg, pageObj.bg2] = [pageData.bg, pageData.bg2];

              _userTmpl[page] = _parseTmpl__(page, pageObj);
            });
          });
        }

        return basicData;
      });
    }

    throw new Error(`DanganCore unknown method: ${method}`);
  }

  function _parseTmpl__(page, pageObj, randomGrowth) {
    let __promises = [];

    try {
      pageObj.elem.forEach.apply;
    } catch (err) {
      throw new Error(`DanganCore parseTmpl[${page}]:
  ${err}
  ${JSON.stringify(pageObj)}`);
    }

    pageObj.elem.forEach(({ data, growth, query, key, filter } = {}, index) => {
      if (!data) {
        throw new Error(`DanganCore parseTmpl[${page}] data:
  ${JSON.stringify(pageObj.elem[index])}`);
      }

      if (growth) {
        if (randomGrowth) {
          const ps = data.map(d => {
            return getGrowthFromCache__().then(({ img, text }) => {
              try {
                d.value = img || DanganUtil.defaultGrowth;
                d.gText = text || undefined;
              } catch (err) {
                throw new Error(`DanganCore parseTmpl[${page}] put random growth
  growth: ${img} && ${text}
  target: ${JSON.stringify(d)}
  ${err}`);
              }
            });
          });
          __promises = __promises.concat(ps);
        } else {
          const p = DanganNetwork.call__('getGrowth', {
            tagId: growth,
            pageNum: 0,
            pageSize: data.length,
            studentId: _studentId
          }).then(result => {
            try {
              data.forEach((d, i) => {
                try {
                  d.value = d.value || result[0].data[i].imgs[0];
                  d.gText = d.gText || result[0].data[i].text;
                } catch (err) {
                  d.value = DanganUtil.defaultGrowth;
                  d.gText = '';
                }
              });
            } catch (err) {
              throw new Error(`DanganCore parseTmpl[${page}] put growth
  growth: ${JSON.stringify(result)}
  target: ${JSON.stringify(data)}
  ${err}`);
            }
          });
          __promises.push(p);
        }
      }

      if (query) {
        const p = DanganNetwork.delay__('getData', query).then(result => {
          try {
            const resultData = _handleFilter(result.data, filter, key) || [];
            data.forEach((d, i) => { d.value = resultData[i]; });
          } catch (err) {
            throw new Error(`DanganCore parseTmpl[${page}] query
  result: ${JSON.stringify(result)}
  target: ${JSON.stringify(data)}
  ${err}`);
          }
        });
        __promises.push(p);
      } else {
        try {
          data.forEach(d => {
            if (!d.query) return;

            const p = DanganNetwork.delay__('getData', d.query).then(result => {
              d.value = (d.filter && result.length) ? _handleFilter(result, d.filter) : result.data;
            });
            __promises.push(p);
          });
        } catch (err) {
          throw new Error(`DanganCore parseTmpl[${page}] query
  result: ${JSON.stringify(result)}
  target: ${JSON.stringify(data)}
  ${err}`);
        }
      }
    });

    __promises.push(DanganNetwork.call__('getData', {
      studentId: _studentId,
      termId: _termId,
    }).then(result => result, reason => {
      throw new Error(`DanganCore getData query: ${reason}`);
    }));

    return Promise.all(__promises).then(() => {
      if (LOG>2) console.log(`Core._parseHelper for page ${page}`, pageObj);
      return _parseHelper(pageObj);
    });
  }

  function _handleFilter(data, filter, key) {
    let resultData = data;
    if (filter && DanganUtil.filters[filter]) {
      resultData = DanganUtil.filters[filter](data || []);
    }
    if (key) resultData = resultData.map(d => d[key]);
    return resultData;
  }

  function _parseHelper(pageObj) {
    pageObj.elem.forEach(elem => {
      elem.data.forEach(d => {
        const h = d.helper || elem.helper;
        if (h && DanganUtil.helpers[h]) {
          if (LOG>2) console.log(`Core._parseHelper for helper ${h}`);
          DanganUtil.helpers[h](d);
        }
        d.value = d.value || d.empty || '';
      });
    });
    return pageObj;
  }

  function getGrowthFromCache__() {
    return getGrowth__(_growthCacheIndex.first).then(growth => {
      if (growth[_growthCacheIndex.second]) {
        return growth[_growthCacheIndex.second++];
      }

      if (_growthCacheIndex.second) {
        _growthCacheIndex.second = 0;
        _growthCacheIndex.first++;
        return getGrowthFromCache__();
      }

      return {};
    });
  }

  function getGrowth__(page, pageSize) {
    if (_growthCache[page]) {
      return Promise.resolve(_growthCache[page]);
    }

    return DanganNetwork.call__('getGrowth', {
      pageSize,
      pageNum: page + 1,
      studentId: _studentId,
      termId: _termId,
    }).then(result => {
      const growth = [];
      if (result[0]) {
        result[0].data.forEach(r => {
          r.imgs.map((img, i) => growth.push({
            img,
            text: r.text,
            preview: r.preview[i],
          }));
        });
      }

      if (!pageSize) _growthCache[page] = growth;

      return growth;
    });
  }

  function savePage__(page, svg, json) {
    if (LOG) console.log(`Core.savePage__ for page ${page}`, {svg, json});

    return DanganNetwork.call__('saveUserTmpl', {
      svg,
      json,
      page: page+1,
      templateId: _userTemplate,
    });
  }

  return {
    init__,
    getGrowth__,
    savePage__,
    getPage__: page => _userTmpl[page],
  };
})();
