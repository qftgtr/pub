var RadarChart={defaultConfig:{containerClass:"radar-chart",w:600,h:600,factor:.95,factorLegend:1,levels:3,levelTick:!1,TickLength:10,maxValue:0,minValue:0,radians:2*Math.PI,color:d3.scale.category10(),axisLine:!0,axisText:!0,circles:!0,radius:5,backgroundTooltipColor:"#555",backgroundTooltipOpacity:"0.7",tooltipColor:"white",axisJoin:function(a,b){return a.className||b},tooltipFormatValue:function(a){return a},tooltipFormatClass:function(a){return a},transitionDuration:300},chart:function(){function b(b,c){if(0==c||void 0==c)b.classed("visible",0),b.select("rect").classed("visible",0);else{b.classed("visible",1);var d=b.node().parentNode,e=d3.mouse(d);b.select("text").classed("visible",1).style("fill",a.tooltipColor);var f=5,g=b.select("text").text(c).node().getBBox();b.select("rect").classed("visible",1).attr("x",0).attr("x",g.x-f).attr("y",g.y-f).attr("width",g.width+2*f).attr("height",g.height+2*f).attr("rx","5").attr("ry","5").style("fill",a.backgroundTooltipColor).style("opacity",a.backgroundTooltipOpacity),b.attr("transform","translate("+(e[0]+10)+","+(e[1]-10)+")")}}function c(c){c.each(function(c){function l(b,c,d,e){return d="undefined"!=typeof d?d:1,c*(1-d*e(b*a.radians/i))}function m(a,b,c){return l(a,b,c,Math.sin)}function n(a,b,c){return l(a,b,c,Math.cos)}var d=d3.select(this),e=d.selectAll("g.tooltip").data([c[0]]),f=e.enter().append("g").classed("tooltip",!0);f.append("rect").classed("tooltip",!0),f.append("text").classed("tooltip",!0),c=c.map(function(a){return a instanceof Array&&(a={axes:a}),a});var g=Math.max(a.maxValue,d3.max(c,function(a){return d3.max(a.axes,function(a){return a.value})}));g-=a.minValue;var h=c[0].axes.map(function(a,b){return{name:a.axis,xOffset:a.xOffset?a.xOffset:0,yOffset:a.yOffset?a.yOffset:0}}),i=h.length,j=a.factor*Math.min(a.w/2,a.h/2),k=Math.min(a.w/2,a.h/2);d.classed(a.containerClass,1);var o=d3.range(0,a.levels).map(function(b){return j*((b+1)/a.levels)}),p=d.selectAll("g.level-group").data(o);p.enter().append("g"),p.exit().remove(),p.attr("class",function(a,b){return"level-group level-group-"+b});var q=p.selectAll(".level").data(function(a){return d3.range(0,i).map(function(){return a})});if(q.enter().append("line"),q.exit().remove(),a.levelTick?q.attr("class","level").attr("x1",function(b,c){return j==b?m(c,b):m(c,b)+a.TickLength/2*Math.cos(c*a.radians/i)}).attr("y1",function(b,c){return j==b?n(c,b):n(c,b)-a.TickLength/2*Math.sin(c*a.radians/i)}).attr("x2",function(b,c){return j==b?m(c+1,b):m(c,b)-a.TickLength/2*Math.cos(c*a.radians/i)}).attr("y2",function(b,c){return j==b?n(c+1,b):n(c,b)+a.TickLength/2*Math.sin(c*a.radians/i)}).attr("transform",function(b){return"translate("+(a.w/2-b)+", "+(a.h/2-b)+")"}):q.attr("class","level").attr("x1",function(a,b){return m(b,a)}).attr("y1",function(a,b){return n(b,a)}).attr("x2",function(a,b){return m(b+1,a)}).attr("y2",function(a,b){return n(b+1,a)}).attr("transform",function(b){return"translate("+(a.w/2-b)+", "+(a.h/2-b)+")"}),a.axisLine||a.axisText){var r=d.selectAll(".axis").data(h),s=r.enter().append("g");a.axisLine&&s.append("line"),a.axisText&&s.append("text"),r.exit().remove(),r.attr("class","axis"),a.axisLine&&r.select("line").attr("x1",a.w/2).attr("y1",a.h/2).attr("x2",function(b,c){return a.w/2-k+m(c,k,a.factor)}).attr("y2",function(b,c){return a.h/2-k+n(c,k,a.factor)}),a.axisText&&r.select("text").attr("class",function(a,b){var c=m(b,.5);return"legend "+(.4>c?"left":c>.6?"right":"middle")}).attr("dy",function(a,b){var c=n(b,.5);return.1>c?"1em":c>.9?"0":"0.5em"}).text(function(a){return a.name}).attr("x",function(b,c){return b.xOffset+(a.w/2-k)+m(c,k,a.factorLegend)}).attr("y",function(b,c){return b.yOffset+(a.h/2-k)+n(c,k,a.factorLegend)})}c.forEach(function(b){b.axes.forEach(function(b,c){b.x=a.w/2-k+m(c,k,parseFloat(Math.max(b.value-a.minValue,0))/g*a.factor),b.y=a.h/2-k+n(c,k,parseFloat(Math.max(b.value-a.minValue,0))/g*a.factor)})});var t=d.selectAll(".area").data(c,a.axisJoin);if(t.enter().append("polygon").classed({area:1,"d3-enter":1}).on("mouseover",function(c){d3.event.stopPropagation(),d.classed("focus",1),d3.select(this).classed("focused",1),b(e,a.tooltipFormatClass(c.className))}).on("mouseout",function(){d3.event.stopPropagation(),d.classed("focus",0),d3.select(this).classed("focused",0),b(e,!1)}),t.exit().classed("d3-exit",1).transition().duration(a.transitionDuration).remove(),t.each(function(a,b){var c={"d3-exit":0};c["radar-chart-serie"+b]=1,a.className&&(c[a.className]=1),d3.select(this).classed(c)}).style("stroke",function(b,c){return a.color(c)}).style("fill",function(b,c){return a.color(c)}).transition().duration(a.transitionDuration).attr("points",function(a){return a.axes.map(function(a){return[a.x,a.y].join(",")}).join(" ")}).each("start",function(){d3.select(this).classed("d3-enter",0)}),a.circles&&a.radius){var u=d.selectAll("g.circle-group").data(c,a.axisJoin);u.enter().append("g").classed({"circle-group":1,"d3-enter":1}),u.exit().classed("d3-exit",1).transition().duration(a.transitionDuration).remove(),u.each(function(a){var b={"d3-exit":0};a.className&&(b[a.className]=1),d3.select(this).classed(b)}).transition().duration(a.transitionDuration).each("start",function(){d3.select(this).classed("d3-enter",0)});var v=u.selectAll(".circle").data(function(a,b){return a.axes.map(function(a){return[a,b]})});v.enter().append("circle").classed({circle:1,"d3-enter":1}).on("mouseover",function(c){d3.event.stopPropagation(),b(e,a.tooltipFormatValue(c[0].value))}).on("mouseout",function(a){d3.event.stopPropagation(),b(e,!1),d.classed("focus",0)}),v.exit().classed("d3-exit",1).transition().duration(a.transitionDuration).remove(),v.each(function(a){var b={"d3-exit":0};b["radar-chart-serie"+a[1]]=1,d3.select(this).classed(b)}).style("fill",function(b){return a.color(b[1])}).transition().duration(a.transitionDuration).attr("r",a.radius).attr("cx",function(a){return a[0].x}).attr("cy",function(a){return a[0].y}).each("start",function(){d3.select(this).classed("d3-enter",0)});var w=t.node();w.parentNode.appendChild(w);var x=u.node();x.parentNode.appendChild(x);var y=e.node();y.parentNode.appendChild(y)}})}var a=Object.create(RadarChart.defaultConfig);return c.config=function(b){return arguments.length?(arguments.length>1?a[arguments[0]]=arguments[1]:d3.entries(b||{}).forEach(function(b){a[b.key]=b.value}),c):a},c},draw:function(a,b,c){var d=RadarChart.chart().config(c),e=d.config();d3.select(a).select("svg").remove(),d3.select(a).append("svg").attr("width",e.w).attr("height",e.h).datum(b).call(d)}};

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
    
    _svg.append('style').attr('type', 'text/css')
      .text('text,tspan{font-family:"SimHei";}.radar-chart .axis line,.radar-chart .level{stroke:grey;stroke-width:.5}.radar-chart .axis .legend{font-size:'+44*_zoom+'px}.radar-chart .axis .legend.left{text-anchor:end}.radar-chart .axis .legend.middle{text-anchor:middle}.radar-chart .axis .legend.right{text-anchor:start}.radar-chart .tooltip{font-size:13px;transition:opacity .2s;opacity:0}.radar-chart .tooltip.visible{opacity:1}.radar-chart .area{stroke-width:2;fill-opacity:.1}.radar-chart.focus .area.focused{fill-opacity:.6}');
    
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
  
  var putRadar = function(data, name) {
    var elementName = 'dangan-radar-' + name;
    
    var radar = [
      {
        className: '我的成绩',
        axes: data.value.map(function(v) {
          return {axis: v.name, value: v.score};
        })
      }, {
        className: '年级平均',
        axes: data.value.map(function(v) {
          return {axis: v.name, value: v.gradeAvg};
        })
      }, {
        className: '年级平均',
        axes: data.value.map(function(v) {
          return {axis: v.name, value: v.classAvg};
        })
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
      circles: true,
      radius: 4,
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
      .attr('transform', function(d) { return 'translate(' + _zoom*d.x + ',' + _zoom*d.y + ')'; })
      .attr('width', data.w*_zoom)
      .attr('height', data.h*_zoom)
      .datum(radar).call(chart);
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
      
      if (type === 'radar') {
        putRadar(elem.data[0], elem.name);
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