var map;
var zoom = 7;
//不同语言切换
var HintDic = {
    'goToPoint_p': ['<strong>输入经纬度定位，北纬（东经）为正，南纬（西经）为负。</strong>',
        '<strong>Locate by longitude and latitude. North (or East) is positive, while South (or West) is negative.</strong>',
        '<strong>Найдите по долготе и широте. Север (или Восток) положителен, а Юг (или Запад) отрицателен.</strong>'],
    'lo_p': ['<strong>经度</strong>', '<strong>Longitude</strong>', '<strong>Долгота</strong>'],
    'la_p': ['<strong>纬度</strong>', '<strong>Latitude</strong>', '<strong>Широта</strong>'],
    'goToPoint_btn': ['<strong>定位</strong>', '<strong>Go！</strong>', '<strong>Позиционирование</strong>'],
    'Search_p': ['<strong>输入地名定位</strong>', '<strong>Search by place name</strong>', '<strong>Поиск по названию места</strong>'],
    'location_p': ['<strong>地名</strong>', '<strong>Region</strong>', '<strong>Область</strong>'],
    'Search_btn': ['<strong>搜索</strong>', '<strong>Search</strong>', '<strong>Поиск</strong>'],
    'CircleSearch_p': ['<strong>向当前地图添加查找圆</strong>', '<strong>Locate by Circle Search</strong>', '<strong>Поиск по круг</strong>'],
    'circle_p': ['<strong>半径</strong>', '<strong>Radius</strong>', '<strong>Радиус</strong>'],
    'circleRadius': ['查找半径 默认：100 km', 'Default Radius: 100 km', 'Радиус по умолчанию: 100 км'],
    'circleSearch': ['<strong>查找站点</strong>', '<strong>Add Circle</strong>', '<strong>Добавить круг</strong>'],
    'AllStation': ['<strong>所有站点</strong>', '<strong>All Points</strong>', '<strong>Все локации</strong>'],
    'clearcircle': ['<strong>删除圆</strong>', '<strong>Clear Circle</strong>', '<strong>Очистить круг</strong>'],
    'StationList': ['<strong>台站列表</strong>', '<strong>List for Stations</strong>', '<strong>Список локаций</strong>'],
    'StationName': ['<strong>名称</strong>', '<strong>Name</strong>', '<strong>Имя</strong>'],
    'select_all': ['<strong>全  选</strong>', '<strong>Select All</strong>', '<strong>Выбрать все</strong>'],
    'select_download': ['<strong>下载选中</strong>', '<strong>Download</strong>', '<strong>Скачать</strong>']
};

//添加圆
var circle;
var radius;
//添加台站标注
var markers;
//海量点样式
var cloudStyle = {
    url:'LogoFile/Point.jpg',
    size:[30, 26], //图片大小
    offset:new T.Point(-15, -13), //显示图片的偏移量
    textColor:'#000000', //显示数字的颜色
    textSize:12,//显示文字的大小
    range:[0, 50],
};
//本地搜索
var localSearch;

function onLoad() {
    map = new T.Map('map', {projection: 'EPSG:900913'});
    //设置显示地图中心点和级别
    map.centerAndZoom(new T.LngLat(116.40769, 39.89945), zoom);

    //创建缩放平移控件对象
    ctrl_zoom = new T.Control.Zoom();
    //添加缩放平移控件
    map.addControl(ctrl_zoom);

    //创建鹰眼地图控件对象
    var ctrl_overview = new T.Control.OverviewMap({
        anchor: "T_ANCHOR_BOTTOM_RIGH",
        isOpen: true,
        size: new T.Point(150, 150)
    });
    //添加鹰眼地图控件
    map.addControl(ctrl_overview);

    //设置鼠标点击事件
    var cp = new T.CoordinatePickup(map, {callback: getLngLat});
    cp.addEvent();

    //设置图层切换事件
    var ctrl = new T.Control.MapType();
    map.addControl(ctrl);

    //创建比例尺控件对象
    var scale = new T.Control.Scale();
    //添加比例尺控件
    map.addControl(scale);

    //设置右键菜单
    loadMenu();

    var config = {
        onSearchComplete: localSearchResult	//接收数据的回调函数
    };

    //添加海量点
    initMarker();

    //创建搜索对象
    localsearch = new T.LocalSearch(map, config);
}

//获取查找结果
function localSearchResult(result) {
    //清空地图及搜索列表
    clearAllSearch();

    //根据返回类型解析搜索结果
    switch (parseInt(result.getResultType())) {
        case 1:
            //解析点数据结果
            pois(result.getPois());
            break;
        case 2:
            //解析推荐城市
            statistics(result.getStatistics());
            break;
        case 3:
            //解析行政区划边界
            area(result.getArea());
            break;
        default:
            break;
    }
}

//解析点数据结果
function pois(obj) {
    if (obj) {
        //坐标数组，设置最佳比例尺时会用到
        var zoomArr = [];
        for (var i = 0; i < obj.length; i++) {
            //闭包
            (function (i) {
                //名称
                var name = obj[i].name;
                //地址
                var address = obj[i].address;
                //坐标
                var lnglatArr = obj[i].lonlat.split(" ");
                var lnglat = new T.LngLat(lnglatArr[0], lnglatArr[1]);

                var winHtml = "名称:" + name + "<br/>地址:" + address;

                //创建标注对象
                var marker = new T.Marker(lnglat);
                //地图上添加标注点
                map.addOverLay(marker);
                //注册标注点的点击事件
                var markerInfoWin = new T.InfoWindow(winHtml, {autoPan: true});
                marker.addEventListener("click", function () {
                    marker.openInfoWindow(markerInfoWin);
                });

                zoomArr.push(lnglat);

            })(i);
        }
        //显示地图的最佳级别
        map.setViewport(zoomArr);
        //显示搜索结果
        document.getElementById("resultDiv").style.display = "block";
    }
}

//清空地图及搜索列表
function clearAllSearch() {
    map.clearOverLays();
}

//解析行政区划边界
function area(obj) {
    if (obj) {
        if(obj.points){
            //坐标数组，设置最佳比例尺时会用到
            var pointsArr = [];
            var points = obj.points;
            for (var i = 0; i < points.length; i++) {
                var regionLngLats = [];
                var regionArr = points[i].region.split(",");
                for (var m = 0; m < regionArr.length; m++) {
                    var lnglatArr = regionArr[m].split(" ");
                    var lnglat = new T.LngLat(lnglatArr[0], lnglatArr[1]);
                    regionLngLats.push(lnglat);
                    pointsArr.push(lnglat);
                }
                //创建线对象
                var line = new T.Polyline(regionLngLats, {
                    color: "blue",
                    weight: 3,
                    opacity: 1,
                    lineStyle: "dashed"
                });
                //向地图上添加线
                map.addOverLay(line);
            }
            //显示最佳比例尺
            map.setViewport(pointsArr);
        }
        if(obj.lonlat){
            var regionArr = obj.lonlat.split(",");
            map.panTo(new T.LngLat(regionArr[0], regionArr[1]));
        }
    }
}

//鼠标点击事件
function getLngLat(lnglat) {
    $("#lo").val(lnglat.lng.toFixed(2));
    $("#lo").attr("placeholder", $("#lo").val());
    $("#la").val(lnglat.lat.toFixed(2));
    $("#la").attr("placeholder", $("#la").val());

}

//定位
function goToPoint() {
    var lng = $("#lo").val();
    var lat = $("#la").val();
    map.centerAndZoom(new T.LngLat(lng, lat), zoom);
}

//自定义添加标记及点聚合
function initMarker(handler=1) {
    removeInfoList();       //清除列表信息
    var lnglats = [];
    if(handler === 1 || handler === 3){     //如果是初始化台站
        map.clearOverLays();
        if(handler === 3){      //如果不是初始化台站
            markers.clearMarkers();
        }
        for (var i = 0; i <data.data.length; i++) {
            var marker = new T.Marker(T.LngLat(data.data[i][0], data.data[i][1]));
            marker.id = i;
            /*
            var content = data.data[i][2] + "<form method='post'></form><br><a href='Download/ " +
                data.data[i][3].split('/')[1].split('_')[0] + '_' + data.data[i][3].split('_')[1] +
                "' target='_blank' download=" + data.data[i][3].split('/')[1] + ">数据下载</a></form>" ;
            */
            var content = data.data[i][2] + "<form method='post'><br><a href=\"http://127.0.0.1:8081/?sta_id=%'" +
                data.data[i][3].split('/')[1].split('_')[0] + '_' + data.data[i][3].split('_')[1] + '\'[' + data.data[i][2] + ']' +
                "'\" target='_blank' onclick=\"alert('正在准备数据，请您耐心等待，这可能需要一些时间。（点击确认或回车）')\"  " +
                "download=" + data.data[i][2] + "_ClimateData.xls" + ">数据下载</a></form>" ;


            //var content = data.data[i][2] + '<br><a onclick="downLoadXlsx(\'' + data.data[i][3] + '\')">数据下载</a>';

            addClickHandler(content, marker);

            //marker.addEventListener(event=click, handler= )
            lnglats.push(marker);
        }
    }
    else if(handler === 2){
        //清除原标记点
        markers.clearMarkers();
        //获取查找圆参数
        radius = circle.getRadius();
        var c_location = circle.getCenter();

        for(var i = 0; i < data.data.length; i++) {
            var LngLat = new T.LngLat(data.data[i][0], data.data[i][1]);
            //到圆心的距离
            var distance = map.getDistance(start=c_location, end=LngLat);
            console.log(distance);
            if(distance <= radius){
                var marker = new T.Marker(LngLat);
                marker.id = i;
                /*
                var content = data.data[i][2] + "<form method='post'></form><br><a href='Download/" +
                    data.data[i][3].split('/')[1].split('_')[0] + '_' + data.data[i][3].split('_')[1] +
                    "' target='_blank' download=" + data.data[i][3].split('/')[1] + ">数据下载</a></form>" ;
                */
                var content = data.data[i][2] + "<form method='post'><br><a href=\"http://127.0.0.1:8081/?sta_id=%'" +
                    data.data[i][3].split('/')[1].split('_')[0] + '_' + data.data[i][3].split('_')[1] + '\'[' + data.data[i][2] + ']' +
                    "'\" target='_blank' onclick=\"alert('正在准备数据，请您耐心等待，这可能需要一些时间。(请回车或点击确定）')\" " +
                    "download=" + data.data[i][2] + "_ClimateData.xls" + ">数据下载</a></form>" ;
                // 注意数据库识别字符串必须加上引号


                //var content = data.data[i][2] + "<br><a onclick='downLoadXlsx('" + data.data[i][3] + "')'>数据下载</a>" ;
                var info_content =
                    "           <span>\n" +
                    "                <div class=\"checkbox\" style=\"position:relative; left: 5%\">\n" +
                    "                      <label>\n" +
                    "                        <input type=\"checkbox\" id=" + data.data[i][2] +
                    "                           name=\"checkbox\" value=\"" + data.data[i][3] + "\">\n" + data.data[i][2] +
                    "                        </input>\n" +
                    "                    </label>\n" +
                    "                </div>\n" +
                    "           </span>";
                addClickHandler(content, marker);
                //添加列表信息
                $("#IL_Station").append(info_content);
                //marker.addEventListener(event=click, handler= )
                lnglats.push(marker);
            }
        }
    }
    markers = new T.MarkerClusterer(map, {markers: lnglats});
    //markers = new T.MarkerClusterer(map, {markers: lnglats, styles: cloudStyle});  //自定义用这个
    map.addOverLay(markers);
}

//自定义添加监听事件
function addClickHandler(content,marker){
    marker.addEventListener("click",function(e){
        openInfo(content,e)}
    );
}

//自定义信息窗口
function openInfo(content,e){
    var point = e.lnglat;
    marker = new T.Marker(point);// 创建标注
    var markerInfoWin = new T.InfoWindow(content,{offset:new T.Point(0,-30)}); // 创建信息窗口对象
    map.openInfoWindow(markerInfoWin,point); //开启信息窗口
}

//按钮添加圆
function genCircle() {
    var lng = $("#lo").attr('placeholder');
    var lat = $("#la").attr('placeholder');

    setCircle(lng, lat);
}

//删除圆
function clearCircle(handler=2) {
    map.clearOverLays(circle);
    if(handler === 1) {
        initMarker(1);
    }
}

//输入经纬度添加圆
function setCircle(lng, lat) {
    clearCircle(2);

    radius = parseInt($("#circleRadius").val()) * 1000;
    if(!radius){
        radius = 100000;
    }
    var Location = new T.LngLat(lng, lat);
    if(!Location){
        Location = new T.LngLat(116.40769, 39.89945);
    }
    // 定义该圆的显示区域、可编辑性、监听事件
    circle = new T.Circle(Location, radius,{color:"blue",weight:5,opacity:0.5,fillColor:"#FFFFFF",fillOpacity:0.5,lineStyle:"solid"});
    circle.setColor(color="#4B0082");
    circle.enableEdit();
    circle.addEventListener(event="draw", handler=initMarker(2));

    //绘制在圆内的点
    initMarker(2);
    //向地图上添加圆
    map.addOverLay(circle);

    function getCZoom(radius, lat){
        var max_lat = lat + (radius / 1000 / 6371) * 180 / Math.PI;
        var min_lat = lat - (radius / 1000 / 6371) * 180 / Math.PI;
        var diff = (max_lat - min_lat) * 2.1;
        diff = parseInt(10000 * diff) / 10000;
        var zoomArr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        var diffArr = [180, 90, 45, 22, 11, 5.5, 2.75, 1.37, 0.68, 0.34, 0.17, 0.08, 0.04];

        for (var i = 0; i < diffArr.length; i++) {
            if ((diff - diffArr[i]) >= 0) {
                return zoomArr[i];
            }
        }
        return 14
    }

    var CircleZoom = getCZoom(radius, parseInt(100 * lat) / 100);
    map.panTo(Location, CircleZoom);
    console.log(1);

}

//清空台站信息列表
function removeInfoList() {
    var li = $("#IL_Station").find("input");
    $("#IL_Station").html("");
    console.log(li);
}

//添加右键菜单
function loadMenu(){
    var menu = new T.ContextMenu({
        width: 140
    });
    var txtMenuItem = [
        {
            text: '放大',
            callback: function () {
                map.zoomIn()
            }
        },
        {
            text: '缩小',
            callback: function () {
                map.zoomOut()
            }
        },
        {
            text: '放置到最大级',
            callback: function () {
                map.setZoom(18)
            }
        },
        {
            text: '查看全国',
            callback: function () {
                map.setZoom(4)
            }
        },
        {
            text: '在该点添加查找圆',
            isDisable: false,
            callback: function (lnglat) {
                console.log(lnglat.getLng() + "," + lnglat.getLat());
                setCircle(lnglat.getLng(), lnglat.getLat());
            }
        }
    ];

    for (var i = 0; i < txtMenuItem.length; i++) {
        //添加菜单项
        var menuItem = new T.MenuItem(txtMenuItem[i].text, txtMenuItem[i].callback);
        menu.addItem(menuItem);
        if (i === 1) {
            //添加分割线
            menu.addSeparator();
        }
    }
    //添加右键菜单
    map.addContextMenu(menu);
}

//切换语言
function ChangeLanguage(mode=0) {
    for(var i = 0; i < getJsonLength(HintDic); i++){
        var key = Object.keys(HintDic)[i];
        var handler = "#" + key;
        var value = HintDic[key];
        $(handler).html(HintDic[key][mode]);
        if(key === "circleRadius"){
            $("#" + key).attr('placeholder', HintDic[key][mode])
        }
    }
}

//获取字典长度
function getJsonLength(jsonData) {

    var jsonLength = 0;
    for (var item in jsonData) {
        jsonLength++;
    }
    return jsonLength;
}

//添加选择功能
function addSelect() {
    $(":checkbox").on("click", function () {
        if($(":checkbox").attr("checked")){
            $(":checkbox").attr("checked","true");
        }else {
            $(":checkbox").attr("checked","false");

        }
    })
}

//全选
function SelectAll(obj) {
    if (obj.checked) {
        var checkboxs = document.getElementsByName('checkbox');
        for (var i = 0; i < checkboxs.length; i++) {
            checkboxs[i].checked = true;
        }
    } else {
        var checkboxs = document.getElementsByName('checkbox');
        for (var i = 0; i < checkboxs.length; i++) {
            checkboxs[i].checked = false;
        }
    }
}

//下载右侧栏中选中的文件
function SelectDownload() {
    var DownloadRequest = '?sta_id=';      //下载请求初始化
    var count = 0   // 有多少个台站请求被发出
    var filename = ''
    $("input[name='checkbox']:checkbox:checked").each(function () {
        var url = $(this).val();
        var id = url.substring(index + 1, url.length - 4).split('_C')[0].split('d/')[1];   //减去.csv
        filename = $(this).attr('id');
        DownloadRequest += ("%\'" + id + "\'[" + filename + ']');
        count += 1
        console.log(DownloadRequest);
    });
    if (DownloadRequest.length == 0) {
        alert("请至少选择一个选项！")
    } else {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", "http://127.0.0.1:8081/" + DownloadRequest, true);
        oReq.responseType = "blob";
        oReq.onload = function (oEvent) {
            var content = oReq.response;

            var elink = document.createElement('a');
            if(count > 1){
                elink.download = 'Climate_data_zip.zip';
            }
            else{
                elink.download = 'ClimateData_' + filename + '.xls';
            }
            elink.style.display = 'none';
            elink.onclick = alert('正在准备数据，请您耐心等待，这可能需要一些时间。(请回车或点击确定）')
            var blob = new Blob([content]);
            elink.href = URL.createObjectURL(blob);

            document.body.appendChild(elink);
            elink.click();

            document.body.removeChild(elink);
        };
        oReq.send();

        DownloadRequest = "";
    }
}