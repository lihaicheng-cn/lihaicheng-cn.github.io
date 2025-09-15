---
title: phpMyAdmin，MySQL 和 MariaDB 的 Web 界面
createTime: 2025/09/15 10:07:50
permalink: /article/phpmyadmin/
excerpt: 使用 phpMyAdmin，通过 Web 来管理和使用 MySQL 和 MariaDB 数据库。
tags:
- MySQL
- Nginx
- PHP
- phpMyAdmin
---

phpMyAdmin 是一款用 PHP 编写的免费软件工具，旨在通过 Web 管理 MySQL。phpMyAdmin 支持 MySQL 和 MariaDB 的各种操作。您可以通过用户界面执行常用操作（管理数据库、表、列、关系、索引、用户、权限等），同时您仍然可以直接执行任何 SQL 语句。

官方网站：[https://www.phpmyadmin.net/](https://www.phpmyadmin.net/)

仓库地址：[https://github.com/phpmyadmin/phpmyadmin](https://github.com/phpmyadmin/phpmyadmin)

## 1. 安装 Nginx 和 PHP 环境

安装 Nginx，使用 Linux packages 方式安装。

文档：[https://nginx.org/en/linux_packages.html](https://nginx.org/en/linux_packages.html)

使用包管理器，安装 PHP 环境

::: tabs
@tab CentOS

```bash
yum install php php-fpm php-mysqlnd php-mbstring
```

@tab Ubuntu

```bash
apt install php php-fpm php-mysql php-mbstring
```

:::

验证安装环境，环境为 Ubuntu 操作系统

```bash
$ nginx -v
nginx version: nginx/1.28.0

$ php -v
PHP 8.1.2-1ubuntu2.22 (cli) (built: Jul 15 2025 12:11:22) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.1.2, Copyright (c) Zend Technologies
    with Zend OPcache v8.1.2-1ubuntu2.22, Copyright (c), by Zend Technologies

$ php -m | grep -E 'mysqlnd|mbstring'
mbstring
mysqlnd
```

## 2. 下载 phpMyAdmin

下载 phpMyAdmin 包到当前目录

```bash
VERSION='5.2.2'
wget https://files.phpmyadmin.net/phpMyAdmin/$VERSION/phpMyAdmin-$VERSION-all-languages.tar.gz
```

## 3. 解压 phpMyAdmin

解压 phpMyAdmin 包到 `/usr/share/nginx/html/` 目录

```bash
tar zxf phpMyAdmin-$VERSION-all-languages.tar.gz -C /usr/share/nginx/html/
mv /usr/share/nginx/html/phpMyAdmin-$VERSION-all-languages /usr/share/nginx/html/phpMyAdmin
```

## 4. 修改默认配置文件

创建并修改默认配置文件

```bash
cp /usr/share/nginx/html/phpMyAdmin/config.sample.inc.php /usr/share/nginx/html/phpMyAdmin/config.inc.php
sed -e "/blowfish_secret/ s#=.*;#= '$(php -r 'echo bin2hex(random_bytes(16));')';#" \
    -e 's/localhost/127.0.0.1/g' /usr/share/nginx/html/phpMyAdmin/config.inc.php -i

# echo "\$cfg['AllowArbitraryServer'] = true;" >> /usr/share/nginx/html/phpMyAdmin/config.inc.php
```

创建 php 临时目录并授权

```bash
mkdir /usr/share/nginx/html/phpMyAdmin/tmp/
chmod 777 /usr/share/nginx/html/phpMyAdmin/tmp/
```

## 5.  创建 Nginx 配置文件

```bash
cat <<'EOF' > /etc/nginx/conf.d/phpmyadmin.conf
server {
    listen       443 ssl;
    server_name  mysql.domain.com; # 修改为需要使用的域名

    if ($host != $server_name ) {
        rewrite ^(.*)$ http://${host}$1 permanent;
    }

    ssl_certificate      /etc/letsencrypt/live/domain.com/fullchain.pem;
    ssl_certificate_key  /etc/letsencrypt/live/domain.com/privkey.pem;

    ssl_session_cache    shared:SSL:1m;
    ssl_session_timeout  5m;

    ssl_ciphers  HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers  on;

    access_log     /var/log/nginx/phpmyadmin.access.log  main;

    location /phpMyAdmin {
        root   /usr/share/nginx/html;
        index  index.html index.htm index.php;

        location ~* ^/phpMyAdmin/(.+\.(jpg|jpeg|gif|css|png|js|ico|html|xml|txt))$ {
            root /usr/share/nginx/html;
        }
    }

    location ~ \.php$ {
        root           /usr/share/nginx/html;
        fastcgi_pass   127.0.0.1:9000;
        fastcgi_index  index.php;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include        fastcgi_params;
    }
}
EOF
```

验证和重启 Nginx

```bash
nginx -t
systemctl restart nginx
```
