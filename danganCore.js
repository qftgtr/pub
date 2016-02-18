'use strict';

var DanganCore = function () {
  var _studentId = undefined;
  var _userTemplate = undefined;
  var _sysTemplate = undefined;
  var _termId = undefined;

  var _nPage = undefined;
  var _tmplBasic = undefined;
  var _userTmpl = [];

  var _growthCache = [];
  var _growthCacheIndex = { first: 0, second: 0 };

  function _saveTmplBasic(_ref) {
    var nPage = _ref.nPage;
    var width = _ref.width;
    var height = _ref.height;
    var pages = _ref.pages;

    _nPage = nPage;
    _tmplBasic = {
      nPage: nPage,
      width: width,
      height: height,
      titles: pages.map(function (page) {
        return page.title;
      }),
      remarks: pages.map(function (page) {
        return page.remark;
      }),
      save: undefined
    };

    _userTmpl = new Array(_nPage);
    return _tmplBasic;
  }

  function _loadSystemTmpl__() {
    return DanganNetwork.call__('getSysTmpl', {
      templateId: _sysTemplate
    }).then(function (result) {
      return result;
    }, function (reason) {
      throw new Error('DanganCore load SYSTEM template: ' + reason);
    });
  }

  function _loadUserTmpl__() {
    return DanganNetwork.call__('loadUserTmpl', {
      templateId: _userTemplate
    }).then(function (result) {
      return result;
    }, function (reason) {
      throw new Error('DanganCore load USER template: ' + reason);
    });
  }

  function init__(method) {
    var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var studentId = _ref2.studentId;
    var sysTemplate = _ref2.sysTemplate;
    var userTemplate = _ref2.userTemplate;
    var termId = _ref2.termId;

    if (LOG) console.log('Core.init__ for method ' + method);

    if (method !== 'randomGrowth') {
      _studentId = studentId;
      _sysTemplate = sysTemplate;
      _userTemplate = userTemplate;
      _termId = termId;
    }
    _growthCacheIndex.first = 0;
    _growthCacheIndex.second = 0;

    if (method === 'loadSystem' || method === 'randomGrowth') {
      return _loadSystemTmpl__().then(function (result) {
        var basicData = undefined;
        try {
          basicData = _saveTmplBasic(result);
          basicData.save = 'all';
        } catch (err) {
          throw new Error('DanganCore saveTmplBasic\n  ' + JSON.stringify(result) + '\n  ' + err);
        }

        result.pages.forEach(function (_ref3, page) {
          var json = _ref3.json;
          var bg = _ref3.bg;
          var bg2 = _ref3.bg2;

          var pageObj = JSON.parse(json);
          var _ref4 = [bg, bg2];
          pageObj.bg = _ref4[0];
          pageObj.bg2 = _ref4[1];


          _userTmpl[page] = _parseTmpl__(page, pageObj, method === 'randomGrowth');
        });

        return basicData;
      });
    }

    if (method === 'loadUser' || method === 'autoRefresh') {
      return _loadUserTmpl__().then(function (result) {
        var basicData = undefined;
        try {
          basicData = _saveTmplBasic(result);
          basicData.save = [];
        } catch (err) {
          throw new Error('DanganCore saveTmplBasic\n  ' + JSON.stringify(result) + '\n  ' + err);
        }

        var needSysPages = basicData.save;
        result.pages.forEach(function (_ref5, page) {
          var json = _ref5.json;
          var bg = _ref5.bg;
          var bg2 = _ref5.bg2;

          if (json === '') needSysPages.push(page);else if (method === 'loadUser') _userTmpl[page] = Promise.resolve(JSON.parse(json));else _userTmpl[page] = _parseTmpl__(page, JSON.parse(json));
        });

        if (needSysPages.length) {
          _loadSystemTmpl__().then(function (_ref6) {
            var pages = _ref6.pages;

            needSysPages.forEach(function (page) {
              var pageData = pages[page];
              var pageObj = JSON.parse(pageData.json);
              var _ref7 = [pageData.bg, pageData.bg2];
              pageObj.bg = _ref7[0];
              pageObj.bg2 = _ref7[1];


              _userTmpl[page] = _parseTmpl__(page, pageObj);
            });
          });
        }

        return basicData;
      });
    }

    throw new Error('DanganCore unknown method: ' + method);
  }

  function _parseTmpl__(page, pageObj, randomGrowth) {
    var __promises = [];

    try {
      pageObj.elem.forEach.apply;
    } catch (err) {
      throw new Error('DanganCore parseTmpl[' + page + ']:\n  ' + err + '\n  ' + JSON.stringify(pageObj));
    }

    pageObj.elem.forEach(function () {
      var _ref8 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var data = _ref8.data;
      var growth = _ref8.growth;
      var query = _ref8.query;
      var key = _ref8.key;
      var filter = _ref8.filter;
      var index = arguments[1];

      if (!data) {
        throw new Error('DanganCore parseTmpl[' + page + '] data:\n  ' + JSON.stringify(pageObj.elem[index]));
      }

      if (growth) {
        if (randomGrowth) {
          var ps = data.map(function (d) {
            return getGrowthFromCache__().then(function (_ref9) {
              var img = _ref9.img;
              var text = _ref9.text;

              try {
                d.value = img || DanganUtil.defaultGrowth;
                d.gText = text || undefined;
              } catch (err) {
                throw new Error('DanganCore parseTmpl[' + page + '] put random growth\n  growth: ' + img + ' && ' + text + '\n  target: ' + JSON.stringify(d) + '\n  ' + err);
              }
            });
          });
          __promises = __promises.concat(ps);
        } else {
          var p = DanganNetwork.call__('getGrowth', {
            tagId: growth,
            pageNum: 0,
            pageSize: data.length,
            studentId: _studentId
          }).then(function (result) {
            try {
              data.forEach(function (d, i) {
                try {
                  d.value = d.value || result[0].data[i].imgs[0];
                  d.gText = d.gText || result[0].data[i].text;
                } catch (err) {
                  d.value = DanganUtil.defaultGrowth;
                  d.gText = '';
                }
              });
            } catch (err) {
              throw new Error('DanganCore parseTmpl[' + page + '] put growth\n  growth: ' + JSON.stringify(result) + '\n  target: ' + JSON.stringify(data) + '\n  ' + err);
            }
          });
          __promises.push(p);
        }
      }

      if (query) {
        var p = DanganNetwork.delay__('getData', query).then(function (result) {
          try {
            (function () {
              var resultData = _handleFilter(result.data, filter, key) || [];
              data.forEach(function (d, i) {
                d.value = resultData[i];
              });
            })();
          } catch (err) {
            throw new Error('DanganCore parseTmpl[' + page + '] query\n  result: ' + JSON.stringify(result) + '\n  target: ' + JSON.stringify(data) + '\n  ' + err);
          }
        });
        __promises.push(p);
      } else {
        try {
          data.forEach(function (d) {
            if (!d.query) return;

            var p = DanganNetwork.delay__('getData', d.query).then(function (result) {
              d.value = d.filter && result.length ? _handleFilter(result, d.filter) : result.data;
            });
            __promises.push(p);
          });
        } catch (err) {
          throw new Error('DanganCore parseTmpl[' + page + '] query\n  result: ' + JSON.stringify(result) + '\n  target: ' + JSON.stringify(data) + '\n  ' + err);
        }
      }
    });

    __promises.push(DanganNetwork.call__('getData', {
      studentId: _studentId,
      termId: _termId
    }).then(function (result) {
      return result;
    }, function (reason) {
      throw new Error('DanganCore getData query: ' + reason);
    }));

    return Promise.all(__promises).then(function () {
      return _parseHelper(pageObj);
    });
  }

  function _handleFilter(data, filter, key) {
    var resultData = data;
    if (filter && DanganUtil.filters[filter]) {
      resultData = DanganUtil.filters[filter](data || []);
    }
    if (key) resultData = resultData.map(function (d) {
      return d[key];
    });
    return resultData;
  }

  function _parseHelper(pageObj) {
    pageObj.elem.forEach(function (elem) {
      elem.data.forEach(function (d) {
        var h = d.helper || elem.helper;
        if (h && DanganUtil.helpers[h]) {
          DanganUtil.helpers[h](d);
        }
        d.value = d.value || d.empty || '';
      });
    });
    return pageObj;
  }

  function getGrowthFromCache__() {
    return getGrowth__(_growthCacheIndex.first).then(function (growth) {
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
      pageSize: pageSize,
      pageNum: page + 1,
      studentId: _studentId,
      termId: _termId
    }).then(function (result) {
      var growth = [];
      if (result[0]) {
        result[0].data.forEach(function (r) {
          r.imgs.map(function (img, i) {
            return growth.push({
              img: img,
              text: r.text,
              preview: r.preview[i]
            });
          });
        });
      }

      if (!pageSize) _growthCache[page] = growth;

      return growth;
    });
  }

  function savePage__(page, svg, json) {
    return DanganNetwork.call__('saveUserTmpl', {
      svg: svg,
      json: json,
      page: page + 1,
      templateId: _userTemplate
    }).then(function (result) {
      return result;
    }, function (reason) {
      throw new Error('DanganCore save[' + page + ']\n  svg: ' + svg + '\n  json: ' + json + '\n  ' + reason);
    });
  }

  return {
    init__: init__,
    getGrowth__: getGrowth__,
    savePage__: savePage__,
    getPage__: function getPage__(page) {
      return _userTmpl[page];
    }
  };
}();