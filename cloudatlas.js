// BAIDUYUN SOCIAL NETWORK VISUALIZATION PROJECT
;(this.cloudatlas = function _viz_baiduyun_social_network_($, options){
  options = $.extend({retry: 3}, this.cloudatlas.options, options);

  $.getScript('https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.16/d3.js', function() {
    console.info('load D3.js: done.')
    $.noConflict();
    jQuery.getScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js', go);
  });
  
  var global = this,
      ctx = this.FileUtils || this.yunData.getContext(),
      arg_uk = options.from_uk,
      from_uk = arg_uk || (ctx.SHARE_DATAS ? ctx.SHARE_DATAS.currentUK : ctx.uk),
      max = options.max || -1,
      // 常数
      BDSTOKEN = ctx.bdstoken,
      PERPAGE = 25,        // 百度云盘限制每页最多可处理100件
      USER_PERPAGE = 25;    // 百度云盘限制每页最多取得25件fan

  options.from_uk = from_uk;
  
  console.log('cloudatlas：\r\n', JSON.stringify(options, null, 2));

//  go();

  function go() {
console.info('Let\'s go!');    
    // 有数量限定的执行令牌池，用来限定并发请求的数量避免负荷过大
    var pool = (function create_pool(size) {
      var used = 0, pending = [], t;

      return {
        get: function() {
          var wait = $.Deferred();
          used++ < size ? wait.resolve(used) : pending.push(wait);
          return wait.promise({ free: function() {
              if (used > 0 && wait) {
                pending.length > 0 && pending.shift().resolve(used);
                used--; wait = null;
              }
            }});
        }
      }
    })(options.conn_max = Math.max(options.conn_max || 8, 1));

    // 封装$.ajax()调用，在并发执行的同时通过令牌池来限制请求符合，提高转存成功率
    function $ajax() {
      var slot = pool.get(), args = [].slice.apply(arguments);
      return slot.pipe(function () {
        return $.ajax.apply(null, args).done(slot.free).fail(slot.free);
      });
    }




    function getUserInfo(user) {
      return $ajax({url: '/pcloud/user/getinfo', data: {query_uk: user.uk}}).then(v => v);
    }

    function getFanList(user, start, max) {
      if (user.fans === 0) return [];

      start = start || 0;
      max = max || -1;
      var uk = user.uk, arr = [];
      var API = '/pcloud/friend/getfanslist';
      return $ajax({url: API, data: {query_uk: uk, limit: USER_PERPAGE, start: start}})
                .then(function(r) {
                    var total = r.total_count, list = r.fans_list;
                    if (list) {
                      arr = arr.concat(list);
                      max = Math.min(max < 0 ? total : max, total)
                      if (arr.length < max) {
                        var jobs = [];
                        for (let s = list.length; s < max; s += USER_PERPAGE) {
                          jobs.push({url: API, data: {query_uk: uk, limit: USER_PERPAGE, start: s}});
                        }
                        return $.when.apply(null, jobs.map(j => $ajax(j)))
                                .then(function() {
                                  [].slice.apply(arguments).forEach(rr => rr[0] && rr[0].fans_list && [].push.apply(arr, rr[0].fans_list));
                                  return arr;
                                });
                      }
                    }
                    return arr;
                });
    }

    function getFollowList(user, start, max, arr) {
      if (user.follows === 0) return [];

      var API = '/pcloud/friend/getfollowlist';
      start = start || 0;
      max = max || -1;
      arr = arr || [];
      var uk = user.uk;
      return $ajax({url: API, data: {query_uk: uk, limit: USER_PERPAGE, start: start}})
                .then(function(r) {
                    var total = r.total_count, list = r.follow_list;
                    if (list) {
                      arr = arr.concat(list);
                      max = Math.min(max < 0 ? total : max, total)
                      if (arr.length < max) {
                        var jobs = [];
                        for (let s = list.length; s < max; s += USER_PERPAGE) {
                          jobs.push({url: API, data: {query_uk: uk, limit: USER_PERPAGE, start: s}});
                        }
                        return $.when.apply(null, jobs.map(j => $ajax(j)))
                                .then(function() {
                                  [].slice.apply(arguments).forEach(rr => rr[0] && rr[0].follow_list && [].push.apply(arr, rr[0].follow_list));
                                  return arr;
                                });
                      }
                    }
                    return arr;
                });
    }

    var $root = $('html');
    $root.css({width: '100%', height: '100%', padding: 0, margin: 0});
    $root.empty().append($('<head>'));

    var $canvas = $('<div>').css({
      width: '100%',
      height: '100%',
      'box-shadow': '1px 1px 4px rgba(0,0,0, 0.4)'
    });

    $canvas.appendTo(
      $('<div>').css({position: 'absolute', top: 12, left: 12, bottom: 12, right: 12}).appendTo($root));

    $('<style>', {html: 
                  '.node {stroke: #fff; stroke-width: 1.5px;} \
  .node.spot {fill: #DAA} \
  .fan {stroke: #F44; stroke-opacity: .4;} \
  .follow {stroke: #4AF; stroke-opacity: .13;}'})
      .appendTo($root);


    var width = $canvas.width(), height = $canvas.height();

    function tick() {
        graph.links
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        graph.nodes
            .attr('r',  d => d.r1)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    }


    var force = d3.layout.force()
        .size([width, height])
        .on("tick", tick)
        .on("end", () => console.info('force end now'));

    force.linkDistance(35);

    var svg = d3.select($canvas[0]).append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.append('linearGradient')
          .attr('id', 'grad')
          .html('<stop stop-color="navy"/>\
      <stop offset="50%" stop-color="navy"/>\
      <stop offset="60%" stop-color="red"/>\
      <stop offset="100%" stop-color="red"/>');

    var data = {nodes: [], links: []};

    force.nodes(data.nodes) 
         .links(data.links);

  //  force.linkDistance(function(link) {
  //    var s = link.source, t = link.target,
  //        a = s.share + s.album, b = t.share + t.album,
  //        r = (link.cls === 'fan' ? a : b)/(a+b);
  ////    console.log(r * 130);
  //    return 200 * r + 12 + Math.log2(b);
  //  });
  //  force.linkDistance(130);//.start();
    force.linkDistance(100).friction(0.5);

    force.start();

    var graph = {}
    updateGraph();


    var map = {}, neglect = new Set(), waitList = [{uk: from_uk}];

    function createNode(r) {
      if (r.fans_uk) {
        r.uk = r.fans_uk;
        r.uname = r.fans_uname;
      } else if (r.follow_uk) {
        r.uk = r.follow_uk;
        r.uname = r.follow_uname;
      }

      var uk = r.uk + '', nd;
      if (neglect.has(uk)) {
        return uk;
      } else {
        nd = map[uk];
        if (!nd) {
          nd = map[uk] = {
                   uk: uk,
                 name: r.uname,
                album: r.album_count,
                share: r.pubshare_count,
                 fans: r.fans_count,
              follows: r.follows_count,
            };
          nd.total = nd.album * 10 + nd.share;
          if (nd.total === 0) {
            neglect.add(uk);
            return uk;
          } else {
            nd.r1    = nd.total === 0 ? 0 : 2 + Math.log2(nd.total);
            nd.r3    = nd.fans === 0  ? 0 : 2 + Math.log2(nd.fans);
          }
        }
        return nd;
      }
    }

    function updateGraph() {
      svg.selectAll('.link').remove();
      svg.selectAll('.node').remove();
        graph.links = svg.selectAll('.link').data(data.links).enter().append('line').attr('class', function(d) {
          return [d.cls , 'link'].join(' ');
        });
        graph.nodes = svg.selectAll('.node').data(data.nodes).enter().append('circle').attr('class', function(d) { return 'node' + (d.spot ? ' spot': '')});
        graph.nodes.call(force.drag);
    }

    updateGraph();

    var cnt_visited = 0;
    function visit(user) {
      if (!user) return;


      $.when(getUserInfo(user), getFanList(user, 0, 256), getFollowList(user, 0, 256))
       .then(function(user, fans, follows) {
                console.log(user, fans, follows);
                user = user.user_info;
                var focus = createNode(user);
                focus.visited = true;
                cnt_visited++;

                if (focus.total > 0 || focus.fans > 10 || focus.follows > 0) {
                  if (focus.total > 0) {
                    focus.spot = true;
                    data.nodes.push(focus);
                  }

                  fans.forEach(e => {
                    var nd = createNode(e);
                    if (nd.uk) {
                      if (nd.total > 0) {
                        data.nodes.push(nd);
                        data.links.push({source: nd, target: focus, cls: 'fan'})
                      }
                      if (nd.fans + nd.follows === 0) {
                        neglect.add(nd.uk);
                      } else {
                        waitList.push(nd);
                      }
                    }
                  });

                  follows.forEach(e => {
                    var nd = createNode(e);
                    if (nd.uk) {
                      if (nd.total > 0) {
                        data.nodes.push(nd);
                        data.links.push({source: nd, target: focus, cls: 'follow'});
                      }
                      if (nd.fans + nd.follows === 0) {
                        neglect.add(nd.uk);
                      } else {
                        waitList.push(nd);
                      }
                    }
                  });
                }

                if (cnt_visited < 32) {
                  console.log('visited: ', cnt_visited)
                  var next;
                  while (true) {
                    next = waitList.shift();
                    if (!next) {
                      force.start()
                      updateGraph();
                      break;
                    }
                    if (!neglect.has(next.uk) && !next.visited) {
                      visit(next);
                      break;
                    }
                  }
                } else {
                    force.start()
                    updateGraph();
                }
              });
    }

    visit(waitList.shift());

    global.this_force = force;

  }
})(jQuery);
