'use strict';

var DanganUtil = function DanganUtil(undefined) {
  var _imageObj = {
    '优秀': 'score_1.png',
    '良好': 'score_2.png',
    '一般': 'score_3.png',
    '中等': 'score_8.png',
    '达标': 'score_4.png',
    '不达标': 'score_5.png',
    '合格': 'score_6.png',
    '不合格': 'score_7.png',
    '加油': 'score_9.png'
  };

  var _star1 = {
    '优秀': 'stars_5.png',
    '良好': 'stars_4.png',
    '中等': 'stars_3.png',
    '一般': 'stars_2.png',
    '不合格': 'stars_1.png'
  };

  var _star2 = {
    '优秀': 'star_4.png',
    '良好': 'star_3.png',
    '合格': 'star_2.png',
    '不合格': 'star_1.png'
  };

  var defaultGrowth = '/static/images/print/template/growth_default.png';

  var helpers = {
    gradeImage: function gradeImage(d) {
      d.value = '/static/images/print/template/' + (_imageObj[d.value] || 'score.png');
    },
    star1: function star1(d) {
      d.value = '/static/images/print/template/' + (_star1[d.value] || 'stars_0.png');
    },
    artGrade: function artGrade(d) {
      var v = d.value;
      if (v >= 90) d.value = '优秀';else if (v >= 75) d.value = '良好';else if (v >= 60) d.value = '合格';else if (v > -1) d.value = '不合格';
    },
    artStars: function artStars(d) {
      var v = d.value;
      if (v >= 90) v = '优秀';else if (v >= 75) v = '良好';else if (v >= 60) v = '合格';else if (v > 0) v = '不合格';

      d.value = '/static/images/print/template/' + (_star2[v] || 'star_0.png');
    },
    emptyFlower: function emptyFlower(d) {
      if (typeof d.value === 'number') {
        if (d.value === 0 && !d.offset) {
          d.x = d.x + 106;
          d.offset = true;
        }

        if (d.value > 0 && d.offset) {
          d.x = d.x - 106;
          d.offset = false;
        }

        d.value = '/static/images/print/template/red%20flower.png';
      }
    },
    hideZero: function hideZero(d) {
      d.value = d.value ? 'x ' + d.value : '';
    },
    getAstro: function getAstro(d) {
      if (d.value) {
        var ymd = d.value.split('-');
        if (ymd.length === 1) ymd = d.value.split('/');
        if (ymd.length === 1) {
          var yMD = d.value.split('年'),
              mD = yMD[1].split('月'),
              D = mD[1].split('日');

          ymd = [yMD[0], mD[0], D[0]];
        }

        if (ymd.length === 1) d.value = '';else {
          var m = ymd[1],
              day = ymd[2];
          d.value = '魔羯水瓶双鱼白羊金牛双子巨蟹狮子处女天秤天蝎射手魔羯'.substr(m * 2 - (day < '102123444543'.charAt(m - 1) - -19) * 2, 2) + '座';
        }
      } else {
        d.value = '未知星座';
      }
    },
    percent: function percent(d) {
      d.value = Math.round(d.value) + '%';
    }
  };

  function _array_find(array, cond) {
    for (var i = 0; i < array.length; i++) {
      if (cond(array[i])) return array[i];
    }
  }

  var filters = {
    skip8: function skip8(result) {
      return result.slice(8);
    },
    sum: function sum(result) {
      console.log('****');
      console.log(result);
      var total = 0;
      result.forEach(function (r) {
        total += parseFloat(r.data) * 100 || 0;
      });

      return total / 100;
    },
    evaluation: function evaluation(result) {
      var newResult = [];
      newResult.push(_array_find(result, function (x) {
        for (var key in x.subjects) {
          if (x.subjects[key] === '语文') return true;
        }
      }));

      newResult.push(_array_find(result, function (x) {
        for (var key in x.subjects) {
          if (x.subjects[key] === '数学') return true;
        }
      }));

      newResult.push(_array_find(result, function (x) {
        for (var key in x.subjects) {
          if (x.subjects[key] === '英语') return true;
        }
      }));

      newResult.push(_array_find(result, function (x) {
        for (var key in x.subjects) {
          if (x.subjects[key] === '信息技术') return true;
        }
      }));

      newResult.push(_array_find(result, function (x) {
        for (var key in x.subjects) {
          if (x.subjects[key] === '科学') return true;
        }
      }));
      if (LOG > 2) console.log('Core.(filtered evaluation)');
      if (LOG > 2) console.log(newResult);
      return newResult;
    },
    musicArt: function musicArt(result) {
      var newResult = [];
      newResult.push(_array_find(result, function (x) {
        for (var key in x.subjects) {
          if (x.subjects[key] === '音乐') return true;
        }
      }));

      newResult.push(_array_find(result, function (x) {
        for (var key in x.subjects) {
          if (x.subjects[key] === '美术') return true;
        }
      }));
      if (LOG > 2) console.log('Core.(filtered musicArt)');
      if (LOG > 2) console.log(newResult);
      return newResult;
    },
    bars: function bars(result) {
      var max = 0;
      result.forEach(function (r) {
        if (max < r.percentage) max = r.percentage;
      });

      return result.map(function (r) {
        return [r.percentage / max, r.color];
      });
    }
  };

  return {
    defaultGrowth: defaultGrowth,
    helpers: helpers,
    filters: filters
  };
};