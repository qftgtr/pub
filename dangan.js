'use strict';

var Dangan = function (undefined) {
  //var LOG = Math.max(LOG||0, 0);
  var _svg = DanganSVG(),
      _svg_hidden;

  var _page,
      _nPage,
      _pageChanged = false;

  var _imgUrl, _imgText; //, _imgId;

  var _svgInteractions = {
    onchange: function onchange(d, i) {
      if (LOG) console.log('***onchange');
      _pageChanged = true;
    },
    ondragend: function ondragend(node) {
      if (LOG) console.log('***ondragend');
      if (_imgUrl) {
        _pageChanged = true;
        node.data.value = _imgUrl;
        d3.select(node.node).attr('xlink:href', '/static/images/print/MX_loading.png');
        d3.select(node.node).attr('xlink:href', _imgUrl);

        var className = node.node.getAttribute('class'),
            textNode = d3.select('.' + className.replace('image', 'text')).select('text');

        textNode.datum().value = _imgText;
        textNode.text(_imgText);

        _svg.wrapText(textNode);
      }
    },
    changeText: function changeText(node, data) {
      if (LOG) console.log('***changeText');

      MXPreviewTools.openEdit('成长记录描述', data.value, function (text) {
        if (typeof text === 'string') {
          if (data.limit) text = text.substr(0, data.limit);

          _pageChanged = true;
          text = text || '点击添加成长记录文字';
          data.value = text;

          _svg.wrapText(d3.select(node).text(text));
        }
      });

      //      var text = prompt('成长记录描述', data.value);
      //      if (typeof text === 'string') {
      //        _pageChanged = true;
      //        text = text || '点击添加成长记录文字';
      //        data.value = text;
      //        d3.select(node).text(text);
      //      }
    }
  };

  var init = function init(options, callback) {
    _svg.init(options.svgId, _svgInteractions, options.rotate);

    if (LOG) console.log('***init with method loadSystem');
    DanganCore.init__(options.method || 'autoRefresh', {
      studentId: options.studentId,
      sysTemplate: options.sysTemplate,
      userTemplate: options.userTemplate,
      termId: options.termId
    }).then(function (tmplBasic) {
      if (LOG) console.log('***init get result back');
      _nPage = tmplBasic.nPage;

      var w = tmplBasic.width;
      var h = tmplBasic.height;
      var zoom = Math.min(options.width / w, options.height / h);
      _svg.size(w, h, zoom);

      callback && callback.apply && callback(tmplBasic);
      goPage__(0);

      saveAllPages(tmplBasic.save, function () {});
    });
  };

  var goPage__ = function goPage__(page, svg, fullBg) {
    if (svg) {
      var __svg = svg;
    } else {
      var __svg = _svg;

      if (page === _page) return;

      if (_pageChanged) {
        savePage(_page);
        _pageChanged = false;
      }

      _page = page;
    }

    return DanganCore.getPage__(page).then(function (layout) {
      if (svg || page === _page) {
        // if svg target is set or the selected is current page
        __svg.clear();
        __svg.put(layout, fullBg);
        if (LOG > 1) console.log('***goPage done');
      }
    });
  };

  function savePage() {
    var page = arguments.length <= 0 || arguments[0] === undefined ? _page : arguments[0];
    var callback = arguments[1];
    var alertCallback = arguments[2];

    var nEmpty = 0;
    var _svg_hidden = _svg.clone($('<div id="svg-hidden-' + page + '"></div>')[0]);
    goPage__(page, _svg_hidden, true).then(function () {
      setTimeout(function () {
        //if (LOG) console.log('***savePage: '+page);
        var svgStr = _svg_hidden.getSvg(function (x) {
          nEmpty += x;
        });

        if (svgStr.indexOf('polygon') > -1 && svgStr.indexOf('points') < 0) {
          //    		console.log('%%%%%%%%%%%%%wait');
          var h = setInterval(function () {
            svgStr = _svg_hidden.getSvg();
            if (svgStr.indexOf('polygon') > -1 && svgStr.indexOf('points') < 0) {
              //    				console.log('%%%%%%%%%%%%%wait');
            } else {
                //    				console.log(svgStr);
                var json = _svg_hidden.getJson(),
                    incomplete = _checkCompleteness(page, svgStr, json);

                if (incomplete) {
                  alertCallback && alertCallback.apply && alertCallback(incomplete);
                }

                DanganCore.savePage__(page, svgStr, JSON.stringify(json)).then(function (result) {
                  if (callback && callback.apply) {
                    callback(page, nEmpty);
                  } else {
                    //                        console.log('保存成功');
                  }
                });

                $('#svg-hidden-' + page).empty();
                _pageChanged = false;

                clearInterval(h);
              }
          }, 200);
        } else {
          var json = _svg_hidden.getJson(),
              incomplete = _checkCompleteness(page, svgStr, json);

          if (incomplete) {
            alertCallback && alertCallback.apply && alertCallback(incomplete);
          }

          DanganCore.savePage__(page, svgStr, JSON.stringify(json)).then(function (result) {
            if (callback && callback.apply) {
              callback(page, nEmpty);
            } else {
              //                console.log('保存成功');
            }
          });

          $('#svg-hidden-' + page).empty();
          _pageChanged = false;
        }
      }, 200);
    });
  }

  function saveAllPages(pages, callback, alertCallback) {
    callback = callback || function () {
      DanganMask.setMsg('已成功保存！');
    };
    var pageDone = 0,
        nEmpty = 0;
    var fail;
    for (var i = 0; i < _nPage; i++) {
      if (pages === 'all' || pages.indexOf(i) > -1) {
        savePage(i, function (page, empty) {
          pageDone++;
          nEmpty += empty;
          //          console.log('xxxxxxxxx'+_nPage+'xxxxxx'+pageDone+'xxxx'+empty+'xxx'+nEmpty);
          if (pageDone === _nPage && !fail) callback && callback.apply && callback(nEmpty);
        }, function (msg) {
          fail = true;
          alertCallback && alertCallback.apply ? alertCallback(msg) : DanganMask.setMsg(msg);
        });
      }
    }
  }

  function getGrowth(page, callback) {
    DanganCore.getGrowth__(page).then(function (result) {
      callback && callback.apply && callback(result);
    });
  }

  function setImage(url, text) {
    _imgUrl = url;
    _imgText = text || '成长记录无文字';
    _svg.draggingImage('start');
    return true;
  }

  function dragEnd() {
    _svg.dragEnd();
    _svg.draggingImage('end');
    _imgUrl = undefined;
    _imgText = undefined;
  };

  function randomGrowth() {
    DanganMask.setMsg('目前系统是根据学生的德智体美劳模块选取的成长照片，如果您选择随机填充成长照片，则成长照片无法按成长标签分布，请知晓', undefined, true, function () {
      DanganCore.init__('randomGrowth').done(function (data) {
        if (LOG) console.log('***init get result back');

        $('.click')[0].click();
        goPage__(0);

        saveAllPages(data.save, function () {});
      });
    });
  };

  function _checkCompleteness(page, svg, json) {
    if (LOG) console.log('check completeness');

    if (page === 0) {
      if (LOG) console.log({ page: page, svg: svg, json: json, value: json.elem[0].data[0].value });

      if (json.elem[0].data[0].value) return false;else return '基本信息无数据，请您刷新后重试';
    }

    if (page === 1) {
      if (LOG) console.log({ page: page, svg: svg, json: json, value: json.elem[0].data[0].value });

      if (json.elem[0].data[0].value !== '/static/images/print/template/classs_photo_default.png') return false;else return '班级合影页无数据，请联系班主任上传';
    }

    if (page === 3) {
      var nSubjects = 0;
      for (var i = 0; i < 9; i++) {
        if (json.elem[0].data[i].value) nSubjects++;
      }

      if (LOG) console.log({ page: page, svg: svg, json: json, value: nSubjects });

      if (nSubjects >= 4) return false;else return '期末考试还未发布或考试科目不全，请联系班主任发布成绩';
    }

    if (page === 16) {
      if (LOG) console.log({
        page: page, svg: svg, json: json,
        value: json.elem[3].data[4].value,
        value2: json.elem[3].data[9].value
      });

      if (json.elem[3].data[4].value && json.elem[3].data[9].value) return false;else return '艺术素质测评数据缺失，请检查艺术测评自我评价或联系音乐美术老师补充评价数据';
    }

    if (page === 17) {
      if (LOG) console.log({
        page: page, svg: svg, json: json,
        value: json.elem[4].data[0].value,
        value2: json.elem[4].data[1].value
      });

      if (json.elem[4].data[0].value !== '暂无评价' && json.elem[4].data[1].value !== '暂无评价' && json.elem[4].data[2].value !== '暂无评价') return false;else return '艺术素质测评数据缺失，请检查艺术测评自我评价或联系音乐美术老师补充评价数据';
    }
  };

  return {
    init: init,
    savePage: savePage,
    getGrowth: getGrowth,
    setImage: setImage,
    dragEnd: dragEnd,
    saveAllPages: saveAllPages,
    randomGrowth: randomGrowth,
    goPage: goPage__
  };
}(undefined);