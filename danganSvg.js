// svg 排版, requires d3, d3textwrap
var _d,_this;
var DanganSVG = function() {
  var undefined = undefined, $ = jQuery;
  
  var dev_ip = 'http://preevaluate.mexue.com';
  var LOG = Math.max(LOG||0, 3);
  var _target, _svg,
      _defs, _elements, _bg,
      _interactions, _flag = '';
  
  var _width, _height, _zoom, _rotate;
  
  var _layout; // data object
  
  var _overNode;
  var init = function(target, interactions, rotate) {
    if (typeof target === 'string')
      _target = d3.select('#'+target);
    else
      _target = d3.select(target);
    
    _svg = _target.append('svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('version', '1.1')
      .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
      .attr('id', 'dangan-svg');
    
    _bg = _svg.append('image').attr('id', 'dangan-background');
    _defs = _svg.append('defs').attr('id', 'dangan-defs');
    _elements = _svg.append('g').attr('id', 'dangan-elements');
    
    _rotate = rotate;
    
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
    
    _svg.append('style').attr('type', 'text/css')
      .text('text,tspan{font-family:"SimHei";}.radar-chart .axis line,.radar-chart .level{stroke:grey;stroke-width:.5}.radar-chart .axis .legend{font-size:'+44*_zoom+'px}.radar-chart .axis .legend.left{text-anchor:end}.radar-chart .axis .legend.middle{text-anchor:middle}.radar-chart .axis .legend.right{text-anchor:start}.radar-chart .tooltip{font-size:13px;transition:opacity .2s;opacity:0}.radar-chart .tooltip.visible{opacity:1}.radar-chart .area{stroke-width:2;fill-opacity:.1}.radar-chart.focus .area.focused{fill-opacity:.6}');
    
    if (_rotate) {
      _svg.attr('width', _height)
          .attr('height', _width);
      var matrix = 'matrix(0,1,-1,0,'+_height+',0)';
      _bg.attr('transform', matrix);
      _elements.attr('transform', matrix);
    } else {
      _svg.attr('width', _width)
          .attr('height', _height);
    }
    
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
      .each(function(d,i) {
        if (d.modify) {
          $(this).on('mouseenter', function() {
            if (LOG > 2) console.log('enter');
            _overNode = {node:this, data:d, index:i};
          });
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
    
    var clipName = 'dangan-image-' + name + '-clip';
    _defs.selectAll('.'+clipName).data(data).enter()
      .append('clipPath')
      .attr('class', clipName)
      .attr('id', function(d,i) { return clipName+i; })
      .append('rect')
      .attr('width', function(d) { return _zoom * d.w; })
      .attr('height', function(d) { return _zoom * d.h; })
      .attr('transform', function(d) { return 'translate(' + _zoom*d.x + ',' + _zoom*d.y + ')'; });
    
    
    _elements.selectAll('.'+elementName).data(data).enter()
      .append('image')
      .attr('class', function(d,i) { return elementName+'-'+i;})// + (d.modify?' dangan-modify':'');})
      .attr('xlink:href', function(d) {return d.value && (dev_ip+d.value);})
      .attr('width', function(d) {return _zoom*d.w;})
      .attr('height', function(d) {return _zoom*d.h;})
      .attr('transform', function(d) { return 'translate(' + _zoom*d.x + ',' + _zoom*d.y + ')'; })
      .each(function(d,i) {
        if (d.modify) {
          $(this).on('mouseenter', function() {
            if (LOG > 2) console.log('enter');
            _overNode = {node:this, data:d, index:i};
          });
        }
      })
      .on('mouseout', function(d) {
        if (d.modify) {
          if (LOG > 2) console.log('out');
          _overNode = undefined;
        }
      });
  };
  
  var putText = function(data, name) {
    var elementName = 'dangan-text-' + name;
    _elements.selectAll('.'+elementName).data(data).enter()
      .append('g')
      .attr('class', function(d,i) { return elementName+'-'+i;})
      .attr('transform', function(d) { return 'translate(' + _zoom*d.x + ',' + _zoom*d.y + ')'; })
      .append('text')
      .attr('y', function(d) {return _zoom*d.size})
      .each(function(d) {
        _d = d;
        _this = this;
        if ((!d.value || d.value==='点击添加成长记录文字') && d.modify) {
          var className = this.parentNode.getAttribute('class'),
              node = d3.select('.'+className.replace('text','image'));
          if (node.node() && node.datum().gText) {
            d.value = node.datum().gText;
          }
        }
      })
      .text(function(d) {
        if (d.limit)
          d.value = d.value.substr(0,d.limit);
        return d.value?(d.value+' '):'';
      })
      .attr('text-anchor', function(d) {return d.align;})
      .style('fill', function(d) {return d.color || '#000000';})
      .style('font-size', function(d) {return _zoom*d.size+'px';})
      .style('line-height', function(d) {return _zoom*d.line+'px';})
      .style('cursor', function(d) {return d.modify && 'pointer';})
      .on('mousedown', function(d,i) {
        if (d.modify && _interactions.changeText && _interactions.changeText.apply) {
          _interactions.changeText(this, d);
        }
      })
      .each(function(d) {
        d3.select(this).textwrap({width: _zoom*d.w, height: _zoom*d.h, x:0, y:0}, 0);
      });
  };
  
  var putRadar = function(data, name) {
    var elementName = 'dangan-radar-' + name;
    
    var radar = [
      {
        className: '我的成绩',
        axes: data.value.map(function(v) {
          return {axis: v.name, value: v.score};
        }).slice(0,9)
      }, {
        className: '年级平均',
        axes: data.value.map(function(v) {
          return {axis: v.name, value: v.gradeAvg};
        }).slice(0,9)
      }, {
        className: '班级平均',
        axes: data.value.map(function(v) {
          return {axis: v.name, value: v.classAvg};
        }).slice(0,9)
      }
    ];
    
    var chart = RadarChart.chart();

    chart.config({
      containerClass: 'radar-chart', // target with css, default stylesheet targets .radar-chart
      w: data.w*_zoom,
      h: data.h*_zoom,
      factor: 0.85,
      factorLegend: 1,
      levels: 3,
      maxValue: 100,
      minValue: 0,//55,
      radians: 2 * Math.PI,
      color: d3.scale.category10(), // pass a noop (function() {}) to decide color via css
      axisLine: true,
      axisText: true,
      circles: false,
      radius: 15*_zoom,
      axisJoin: function(d, i) {
        return d.className || i;
      },
      tooltipFormatValue: function() {
        return '';
      },
      tooltipFormatClass: function(d) {
        return d;
      },
      transitionDuration: 100
    });
    
    _elements.append('g')
      .classed(elementName, 1)
      .classed('focus', 1)
      .attr('transform', 'translate(' + _zoom*data.x + ',' + _zoom*data.y + ')')
      .attr('width', data.w*_zoom)
      .attr('height', data.h*_zoom)
      .datum(radar).call(chart);
  };
  
  var putBars = function(data, name) {
    var elementName = 'dangan-bars-' + name;
    _elements.selectAll('.'+elementName).data(data).enter()
      .append('rect')
      .attr('class', elementName)
      .attr('transform', function(d) { return 'translate(' + _zoom*d.x + ',' + _zoom*d.y + ')'; })
      .attr('width', function(d) {return _zoom*d.w * d.value[0];})
      .attr('height', function(d) {return _zoom*d.h;})
      .attr('rx', function(d) {return _zoom*d.h/2;})
      .attr('ry', function(d) {return _zoom*d.h/2;})
      .style('fill', function(d) {return d.value[1];})
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
    
    if (_rotate) {
      var matrix = 'matrix(0,1,-1,0,'+_height+',0)';
      _bg.attr('transform', matrix);
      _elements.attr('transform', matrix);
    }
  };
  
  var putLayout = function(layout, fullBg) {
    _layout = layout;
    if (LOG) console.log('Svg.putLayout');
    if (LOG) console.log(JSON.stringify(layout));
    
    if (fullBg)
      _bg.attr('xlink:href', dev_ip+layout.bg);
    else
      _bg.attr('xlink:href', dev_ip+layout.bg2);
    
    var elements = layout.elem,
        length = elements.length;
    
    for (var i=0; i<length; i++) {
      var elem = elements[i],
          type = elem.type;
      
      if (LOG>2) console.log('Svg.putLayout elem');
      if (LOG>2) console.log([JSON.stringify(elem)]);
      
      if (type === 'img-circle') {
        var _array=[];
        elem.data.forEach(function(d) {
          if (d.value)
            _array.push(d);
        });
        putImgCircle(_array, elem.name);
      }
      
      if (type === 'image') {
        var _array=[];
        elem.data.forEach(function(d) {
          if (d.value)
            _array.push(d);
        });
        putImage(_array, elem.name);
      }
      
      if (type === 'text') {
        putText(elem.data, elem.name);
      }
      
      if (type === 'radar') {
        putRadar(elem.data[0], elem.name);
      }
      
      if (type === 'bars') {
        putBars(elem.data, elem.name);
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
  
  var wrapText = function(node) {
    var d = node.datum();
    node.textwrap({width: _zoom*d.w, height: _zoom*d.h, x:0, y:0}, 0);
  };
  
  return {
    init: init,
    size: size,
    clear: clear,
    put: putLayout,
    getJson: function() { return JSON.stringify(_layout); },
    getSvg: function() {
      d3.selectAll('.tooltip').remove();
      return _target.html();
    },
    dragEnd: function() {
      if (_overNode && _interactions.drag && _interactions.drag.apply) {
        _interactions.drag(_overNode);
      }
      _overNode = undefined;
    },
    draggingImage: draggingImage,
    clone: function(dom, size) {
      var _clone = DanganSVG();
      _clone.init(dom, {});
      
      size = size || {};
      _clone.size(size.w||(_width/_zoom), size.h||(_height/_zoom), size.zoom||1);
      return _clone;
    },
    wrapText: wrapText
  };
};