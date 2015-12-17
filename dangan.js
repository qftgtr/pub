var Dangan = (function(undefined) {
  var LOG = Math.max(LOG||0, 0);
  var _svg = DanganSVG(),
      _svg_hidden;
  
  var _page, _nPage, _pageChanged = false;
  
  var _imgUrl, _imgText; //, _imgId;
  
  
  var _svgInteractions = {
    onclick: function(d,i) {
      if (LOG) console.log('***onclick');
//      d.img = _image;
//      d3.select(this).attr('xlink:href', d.img);
    },
    ondragend: function(node) {
      if (LOG) console.log('***ondragend');
      if (_imgUrl) {
        _pageChanged = true;
        node.data.value = _imgUrl;
        d3.select(node.node).attr('xlink:href', _imgUrl);
        
        var className = node.node.getAttribute('class'),
            textNode = d3.select('.'+className.replace('image','text')).select('text');
        
        textNode.datum().value = _imgText;
        textNode.text(_imgText);
        
        _svg.wrapText(textNode);
      }
    },
    changeText: function(node, data) {
      if (LOG) console.log('***changeText');
      
      MXPreviewTools.openEdit('成长记录描述', data.value, function(text) {
        if (typeof text === 'string') {
          if (data.limit)
            text = text.substr(0,data.limit);
          
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
  
  var init = function(options, callback) {
    _svg.init(options.svgId, _svgInteractions);
    
    if (LOG) console.log('***init with method loadSystem');
    DanganCore.init(options.method||'autoRefresh', {//loadSystem
      studentId: options.studentId,
      sysTemplate: options.sysTemplate,
      userTemplate: options.userTemplate
    }).done(function(data) {
      if (LOG) console.log('***init get result back');
      
      _nPage = data.nPage;
      var w = data.width,
          h = data.height,
          zoom = Math.min(options.width/w, options.height/h);
      
      if (LOG>1) console.log({w: w, h: h, zoom: zoom});
      
      _svg.size(w, h, zoom);
      callback && callback.apply && callback(data);
      goPage(0);
      
      saveAllPages(data.save);
    });
  };
  
  var goPage = function(page, svg) {
    if (svg) {
      var __svg = svg;
    } else {
      var __svg = _svg;
      
      if (page === _page)
        return;
      
      if (_pageChanged) {
        savePage(_page);
        _pageChanged = false;
      }
      
      _page = page;
    }
    
    return DanganCore.getPage(page).done(function(layout) {
      if (svg || page === _page) {
        // if svg target is set or the selected is current page
        __svg.clear();
        __svg.put(layout);
        if (LOG > 1) console.log('***goPage done');
      }
    });
  };
  
  var savePage = function(page, svg) {
    if (!svg) {
      svg = _svg;
      page = page || _page;
      _pageChanged = false;
    }
    if (LOG) console.log('***savePage: '+page);
    DanganCore.savePage(page, svg.getSvg(), svg.getJson());
  };
  
  var saveAllPages = function(pages) {
    for (var i=0; i<_nPage; i++) {
      if (pages==='all' || pages.indexOf(i) > -1) {
        (function(__i) {
          $('body').append('<div id="svg-hidden-'+__i+'" style="display:hidden"></div>');
          var __svg_hidden = _svg.clone('svg-hidden-'+__i);
          goPage(__i, __svg_hidden).done(function() {
            savePage(__i, __svg_hidden);
            $('#svg-hidden-'+__i).empty();
          });
        }(i));
      }
    }
  }
  
    //page, 
  var getGrowth = function(page, callback) {
    DanganCore.getGrowth(page+1).done(function(result) {
      callback && callback.apply && callback(result);
    });
  };
  
  var setImage = function(url, text) {
    _imgUrl = url;
    _imgText = text || '成长记录无文字';
    _svg.draggingImage('start');
    return true;
  };
  
  var dragEnd = function() {
    _svg.dragEnd();
    _svg.draggingImage('end');
    _imgUrl = undefined;
    _imgText = undefined;
  };
  
  return {
    init: init,
    goPage: goPage,
    savePage: savePage,
    getGrowth: getGrowth,
    setImage: setImage,
    dragEnd: dragEnd,
    saveAllPages: saveAllPages
  }

}(undefined));