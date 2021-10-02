# coding:UTF-8
import os, json, sqlite3, zipfile
from tempfile import TemporaryDirectory
from index import genExcel
from gevent import pywsgi
from io import BytesIO
from flask import Flask, send_file, send_from_directory, render_template, make_response, request

#app = bottle.default_app()

app = Flask(__name__)
ABS_path = os.getcwd() + '\\'

# 项目根目录
PROJECT_DIR_PATH = os.path.dirname(os.path.abspath(os.path.abspath(__file__)))

# 生成文件保存目录
Save_path = 'static\\.xls_temp\\'

@app.route('/index') # url路径，在本机运行后浏览器可以通过 http://127.0.0.1:8081/html/<path> 访问该html页面，<path>表示你具体要访问的文件的名字，例如index.html
def html():             # 定义一个函数，path作为参数传给给函数
    return render_template('index.html')  # 返回你要访问的静态文件，里面两个参数，一个是path，一个是你文件所在的具体位置,例如该root表示你要访问的文件在该目录的上级目录下的html文件夹内的名为path的文件

@app.get('/.js/<path>')
def js(path):
    return send_from_directory(path, ABS_path + 'static\\.js\\')  # 返回js文件，js文件在该目录的上级目录下的js文件夹下

@app.get('/.css/<path>')
def css(path):
    return send_from_directory(path, ABS_path + 'static\\.css\\')

@app.route('/.jpg/<path>')
def jpg(path):
    return send_from_directory(path, ABS_path + 'static\\.jpg\\')

@app.route('/')
def DownLoad():
    request_head = request.args.get('sta_id')
    # 判断需要下载的是多个文件还是单个文件，每个台站id以%开头
    sta_id_list = request_head.split('%')
    tmp = sta_id_list.copy()
    sta_name_list = []
    for i in range(len(sta_id_list)):
        if len(sta_id_list[i]) >= 2:       # 至少要有一个
            sta_id_list[i] = sta_id_list[i].split('[')[0]   # split好像会修改原对象
            sta_name_list.append(tmp[i].split('[')[1].split(']')[0])
    print(sta_id_list)
    if len(sta_id_list) == 2:
        sta_id = sta_id_list[1]
        conn = sqlite3.connect('Climate_data_new.db')
        c = conn.cursor()
        c.execute("SELECT * from ClimateData where station_id={};".format(sta_id))
        print('Successfully connected to Database! Responding to required data!')
        result = c.fetchall()[0]
        c.close()

        if not result:
            return json.dumps({'ret': 1, 'msg': 'Fail to fetch Data!'})
        else:
            # 每次先把临时文件清空
            tmp_dir = ABS_path + 'static\\.temp'
            for item in os.listdir(tmp_dir):
                os.remove(tmp_dir + '\\' + item)

            tmp = genExcel(result)
            excelName = 'ClimateData_' + sta_name_list[i - 1] + '.xls'
            workbook = tmp[0]
            workbook.save(tmp_dir + "\\" + excelName)  # 保存

            return send_from_directory(tmp_dir, excelName, as_attachment=True)

    elif len(sta_id_list) > 2:
        # buffer = BytesIO()
        zipfilename = 'temfile.zip'
        tmp_dir = ABS_path + 'static/.temp/'
        for item in os.listdir(tmp_dir):
            os.remove(tmp_dir + '\\' + item)

        zfile = zipfile.ZipFile(tmp_dir + "\\" + zipfilename, 'w')
        for i in range(1, len(sta_id_list)):
            sta_id = sta_id_list[i]
            conn = sqlite3.connect('Climate_data_new.db')
            c = conn.cursor()
            c.execute("SELECT * from ClimateData where station_id={};".format(sta_id))
            print('Successfully connected to Database! Responding to required data! NO.{}'.format(i))
            result = c.fetchall()[0]
            c.close()
            if not result:
                return json.dumps({'ret': 1, 'msg': 'Fail to fetch Data!'})
            else:
                tmp = genExcel(result)
                excelName = 'ClimateData_' + sta_name_list[i - 1] + '.xls'
                workbook = tmp[0]
                workbook.save(tmp_dir + excelName)
                zfile.write(tmp_dir + excelName, arcname=excelName)
        zfile.close()
        print(tmp_dir)

        return send_from_directory(tmp_dir, zipfilename, as_attachment=True)

if __name__ == "__main__":
    app.debug = True
    server = pywsgi.WSGIServer(('127.0.0.1', 8081), app)
    print('ClimateTool version 21.06.27 \n'+
          'Service is running! 后端服务已经启动！\n'
          'Please visit http://127.0.0.1:8081/index to use. 请使用浏览器打开http://127.0.0.1:8081/index\n'
          'Use the latest version of web browser.(Edge/Chrome/etc.) 请使用最新版浏览器，如Edge/Chrome。')
    server.serve_forever()
