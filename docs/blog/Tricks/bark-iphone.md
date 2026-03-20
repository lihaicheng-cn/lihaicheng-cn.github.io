---
title: 'Bark: 一款注重隐私、安全可控的自定义通知推送工具'
createTime: 2025/05/21 23:09:40
permalink: /article/tricks/bark-app/
excerpt: 免费轻量、简单调用接口即可向你的 iPhone 推送通知，依赖苹果 APNs 实现及时、稳定、低功耗的系统级推送，隐私安全，支持防止包括作者在内的任何人窃取你的信息。
cover: /images/logo/bark.png
coverStyle:
  width: 200
tags:
- IOS
---



免费轻量、简单调用接口即可向你的 iPhone 推送通知，依赖苹果 APNs 实现及时、稳定、低功耗的系统级推送，隐私安全，支持防止包括作者在内的任何人窃取你的信息。

Bark 应用只支持 IOS 平台，[通过 App Store 下载](https://apps.apple.com/cn/app/bark-%E7%BB%99%E4%BD%A0%E7%9A%84%E6%89%8B%E6%9C%BA%E5%8F%91%E6%8E%A8%E9%80%81/id1403753865)

官方网站：[https://bark.day.app/](https://bark.day.app/)

Github 地址：[https://bark.day.app/](https://bark.day.app/)



## 1. 应用内推送示例

安装应用后，第一次使用会要求注册一个设备ID，使用此设备ID 进行消息推送通知。



:::: tabs

@tab:active 推送内容

::: tip

修改 `推送内容` 为需要推送的内容。

:::

```
https://api.day.app/[ID]/推送内容
```



@tab 推送标题

::: tip

修改 `推送标题`、 `推送内容` 为需要推送的标题和内容。

:::

```
https://api.day.app/[ID]/推送标题/推送内容
```



@tab 推送铃声

::: tip

可以为推送设置不同的铃声，在应用内查看所有铃声。

:::

```
https://api.day.app/[ID]/推送铃声?sound=minuet
```



@tab 持续响铃

```
https://api.day.app/[ID]/持续响铃?call=1
```



@tab ......

::::

更多示例可以进入应用内查看，使用浏览器访问网址，即可获得 IOS 应用推送。



## 2. 自建推送服务器

默认应用的推送服务器是 `https://api.day.app/`，该应用支持自建推送服务器，适合对隐私性要求较高的用户使用。

官方文档：[https://bark.day.app/#/deploy](https://bark.day.app/#/deploy)

### Docker

```bash
docker run -dt --name bark -p 8080:8080 -v `pwd`/bark-data:/data finab/bark-server
# 镜像也可使用 ghcr.io/finb/bark-server
```



### Docker-Compose

```bash
mkdir bark && cd bark
curl -sL https://git.io/JvSRl > docker-compose.yaml
docker-compose up -d
```



### 手动部署

根据平台下载可执行文件：[https://github.com/Finb/bark-server/releases](https://github.com/Finb/bark-server/releases)

或自己编译：[https://github.com/Finb/bark-server](https://github.com/Finb/bark-server)

运行服务端：

```
./bark-server_linux_amd64 -addr 0.0.0.0:8080 -data ./bark-data
```



::: note

请注意 bark-server 默认使用 /data 目录保存数据，请确保 bark-server 有权限读写 /data 目录，或者你可以使用 `-data` 选项指定一个目录

:::

更多部署方式，请查看[官方文档](https://bark.day.app/#/deploy)。



## 3. 实际应用效果

通过抓取[上海黄金交易所](https://www.sge.com.cn/)信息，实现定时推送当前黄金价格。

::: code-tabs
@tab:active au99.99.py

```python :collapsed-lines=12
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import quote_plus
import logging
import os
import json

logging.basicConfig(level=logging.INFO, format='%(message)s', handlers=[logging.StreamHandler()])

# 缓存文件路径
CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "gold_price_cache.json")

def load_previous_data():
    """加载上次的价格数据"""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Failed to load cache: {str(e)}")
    return {"latest_price": None, "highest_price": None, "lowest_price": None}

def save_current_data(data):
    """保存当前价格数据到缓存文件"""
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(data, f)
    except Exception as e:
        logging.error(f"Failed to save cache: {str(e)}")

# 设置目标网页与请求头
url = "https://www.sge.com.cn/sjzx/yshqbg"
headers = {"User-Agent": "Mozilla/5.0"}

# 加载上次的价格数据
previous_data = load_previous_data()

response = requests.get(url, headers=headers)
response.encoding = response.apparent_encoding
soup = BeautifulSoup(response.text, "html.parser")
rows = soup.select("div.jzjcont tr.border_ea")
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

for row in rows:
    cols = row.find_all("td")
    if cols and cols[0].text.strip() == "Au99.99":
        latest_price = cols[1].text.strip()
        highest_price = cols[2].text.strip()
        lowest_price = cols[3].text.strip()
        opening_price = cols[4].text.strip()

        if latest_price == "0" or latest_price == "0.0":
            logging.info("Latest price is 0, skipping push notification")
            break

        # 当前数据
        current_data = {
            "latest_price": latest_price,
            "highest_price": highest_price,
            "lowest_price": lowest_price
        }
        
        # 检查价格是否与上次相同
        if (previous_data["latest_price"] == current_data["latest_price"] and
            previous_data["highest_price"] == current_data["highest_price"] and
            previous_data["lowest_price"] == current_data["lowest_price"]):
            logging.info(f"Prices unchanged, skipping push notification.")
            break

        # 构造推送内容
        title = quote_plus("中国上海黄金交易所")
        body = quote_plus(
            f"[{now}]\n"
            f"- 最新价：{latest_price} 元/克\n"
            f"- 最高价：{highest_price} 元/克\n"
            f"- 最低价：{lowest_price} 元/克"
            # f"- 今开盘：{opening_price} 元/克"
        )

        # 替换成你自己的 Bark token
        bark_token = "Bark ID"
        bark_url = f"https://api.day.app/{bark_token}/{title}/{body}"

        # 发送 Bark 推送
        try:
            push_response = requests.get(bark_url)
            if push_response.status_code == 200:
                logging.info(f"Push Success Au99.99: {latest_price} {highest_price} {lowest_price} {opening_price}")
                # 保存当前数据作为下次比较的基准
                save_current_data(current_data)
            else:
                logging.error(f"Push failed: {push_response.text}")
        except Exception as e:
            logging.error(f"Push exception: {str(e)}")
        break
else:
    logging.error("No Au99.99 data found")
```

@tab au9999.service
```
# /etc/systemd/system/au9999.service
[Unit]
Description=Run au99.99.py gold price script
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /usr/local/bin/au99.99.py
User=root
Group=root

[Install]
WantedBy=multi-user.target
```
@tab au9999.timer

```
# /etc/systemd/system/au9999.timer
[Unit]
Description=Timer for au99.99.py gold price script
Requires=au9999.service

[Timer]
Unit=au9999.service

# 白天时间段 (6:00-22:00) 每10分钟运行一次
OnCalendar=*-*-* 06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21:00,10,20,30,40,50:00
OnCalendar=*-*-* 06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21:05,15,25,35,45,55:00
# 晚上时间段 (22:00-6:00) 每30分钟运行一次
OnCalendar=*-*-* 22,23,00,01,02,03,04,05:00,30:00

Persistent=true

[Install]
WantedBy=timers.target
```

:::

IOS 端效果图：略...... 

ps：还没找到好用的图床。
