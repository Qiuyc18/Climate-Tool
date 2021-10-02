# coding:UTF-8

import pandas as pd
import os, xlrd, xlwt, sqlite3, openpyxl
from copy import deepcopy
from xlutils.copy import copy

# 项目根目录
PROJECT_DIR_PATH = os.path.dirname(os.path.abspath(os.path.abspath(__file__)))

# 生成文件保存目录
Save_path = 'static\\.xls_temp\\'
if not os.path.dirname(PROJECT_DIR_PATH + '\\' + Save_path):
    os.mkdir(Save_path)

# 为样式创建字体
def get_font():
    font = xlwt.Font()

    # 字体类型
    font.name = 'name Times New Roman'
    # 字体颜色
    font.colour_index = 0
    # 字体大小，11为字号，20为衡量单位
    font.height = 20 * 11
    # 字体加粗
    font.bold = True
    # 下划线
    font.underline = False
    # 斜体字
    font.italic = False

    return font

# 从数据库字符串中获取数据
def str_to_list(str):
    list = str.split('%')[1].split(' ')
    for i in range(len(list)):
        list[i] = float(list[i])
    return list

# 从数据库里写入EXCEL
def genExcel(result, KeepOriStyle = True): # 是否保留原样式

    # 模板文件
    template = xlrd.open_workbook('static\\.xls_template\\export_template.xls')

    # 修改每个文件名称的后缀，如: 293_1340_EXPORT.xlsx
    name_suffix = 'ClimateData.xls'

    # 获取设置字体格式
    style_font = xlwt.XFStyle()
    style_font.font = get_font()
    pattern = xlwt.Pattern()
    pattern.pattern = xlwt.Pattern.SOLID_PATTERN  # May be: NO_PATTERN, SOLID_PATTERN, or 0x00 through 0x12
    pattern.pattern_fore_colour = 26  # 给背景颜色赋值
    style_font.pattern = pattern
    border = xlwt.Borders()
    border.left = 1
    border.right = 1
    border.top = 1
    border.bottom = 1
    border.left_colour = 0
    border.right_colour = 0
    border.top_colour = 0
    border.bottom_colour = 0

    style_font.borders = border

    # 开始生成表格
    workbook = deepcopy(copy(template))
    station_id = result[2]   # 2号位是台站id

    tmy = {}
    for i in range(2, 21):
        tmy[i] = str_to_list(result[i + 1])
    tmy_sheet = workbook.get_sheet(0)
    tmy_sheet.set_name(station_id + '_tmy')
    # 读取所有tmy数据写入到Excel里
    for iRow in range(0, len(tmy[2])):
        tmy_sheet.write(iRow + 3, 1, iRow, style_font)
    for key in tmy.keys():
        for iRow in range(0, len(tmy[key])):     # 从4行3列开始写
            tmy_sheet.write(iRow + 3, key, tmy[key][iRow], style_font)

    data1_sheet = workbook.get_sheet(1)
    data1_sheet.set_name(station_id + '_designdata1')
    data1 = str_to_list(result[22])
    # 读取所有designdata1数据到Excel里
    for iRow in range(0, len(data1)):  # 从3行4列开始写
        data1_sheet.write(iRow + 2, 3, data1[iRow], style_font)

    data2_sheet = workbook.get_sheet(2)
    data2_sheet.set_name(station_id + '_designdata2')
    data2 = {}
    for i in range(4, 7):
        data2[i] = str_to_list(result[i + 19])   # 对应关系稍稍有点儿复杂，淦
    # 读取所有designdata2数据到Excel里
    for key in data2.keys():
        for iRow in range(0, len(data2[key])):     # 从4行5列开始写
            data2_sheet.write(iRow + 3, key, data2[key][iRow], style_font)

    #保存&发送
    xlsx_name = station_id + '_' + name_suffix
    # workbook.save(Save_path + xlsx_name)      # 保存

    print('已导出文件: {}'.format(xlsx_name))
    # print(type(workbook))
    return [workbook, xlsx_name]

'''sta_id = "'200_0465'"
conn = sqlite3.connect('Climate_data_new.db')
c = conn.cursor()
c.execute("SELECT * from ClimateData where station_id={};".format(sta_id))
print('Successfully connected to Database!')
result = c.fetchall()[0]
c.close()

res = genExcel(result)'''