var Dangan = (function(undefined) {
  //var LOG = Math.max(LOG||0, 0);
  var _svg = DanganSVG(),
      _svg_hidden;
  
  var _page, _nPage, _pageChanged = false;
  
  var _imgUrl, _imgText; //, _imgId;
  
  
  var _svgInteractions = {
    onchange: function(d,i) {
      if (LOG) console.log('***onchange');
      _pageChanged = true;
    },
    ondragend: function(node) {
      if (LOG) console.log('***ondragend');
      if (_imgUrl) {
        _pageChanged = true;
        node.data.value = _imgUrl;
        d3.select(node.node).attr('xlink:href', '/static/images/print/MX_loading.png');
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
    _svg.init(options.svgId, _svgInteractions, options.rotate);
    
    if (LOG) console.log('***init with method loadSystem');
    DanganCore.init(options.method||'autoRefresh', {//loadSystem
      studentId: options.studentId,
      sysTemplate: options.sysTemplate,
      userTemplate: options.userTemplate,
      termId: options.termId
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
  
  var goPage = function(page, svg, fullBg) {
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
        __svg.put(layout, fullBg);
        if (LOG > 1) console.log('***goPage done');
      }
    });
  };
  
  var savePage = function(page, callback) {
    page = page || _page;
    
    var nEmpty = 0;
    var _svg_hidden = _svg.clone($('<div id="svg-hidden-'+page+'"></div>')[0]);
    goPage(page, _svg_hidden, true).done(function() {
      var _page = page;
      setTimeout(function() {
        //if (LOG) console.log('***savePage: '+page);
    	var svgStr = _svg_hidden.getSvg(function(x) {nEmpty+=x;});
    	
    	if (svgStr.indexOf('polygon')>-1 && svgStr.indexOf('points')<0) {
//    		console.log('%%%%%%%%%%%%%wait');
    		var h = setInterval(function() {
    			svgStr = _svg_hidden.getSvg();
    			if (svgStr.indexOf('polygon')>-1 && svgStr.indexOf('points')<0) {
//    				console.log('%%%%%%%%%%%%%wait');
    			} else {
//    				console.log(svgStr);
    				DanganCore.savePage(page, svgStr, _svg_hidden.getJson()).done(function(result) {
                      if (callback && callback.apply) {
                        callback(_page, nEmpty);
                      } else {
//                        console.log('保存成功');
                      }
                    });
        	        $('#svg-hidden-'+page).empty();
        	        _pageChanged = false;
        	        
        	        clearInterval(h);
    			}
    		}, 200);
    	} else {
    		DanganCore.savePage(page, svgStr, _svg_hidden.getJson()).done(function(result) {
              if (callback && callback.apply) {
                callback(_page, nEmpty);
              } else {
//                console.log('保存成功');
              }
              
            });
	        $('#svg-hidden-'+page).empty();
	        _pageChanged = false;
    	}
    	
        
      }, 200);
    });
  };
  
  var saveAllPages = function(pages, callback) {
    var pageDone = 0, nEmpty=0;
    for (var i=0; i<_nPage; i++) {
      if (pages==='all' || pages.indexOf(i) > -1) {
        savePage(i, function(page,empty) {
          pageDone++;
          nEmpty += empty;
//          console.log('xxxxxxxxx'+_nPage+'xxxxxx'+pageDone+'xxxx'+empty+'xxx'+nEmpty);
          if (pageDone === _nPage)
            callback && callback.apply && callback(nEmpty);
        });
      }
    }
  };
  
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
  
//  var _randomGrowth
  
  var randomGrowth = function() {
    getGrowth(0, function(i) {
      
    });
  };
  
  return {
    init: init,
    goPage: goPage,
    savePage: savePage,
    getGrowth: getGrowth,
    setImage: setImage,
    dragEnd: dragEnd,
    saveAllPages: saveAllPages,
    randomGrowth: randomGrowth
  }

}(undefined));