---
title: 如何申请并自动续期 Let's Encrypt 通配符证书
createTime: 2025/05/19 09:21:56
permalink: /article/ssl/lets-encrypt-certbot-aliyun/
excerpt: 本文将介绍如何通过 certbot + 阿里云 DNS API 自动申请和续期 Let’s Encrypt 通配符证书。
tags:
- Certbot
- Let's Encrypt
- SSL/TLS
---


::: tip 说明

本文将介绍如何通过 certbot + 阿里云 DNS API 申请和自动续期 Let's Encrypt 通配符证书。

:::

官方网站：[https://letsencrypt.org/zh-cn/](https://letsencrypt.org/zh-cn/)

参考文档：[https://letsencrypt.org/zh-cn/docs/](https://letsencrypt.org/zh-cn/docs/)



## 1. 什么是 Let's Encrypt？

Let's Encrypt 是一家免费、开放、自动化的证书颁发机构，由非营利组织[互联网安全研究组](https://www.abetterinternet.org/) (ISRG) 运作。



### Let's Encrypt 的运作方式

Let's Encrypt 和 [ACME 协议](https://tools.ietf.org/html/rfc8555) 的目标是实现可信数字证书的自动获取，从而简化 HTTPS 服务器部署中的人工操作。 这一目标是由 Web 服务器上的证书管理软件完成的。

流程分为两步。 首先，管理软件向证书颁发机构证明该服务器拥有域名的控制权。 之后，该管理软件就可以申请、续期或吊销该域名的证书。

::: note

官网文档查看详细的 [Let's Encrypt 的运作方式](https://letsencrypt.org/zh-cn/how-it-works/)

:::



## 2. 前置环境说明

本文档命令执行操作基于 Ubuntu 22.04 系统，其他 Linux 发行版可以参考执行，但部分命令路径和软件包可能略有不同。

域名注册商使用阿里云并使用阿里云的 DNS 服务。因为使用的是 DNS-01 验证方式，并借助阿里云的 API 自动添加 DNS 记录，因此域名需要 **使用阿里云作为 DNS 解析服务商**，否则插件将无法自动完成验证。

| 环境               | 版本                                                         |
| ------------------ | ------------------------------------------------------------ |
| system             | Ubuntu 22.04.4 LTS                                           |
| certbot            | certbot 3.3.0                                                |
| pip                | pip 22.0.2 from /usr/lib/python3/dist-packages/pip (python 3.10) |
| certbot-dns-aliyun | certbot-dns-aliyun 2.0.0                                     |



## 3. 安装 Certbot 和依赖插件

官方网站：[https://certbot.eff.org/](https://certbot.eff.org/)

Certbot 是一款免费的开源软件工具，用于在手动管理的网站上自动使用 [Let's Encrypt 证书来启用 HTTPS](https://letsencrypt.org/)。

使用 APT 命令安装 Certbot 及其依赖包：

```bash
apt install certbot
```



## 4. 安装 DNS 插件：certbot-dns-aliyun

> **Aliyun DNS Authenticator plugin for Certbot**
>
> A certbot dns plugin to obtain certificates using aliyun.



Github 地址：[https://github.com/tengattack/certbot-dns-aliyun](https://github.com/tengattack/certbot-dns-aliyun)

使用 `pip` 命令安装 certbot-dns-aliyun 阿里云 DNS 插件

```bash
pip install certbot-dns-aliyun
```

或者手动安装：

```bash
git clone https://github.com/tengattack/certbot-dns-aliyun
cd certbot-dns-aliyun
sudo python setup.py install
```



## 5. 获取阿里云 RAM 访问密钥

[https://ram.console.aliyun.com/](https://ram.console.aliyun.com/)

并确保你的 RAM 账户有 `AliyunDNSFullAccess` 权限。

::: warning

这里建议新建一个 RAM 子账号，仅授予子账号 `AliyunDNSFullAccess` 权限。

:::

#### 访问密钥文件 AK/SK

```bash
cat <<EOF > /etc/letsencrypt/aksk.ini
dns_aliyun_access_key = xxx
dns_aliyun_access_key_secret = xxx
EOF

chmod 600 /etc/letsencrypt/aksk.ini
```

::: note

- 创建 `aksk.ini` 文件用于保存阿里云的 AccessKey；
- 将文件权限设置为 `600` 以保护密钥安全。

:::



## 6. 申请通配符证书

运行 `certbot certonly` 命令，申请证书：

```bash
certbot certonly --authenticator=dns-aliyun \
    --dns-aliyun-credentials='/etc/letsencrypt/aksk.ini' \
    --preferred-challenges dns-01 \
    --server https://acme-v02.api.letsencrypt.org/directory \
    -d "*.example.com"
```

命令参数说明：

- `certonly`：只申请证书，不自动安装（适用于 Nginx、Apache 手动配置场景）。
- `--authenticator=dns-aliyun`：使用阿里云 DNS 插件进行验证。
- `--dns-aliyun-credentials`：指定含有 AccessKey 的配置文件路径。
- `--preferred-challenges dns-01`：指定使用 DNS 方式验证域名所有权。
- `--server`：明确指定 ACME v2 的服务器地址。
- `-d "*.example.com"`：目标域名，通配符格式。



## 7. 查看证书和自动续期

```bash
root@localhost:~# certbot certificates
Saving debug log to /var/log/letsencrypt/letsencrypt.log

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Found the following certs:
  Certificate Name: example.com
    Serial Number: 590508d4b90daf0b32ea24e65174d733325
    Key Type: ECDSA
    Domains: *.example.com
    Expiry Date: 2025-06-26 00:38:30+00:00 (VALID: 37 days)
    Certificate Path: /etc/letsencrypt/live/example.com/fullchain.pem
    Private Key Path: /etc/letsencrypt/live/example.com/privkey.pem
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

查看 `certbot.timer` 服务下次运行的时间：

```bash
root@localhost:~# systemctl list-timers certbot.timer
NEXT                        LEFT       LAST                        PASSED       UNIT          ACTIVATES      
Mon 2025-05-19 13:24:15 CST 23min left Mon 2025-05-19 07:02:12 CST 5h 58min ago certbot.timer certbot.service

1 timers listed.
Pass --all to see loaded but inactive timers, too.
```

