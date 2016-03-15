// 第一步：搜集微博分享用户ID（形如 u1717910581)
;(this.vdiskQuest = function _list_candidates_(options) {
  var DEFAULTS = { title: '执行参数',
                   start: 0,
                   pages: 1000,
               blockSize: 5000,
              filePrefix: 'UIDS_',
               fileStart: 0,
               threshold: -1,
                   mixed: false
  };
  options = $.extend(DEFAULTS, vdiskQuest.options, options);

  var fcnt = options.fileStart || 0, cnt = 0;
  var util = (function() {
      var a = document.createElement("a");
      a.style = "display: none";
      document.body.appendChild(a);
    return {save: function(str, fileName, type) {
                    var url = window.URL.createObjectURL(new Blob([str], { type: type || "text" }));
                    a.href = url;
                    a.download = fileName;
                    a.click();
                    setTimeout(function() { window.URL.revokeObjectURL(url) }, 500);
                  },
           clear: function() { document.body.removeChild(a) }
      };
  }());
  
    var URL  = '/u/vdisk/',
        $div = $('<div>'),
        page = options.start,
        max  = page + options.pages - 1,
        arr  = [],
        forceStop = false,
        accept;
  
    if (options.threshold < 0) {
      accept = item => item.share === 0 && /^u[0-9]+$/.test(item.name);
    } else {
      accept = options.mixed 
                  ? item => item.share >= options.threshold || (item.share === 0 && /^u[0-9]+$/.test(item.name))
                  : item => item.share >= options.threshold;
    }

    function check(done) {
      if (arr.length >= options.blockSize || done) {
        var fname = options.filePrefix + ('000' + fcnt++).slice(-4) + '.txt';
        console.log('保存至文件: ', fname, '\t 含用户数: ', arr.length);
        cnt += arr.length;
        util.save(JSON.stringify(arr.map(v => v.uid)), fname);
        arr = [];
      }
    }

    function parse($top) {
      forceStop = !$top.find('li > .content').each(function() {
        var $e = $(this), $t = $e.children('a'), $d = $e.find('.list-content > b'),
            item = {
                 uid: $t.attr('href').slice(9), 
                name: $t.attr('title').slice(0, -3),
               share: +$d[0].innerText || 0, 
              follow: +$d[1].innerText || 0, 
                 fan: +$d[2].innerText || 0 };
        
            accept(item) && arr.push(item);  
      }).length;
      check();
    }
    
    function whenDone() {
      check(true);
      console.log('第一步完成：搜集微博分享用户ID，共' + cnt + '件，保存在' + fcnt + '个文件中。');
      setTimeout(util.clear);
      
      options.start = page + 1;
      options.fileStart = fcnt;
      vdiskQuest.options = options;
    }

    function go() {
      console.log('正在爬第' + page + '页...');
      if (page === 1) {
        page++;
        parse($('body'));
        go();
      } else {
        $div.load(URL + page, function(data, status, xhr) {
          if (data) {
            parse($div);
            $div.empty();
            if (forceStop) {
              console.warn('已经翻过最后一页！')
            } else if (page < max) {
              page++;
              go();
              return;
            }
            
            whenDone();
          } else {
            console.log('爬不起来了，看看神马情况:', data, status, xhr);
          }
        });
      }
    }

    console.log('爬一爬盘多多上列出的微博分享用户ID：');
    go();
    return options;
})({
      start: 1,         // 开始页号, 从1开始计数
      pages: 1000,      // 爬取页数
  blockSize: 5000,      // 分段大小
 filePrefix: 'UIDS_',   // 保存文件名前缀
  fileStart: 0,         // 保存文件名开始序号
  threshold: -1,        // 达人标准A：最低分享件数。 threshold < 0 时，仅输出微博分享用户（名如 u5731072592)
      mixed: false      // threshold >= 0 时，输出结果是否同时包含普通微盘用户和微博分享用户（名如 u5731072592)
});

// 自动设定新的参数start，然后继续搜索
// vdiskQuest()

// 或手动设定新的参数start，然后继续搜索
// vdiskQuest({start: 1234})

// 或手动设定新参数，然后执行搜索
// vdiskQuest({start: 1234, pages: 500, blockSize: 1000, filePrefix: 'WEIBO_', fileStart: 0})




var uids = ["1047363984","1099542685","1150045522","1160136721","1248985277","1346035005","1452530903","1465138003","1527223265","1565242922","1598162774","1636056550","1653322064","1659113205","1698428712","1700677963","1702103952","1743766847","1749020647","1779203904","1780151535","1781139743","1846549431","1868067404","1874664115","1905422921","1914540607","1916188415","1926846550","1989581477","2013173952","2040355823","2041345524","2050273012","2116667993","2121051514","2209362484","2261684860","2350716984","2377121762","2402308931","2410134210","2459898931","2464035001","2485510337","2487226033","2506706254","2539962614","2591361807","2622956313","2725138511","2747178847","2752532197","2849466560","2882617115","3069385687","3174652382","3256645644","3279758161","3564148425","3831330851","3880042288","3926492568","3929676480","3955254418","5092592013","5148388266","5155193709","5295107315","5314744060","5325382278","5348384389","5369090887","5394839300","5457169276","5618233387","5628597082","5717855927","5730333932","5730347078","5730347305","5730347911","5730349554","5730351226","5730736547","5730736774","5730736966","5730737915","5730740131","5731071129","5731072008","5731072592","5731074762","5731075149","5731430067","5731445518","5731446375","5731446544","5731448503","5812765872","5813018689","5815517474","5830004611","5830174021","5832443210","5834094943","5841793697","5842319349","5842322669","5853666464"];

// 查询微博分享用户的分享件数，甄别分享达人
;(this.weiboGeek = function _find_those_weibo_geeks_(options) {
    var DEFAULTS = {threshold: 50,
                      dirRate: 0.2,
                     pageSize: 10,
                   maxRequest: 10,
                    filePrefix: '微博分享达人_',
                    fileStart: 0
                   };
    options = $.extend(DEFAULTS, options);

    var util = (function() {
        var a = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);
      return {save: function(str, fileName, type) {
                      var url = window.URL.createObjectURL(new Blob([str], { type: type || "text" }));
                      a.href = url;
                      a.download = fileName;
                      a.click();
                      setTimeout(function() { window.URL.revokeObjectURL(url) }, 500);
                    },
             clear: function() { document.body.removeChild(a) }
        };
    }());

    function collect(arr, willDone) {
      var fcnt = options.fileStart || 0, 
          cnt = 0;

      function* produce() {
        var pos = 0, len = arr.length;
        while (pos < len) {
          yield arr.slice(pos, pos+= options.maxRequest);
        }
      }

      function single(uid, d) {
        $.ajax({  url: '/wap/api/weipan/listUserItems',
             dataType: 'json',
                 data: {uid: uid, page_size: options.pageSize},
              success: v => d.resolve({uid: uid, num: v.totalnum, data: v.data }),
                error:  () => d.resolve()
          });
        return d;
      }

      function crawl(job, result) {
        var bloc = job.next();
        if (!bloc.done) {
          bloc = bloc.value;
          console.log('\t ' + ++cnt + '', '\t>', bloc.join(', '));
          Promise.all(bloc.map(uid => single(uid, Promise.defer()).promise))
                 .then(function(data) {
                      data.forEach(d => {
                        if (d) {
                          var data = d.data, r = data.reduce((p, v) => p + (v.is_dir ? 1 : 0), 0) / (data.length || 1);
                          return (d.num < options.threshold && r < options.dirRate) || result.push(d);
                        }
                      });
                      crawl(job, result);
                    });
        } else {
          // 按分享件数降序排列
          result.sort(function(a, b) {
              var diff = a.num - b.num;
              return -(diff != 0 ? diff : (a.uid > b.uid ? -1 : 1));
            });
          var fname = options.filePrefix + ('000' + fcnt++).slice(-4) + '.csv',
              content = result.map(v => {
                var detail = v.data.map(d => (d.is_dir ? '<目录>' : (d.category_name ? '[' + d.category_name + ']' : '')) + d.name).join(' |');
                return v.uid + ', ' + 'http://vdisk.weibo.com/u/' + v.uid + ', ' + v.num + ', "' + detail + '"'}).join('\r\n') + '\r\n';
          util.save('\uFEFF' + content, fname);
          
          console.log('保存微盘分享达人: ', fname, ' , 含用户数: ', result.length);
          options.fileStart = fcnt;
          willDone.resolve();
        }
      }

      console.log('\t 正在抓取如下ID的微盘用户分享件数: ')
      crawl(produce(), []);
    }  
  
    $('body > *').css('visibility', 'hidden');
    var $picker = $('<div>', {html: '<input type="file" multiple/>', id: 'chooseFiles'})
                      .css({'padding': 4, 
                            background: '#FFF', 
                            border: '2px solid #BBB', 
                            'border-radius': '4px', 
                            position: 'absolute', 
                            top: 12, 
                            left: 12, 
                            'box-shadow': '2px 2px 4px rgba(0,0,0,0.3)'}).appendTo($('body'));

    function loadFile(f, willDone, prevDone) {
        let reader = new FileReader();
        reader.onload = () => collect(JSON.parse(reader.result), willDone);
        prevDone.promise.then(() =>  {console.log('\r\n读取文件：', f.name); reader.readAsText(f)});
    }

    $picker.off('change').on('change', function(e) {
      var fileList = $(e.target).prop('files'), idx = 0;
      var prevDone = Promise.defer();
      prevDone.resolve();
      
      for (let f; idx < fileList.length; idx++) {
        let willDone = Promise.defer();
        loadFile(fileList[idx], willDone, prevDone, idx === 0)
        prevDone = willDone;
      };
    });
  
    console.log('');
}) ({
   threshold: 50,               // 达人标准A：最低分享件数
     dirRate: 0.2,              // 达人标准B：前m项分享包含目录比例，小数形式
    pageSize: 10,               // 一页查询可取得分享件数，微博限制小于等于100
  maxRequest: 10,               // 最大并发请求数
  filePrefix: '微博分享达人_',   // 保存文件名前缀
   fileStart: 0                 // 保存文件名开始序号
});
  
//  50, 10, 0); // 达人最低分享件数, 最大并发请求数, 输出结果文件名序号

;(function(arr, threshold, blockSize) {
  var cnt = 0,
  blockSize = blockSize || 10;
  
  function* produce() {
    var pos = 0, len = arr.length;
    while (pos < len) {
      yield arr.slice(pos, pos+= blockSize);
    }
  }

  function single(uid, d) {
    $.ajax({url: '/wap/api/weipan/listUserItems',
            dataType: 'json',
            data: {uid: uid, page_size: 1},
            success: v => d.resolve({uid: uid, num: v.totalnum}),
            error:  () => d.resolve()
           })
    return d;
  }

  function crawl(job, result) {
    var bloc = job.next();
    if (!bloc.done) {
      bloc = bloc.value;
      console.log(++cnt + '', '\t>', bloc.join(', '));
      Promise.all(bloc.map(uid => single(uid, Promise.defer()).promise))
             .then(function(data) {
                  data.forEach(d => { d.num > threshold && result.push(d) })
                  crawl(job, result);
                });
    } else {
      console.log('发现微盘分享达人：');
      // 按分享件数降序排列
      result.sort(function(a, b) {
          var diff = a.num - b.num;
          return -(diff != 0 ? diff : (a.uid > b.uid ? -1 : 1));
        });
      result.forEach(v => { console.log('http://vdisk.weibo.com/u/' + v.uid, ' ', v.num)});
      console.log(result);
    }
  }

  console.log('正在抓取如下ID的微盘用户分享件数: ')
  crawl(produce(), []);
})(uids, 50, 10); // 微盘用户ID的数列, 最低分享件数, 最大并发请求数





/*
/pcloud/user/getinfo?
  query_uk:2214641459

*/
{
  "errno": 0,
  "request_id": 3511900620,
  "user_info": {
    "avatar_url": "http:\/\/himg.bdimg.com\/sys\/portrait\/item\/f184ec04.jpg",
    "fans_count": 16209,
    "follow_count": 0,
    "intro": "",
    "uname": "yanhu831",
    "uk": 2214641459,
    "album_count": 0,
    "pubshare_count": 917,
    "tui_user_count": 0,
    "c2c_user_sell_count": 0,
    "c2c_user_buy_count": 0,
    "c2c_user_product_count": 0,
    "pair_follow_type": -1
  }
  
  
}/**

/pcloud/friend/getfanslist?
  query_uk:2214641459
  limit:24 <= 25
  start:0

*/
{
  "errno": 0,
  "request_id": 3511900620,
  "total_count": 2400,
  "fans_list": [
    {
    "type": -1,
    "fans_uname": "super_sq2012",
    "avatar_url": "http:\/\/himg.bdimg.com\/sys\/portrait\/item\/d62d5722.jpg",
    "intro": "",
    "user_type": 0,
    "is_vip": 0,
    "follow_count": 75,
    "fans_count": 7,
    "follow_time": 1457538217,
    "pubshare_count": 0,
    "fans_uk": 757504136,
    "album_count": 0
  }, {
    "type": -1,
    "fans_uname": "\u98ce201402",
    "avatar_url": "http:\/\/himg.bdimg.com\/sys\/portrait\/item\/fc3e2751.jpg",
    "intro": "",
    "user_type": 3,
    "is_vip": 0,
    "follow_count": 191,
    "fans_count": 1,
    "follow_time": 1457536023,
    "pubshare_count": 0,
    "fans_uk": 1045803768,
    "album_count": 0
  }, {
    "type": -1,
    "fans_uname": "fuxgyt",
    "avatar_url": "http:\/\/himg.bdimg.com\/sys\/portrait\/item\/5fa5d22f.jpg",
    "intro": "",
    "user_type": 0,
    "is_vip": 0,
    "follow_count": 94,
    "fans_count": 1,
    "follow_time": 1457532608,
    "pubshare_count": 0,
    "fans_uk": 2771063053,
    "album_count": 0
  }, 
  // ...
  ]
}
  
  
