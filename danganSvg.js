// svg 排版, requires d3, d3textwrap
var DanganSVG = function() {
  var undefined = undefined, $ = jQuery;
  
  var dev_ip = 'http://preevaluate.mexue.com';
  var LOG = Math.max(LOG||0, 1);
  var _target, _svg,
      _defs, _elements, _bg,
      _interactions, _flag = '';
  
  var _width, _height, _zoom;
  
  var _layout; // data object
  
  var _overNode;
  var init = function(targetId, interactions) {
    _target = d3.select('#'+targetId);
    _svg = _target.append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('version', '1.1')
      .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('id', 'dangan-svg');
    
    _svg.append('style').attr('type', 'text/css')
      .text('text,tspan{font-family:"SimHei";}');
    
    _bg = _svg.append('image').attr('id', 'dangan-background');
    _defs = _svg.append('defs').attr('id', 'dangan-defs');
    _elements = _svg.append('g').attr('id', 'dangan-elements');
    _interactions = {
      click: interactions.onclick || function() {},
      drag: interactions.ondragend || function() {},
      changeText: interactions.changeText || function() {}
    };
  };
  
  var size = function(w, h, zoom) {
    _width = w*zoom;
    _height = h*zoom;
    _zoom = zoom;
    _svg.attr('width', _width)
        .attr('height', _height);
    
    _bg.attr('width', _width)
      .attr('height', _height);
  };
  
  var putImgCircle = function(data, name) {
    if (LOG>1) console.log(data);
    
    var clipName = 'dangan-img-circle-' + name + '-clip';
    _defs.selectAll('.'+clipName).data(data).enter()
      .append('clipPath')
      .attr('class', clipName)
      .attr('id', function(d,i) { return clipName+i; })
      .append('circle')
      .attr('r', function(d) { return _zoom * d.r; })
      .attr('transform', function(d) { return 'translate(' + _zoom*(d.x+d.r) + ',' + _zoom*(d.y+d.r) + ')'; });
    
    var elementName = 'dangan-img-circle-' + name;
    _elements.selectAll('.'+elementName).data(data).enter()
      .append('g')
      .attr('class', function(d) { return elementName + (d.click?' dangan-click':'');})
      .attr('clip-path', function(d,i) { return 'url(#'+clipName+i+')'; })
      .append('image')
      .attr('xlink:href', function(d) {return d.value && (dev_ip+d.value);})
      .attr('width', function(d) {return 2*_zoom*d.r;})
      .attr('height', function(d) {return 2*_zoom*d.r;})
      .attr('transform', function(d) { return 'translate(' + _zoom*d.x + ',' + _zoom*d.y + ')'; })
      .on('mouseenter', function(d,i) {
        if (d.modify) {
          if (LOG > 2) console.log('enter');
          _overNode = {node:this, data:d, index:i};
        }
      })
      .on('mouseout', function(d) {
        if (d.modify) {
          if (LOG > 2) console.log('out');
          _overNode = undefined;
        }
      });
  };
  
  var putImage = function(data, name) {
    var elementName = 'dangan-image-' + name;
    _elements.selectAll('.'+elementName).data(data).enter()
      .append('image')
      .attr('class', function(d,i) { return elementName+'-'+i;})// + (d.modify?' dangan-modify':'');})
      .attr('xlink:href', function(d) {return d.value && (dev_ip+d.value);})
      .attr('width', function(d) {return _zoom*d.w;})
      .attr('height', function(d) {return _zoom*d.h;})
      .attr('transform', function(d) { return 'translate(' + _zoom*d.x + ',' + _zoom*d.y + ')'; })
      .on('mouseenter', function(d,i) {
        if (d.modify) {
          if (LOG > 2) console.log('enter');
          _overNode = {node:this, data:d, index:i};
        }
      })
      .on('mouseout', function(d) {
        if (d.modify) {
          if (LOG > 2) console.log('out');
          _overNode = undefined;
        }
      })
  };
  
  var putText = function(data, name) {
    var elementName = 'dangan-text-' + name;
    _elements.selectAll('.'+elementName).data(data).enter()
      .append('g')
      .attr('class', function(d,i) { return elementName+'-'+i;})
      .attr('transform', function(d) { return 'translate(' + _zoom*d.x + ',' + _zoom*d.y + ')'; })
      .append('text')
      .attr('y', function(d) {return _zoom*d.size})
      .text(function(d) {return d.value;})
      .attr('text-anchor', function(d) {return d.align;})
      .style('fill', function(d) {return d.color || '#000000';})
      .style('font-size', function(d) {return _zoom*d.size+'px';})
      .style('line-height', function(d) {return _zoom*d.line+'px';})
      .style('cursor', function(d) {return d.modify && 'pointer';})
      .on('mousedown', function(d,i) {
        if (d.modify && _interactions.changeText && _interactions.changeText.apply) {
          _interactions.changeText(this, d);
          d3.select(this).textwrap({width: _zoom*d.w, height: _zoom*d.h, x:0, y:0}, 0);
        }
      })
      .each(function(d) {
        d3.select(this).textwrap({width: _zoom*d.w, height: _zoom*d.h, x:0, y:0}, 0);
      });
  };
  
  var clear = function() {
    _bg.remove();
    _defs.remove();
    _elements.remove();
    _bg = _svg.append('image').attr('id', 'dangan-background')
      .attr('width', _width)
      .attr('height', _height);
    _defs = _svg.append('defs').attr('id', 'dangan-defs');
    _elements = _svg.append('g').attr('id', 'dangan-elements');

  };
  
  var putLayout = function(layout) {
    _layout = layout;
    if (LOG) console.log('Svg.putLayout');
    if (LOG) console.log(JSON.stringify(layout));
    
    _bg.attr('xlink:href', dev_ip+layout.bg);
    
    var elements = layout.elem,
        length = elements.length;
    
    for (var i=0; i<length; i++) {
      var elem = elements[i],
          type = elem.type;
      
      if (LOG>2) console.log('Svg.putLayout elem');
      if (LOG>2) console.log([JSON.stringify(elem)]);
      
      if (type === 'img-circle') {
        putImgCircle(elem.data, elem.name);
      }
      
      if (type === 'image') {
        putImage(elem.data, elem.name);
      }
      
      if (type === 'text') {
        putText(elem.data, elem.name);
      }
    }
  };
  
  var _setImage = function(url, i, j) {
    _layout[i].data[j].value = url;
  };
  
  var _setText = function(text, i, j) {
    _layout[i].data[j].value = text;
  };
  
  var draggingImage = function(status) {
    if (status === 'start') {
      
    } else if (status === 'stop') {
      
    }
  };  
  
  return {
    init: init,
    size: size,
    clear: clear,
    put: putLayout,
    getJson: function() { return JSON.stringify(_layout); },
    getSvg: function() { return _target.html(); },
    dragEnd: function() {
      if (_overNode && _interactions.drag && _interactions.drag.apply) {
        _interactions.drag(_overNode);
      }
      _overNode = undefined;
    },
    draggingImage: draggingImage,
    clone: function(id, size) {
      var _clone = DanganSVG();
      _clone.init(id, {});
      
      size = size || {};
      _clone.size(size.w||_width, size.h||_height, size.zoom||_zoom);
      return _clone;
    }
  };
};