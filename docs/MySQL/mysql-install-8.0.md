---
title: 使用官方二进制包方式安装 MySQL 8.0 服务器
createTime: 2025/06/27 09:43:39
permalink: /article/mysql-install/8.0/
excerpt: 本文基于官方 MySQL 8.0 安全部署指南，记录了部署 MySQL 社区版服务器 Linux 通用二进制发行版的步骤。
tags:
- MySQL
---



::: tip 说明

本文基于官方 [MySQL 8.0 安全部署指南](https://dev.mysql.com/doc/mysql-secure-deployment-guide/8.0/en/)，记录了部署 MySQL 社区版服务器 Linux 通用二进制发行版的步骤。

官方的《MySQL 8.0 Secure Deployment Guide》主要面向企业版，而本文使用的是 **MySQL Community Edition（社区版）** 的 **Linux 通用二进制包** 进行部署。请注意，**社区版可能并不包含企业版的某些安全特性**。

:::



## 1. 下载 MySQL for Linux 通用二进制包

访问 [MySQL 官网下载页面](https://downloads.mysql.com/archives/community/)，选择适合的 MySQL 8.0 版本进行下载。

本文使用 `mysql-8.0.39-linux-glibc2.28-x86_64` 版本。

```bash
# Product Version: 8.0.39
# Operating System: Linx - Generic
# OS Version: Linux - Generic (glibc 2.28) (x86, 64-bit)

VERSION_OS="8.0.39-linux-glibc2.28-x86_64"
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-$VERSION_OS.tar.xz
```



## 2. 安装 MySQL for Linux 通用二进制包

### 安装先决条件

MySQL 依赖于 `libaio` 库。如果本地未安装此库，数据目录初始化和后续服务器启动步骤将失败。如有必要，请使用相应的软件包管理器安装它。

::: tabs

@tab 使用 yum 安装

```bash
yum search libaio  # search for info
yum install libaio # install library
```

@tab 使用 apt 安装

```bash
apt-cache search libaio # search for info
apt-get install libaio1 # install library
```

:::

软件包 `/lib64/libtinfo.so.5` 是 **MySQL 客户端 bin/mysql** 所需的。

::: tabs

@tab 使用 yum 安装

```bash
yum install ncurses-compat-libs
```

@tab 使用 apt 安装

```bash
apt-get install libncurses5
```

:::



### 创建 MySQL 用户和组

使用 `groupadd` 命令添加 `mysql` 组

```bash
groupadd -g 27 -o -r mysql
```

groupadd `-g 27` 及其 `-o`  选项会分配一个非唯一的组 ID (GID)。`-r` 选项会将该组设置为系统组。



使用 `useradd` 命令添加 `mysql` 用户

```bash
DATADIR="/usr/local/mysql/data"
useradd -M -N -g mysql -o -r -d $DATADIR -s /bin/false -c "MySQL Server" -u 27 mysql
```

- `-M` 选项可防止创建用户主目录。
- `-N` 选项表示将用户添加到该 `-g` 选项指定的组中。
- `-o` 和 选项`-u 27`分配非唯一的用户 ID (UID)。
- `-r` 和 `-s /bin/false` 选项会创建一个没有服务器主机登录权限的用户。mysql 用户仅用于所有权目的，而非登录目的。
- `-d` 选项指定用户登录目录，该目录设置为预期的 MySQL 数据目录路径。
- `-c` 选项指定描述帐户的注释。



### 解压二进制发行版

```
# VERSION_OS="8.0.39-linux-glibc2.28-x86_64"
tar xvf mysql-$VERSION_OS.tar.xz -C /usr/local/

# 创建指向安装目录的符号链接
ln -s /usr/local/mysql-$VERSION_OS /usr/local/mysql
```



MySQL Linux 通用二进制分发目录

| **目录**      | **目录内容**                                                 |
| ------------- | ------------------------------------------------------------ |
| bin           | mysqld 服务器；客户端和实用程序                              |
| docs          | Info 格式的 MySQL 手册                                       |
| man           | Unix 手册页                                                  |
| include       | 依赖（头）文件                                               |
| lib           | 程序库 / 共享函数库                                          |
| share         | 杂项文件，包括错误消息、示例配置文件、数据库安装的 SQL       |
| support-files | 与管理多个服务器进程、自动启动配置和日志轮换相关的其他支持文件。 |



## 3. 安装 MySQL 后的设置

### 创建 mysql-files 安全目录

```bash
mkdir /usr/local/mysql/mysql-files
chown mysql:mysql /usr/local/mysql/mysql-files
chmod 750 /usr/local/mysql/mysql-files
```



### 配置服务器启动选项

```bash
touch /etc/my.cnf
chown root:root /etc/my.cnf
chmod 644 /etc/my.cnf

cat <<EOF > /etc/my.cnf
[mysqld]
character-set-server=utf8mb4
log_timestamps=SYSTEM
datadir=$DATADIR
socket=/tmp/mysql.sock
port=3306
log-error=/usr/local/mysql/data/localhost.localdomain.err
user=mysql
secure_file_priv=/usr/local/mysql/mysql-files
local_infile=OFF
EOF
```



### 初始化数据目录

创建数据目录

```bash
mkdir $DATADIR
chmod 750 $DATADIR
chown mysql:mysql $DATADIR
```



初始化数据目录

```bash
/usr/local/mysql/bin/mysqld --defaults-file=/etc/my.cnf --initialize
# 使用 --initialize-insecure 选项将不生成 root@localhost 帐户的初始随机密码
```

初始化输出将打印到错误日志 (/usr/local/mysql/data/localhost.localdomain.err)，类似于以下输出。

输出包含 root@localhost 帐户的初始随机密码。稍后重置 root@localhost 密码时需要此密码。

```
2018-05-02T17:47:49.806563Z 0 [System] [MY-013169] [Server] 
/usr/local/mysql-commercial-8.0.11-linux-glibc2.12-x86_64/bin/mysqld (mysqld 8.0.11-commercial) 
initializing of server in progress as process 16039
2018-05-02T17:47:54.083010Z 5 [Note] [MY-010454] [Server] 
A temporary password is generated for root@localhost: uZmx9ihSd2;.
2018-05-02T17:47:56.225881Z 0 [System] [MY-013170] [Server] 
/usr/local/mysql-commercial-8.0.11-linux-glibc2.12-x86_64/bin/mysqld (mysqld 8.0.11-commercial) 
initializing of server has completed
```



### 使用 systemd 启动服务

创建一个 systemd 服务单元配置文件

```bash
touch /usr/lib/systemd/system/mysqld.service
chmod 644 /usr/lib/systemd/system/mysqld.service
```



将配置信息添加到 `mysqld.service` 文件

```bash
cat <<'EOF' > /usr/lib/systemd/system/mysqld.service
[Unit]
Description=MySQL Server
Documentation=man:mysqld(8)
Documentation=http://dev.mysql.com/doc/refman/en/using-systemd.html
After=network.target
After=syslog.target

[Install]
WantedBy=multi-user.target

[Service]
User=mysql
Group=mysql

# Have mysqld write its state to the systemd notify socket
Type=notify

# Disable service start and stop timeout logic of systemd for mysqld service.
TimeoutSec=0

# Start main service
ExecStart=/usr/local/mysql/bin/mysqld --defaults-file=/etc/my.cnf $MYSQLD_OPTS 

# Use this to switch malloc implementation
EnvironmentFile=-/etc/sysconfig/mysql

# Sets open_files_limit
LimitNOFILE = 10000

Restart=on-failure

RestartPreventExitStatus=1

# Set environment variable MYSQLD_PARENT_PID. This is required for restart.
Environment=MYSQLD_PARENT_PID=1

PrivateTmp=false
EOF
```



启动 MySQL 服务并设置开机自启

```bash
systemctl enable mysqld.service
systemctl start mysqld.service
```



### 重置 MySQL root 账户密码

初始化数据目录时，会为 MySQL `root` 帐户生成一个随机初始密码 ( `root@localhost`)，并将其标记为已过期。请执行以下步骤设置新密码：

```bash
/usr/local/mysql/bin/mysql -u root -p
Enter password: (enter the random root password here)
```



连接后，指定一个新 `root@localhost` 密码。请使用强密码。

```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
```



## TL;DR

```bash :collapsed-lines=9
apt-cache search libaio # search for info
apt-get install libaio1 # install library numactl libncurses5

VERSION_OS="8.0.39-linux-glibc2.28-x86_64"
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-$VERSION_OS.tar.xz

DATADIR="/usr/local/mysql/data"
groupadd -g 27 -o -r mysql
useradd -M -N -g mysql -o -r -d $DATADIR -s /bin/false -c "MySQL Server" -u 27 mysql

# mkdir -p /usr/local/mysql
# tar xvf mysql-$VERSION_OS.tar.xz --strip-components=1 -C /usr/local/mysql
tar xvf mysql-$VERSION_OS.tar.xz -C /usr/local/
ln -s /usr/local/mysql-$VERSION_OS /usr/local/mysql

export PATH=/usr/local/mysql/bin:$PATH
echo 'export PATH=$PATH:/usr/local/mysql/bin' >> /etc/profile

mkdir /usr/local/mysql/mysql-files
chown mysql:mysql /usr/local/mysql/mysql-files
chmod 750 /usr/local/mysql/mysql-files

touch /etc/my.cnf
chown root:root /etc/my.cnf
chmod 644 /etc/my.cnf

cat <<EOF > /etc/my.cnf
[mysqld]
character-set-server=utf8mb4
log_timestamps=SYSTEM
datadir=$DATADIR
socket=/tmp/mysql.sock
port=3306
log-error=/usr/local/mysql/data/localhost.localdomain.err
user=mysql
secure_file_priv=/usr/local/mysql/mysql-files
local_infile=OFF
EOF

mkdir $DATADIR
chmod 750 $DATADIR
chown mysql:mysql $DATADIR

/usr/local/mysql/bin/mysqld --defaults-file=/etc/my.cnf --initialize-insecure

touch /usr/lib/systemd/system/mysqld.service
chmod 644 /usr/lib/systemd/system/mysqld.service

cat <<'EOF' > /usr/lib/systemd/system/mysqld.service
[Unit]
Description=MySQL Server
Documentation=man:mysqld(8)
Documentation=http://dev.mysql.com/doc/refman/en/using-systemd.html
After=network.target
After=syslog.target

[Install]
WantedBy=multi-user.target

[Service]
User=mysql
Group=mysql

# Have mysqld write its state to the systemd notify socket
Type=notify

# Disable service start and stop timeout logic of systemd for mysqld service.
TimeoutSec=0

# Start main service
ExecStart=/usr/local/mysql/bin/mysqld --defaults-file=/etc/my.cnf $MYSQLD_OPTS 

# Use this to switch malloc implementation
EnvironmentFile=-/etc/sysconfig/mysql

# Sets open_files_limit
LimitNOFILE = 10000

Restart=on-failure

RestartPreventExitStatus=1

# Set environment variable MYSQLD_PARENT_PID. This is required for restart.
Environment=MYSQLD_PARENT_PID=1

PrivateTmp=false
EOF

systemctl enable mysqld.service
systemctl start mysqld.service

mysql -u root --skip-password
# mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';

# mysql> CREATE USER 'root'@'127.0.0.1' IDENTIFIED BY 'password';
# mysql> CREATE USER 'root'@'::1' IDENTIFIED BY 'password';

# mysql> CREATE USER 'root'@'%' IDENTIFIED BY 'password';
# mysql> GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';

# $> cd /usr/local/mysql
# $> bin/mysqlshow -u root -p
# Enter password: (enter root password here)
# +--------------------+
# |     Databases      |
# +--------------------+
# | information_schema |
# | mysql              |
# | performance_schema |
# | sys                |
# +--------------------+

# $> cd /usr/local/mysql
# $> bin/mysqladmin -u root -p version
# Enter password: (enter root password here)
# mysqladmin  Ver 8.0.39 for Linux on x86_64 (MySQL Community Server - GPL)
# Copyright (c) 2000, 2024, Oracle and/or its affiliates.

# Oracle is a registered trademark of Oracle Corporation and/or its
# affiliates. Other names may be trademarks of their respective
# owners.

# Server version          8.0.39
# Protocol version        10
# Connection              Localhost via UNIX socket
# UNIX socket             /tmp/mysql.sock
# Uptime:                 5 min 12 sec

# Threads: 2  Questions: 7  Slow queries: 0  Opens: 148  Flush tables: 3
# Open tables: 64  Queries per second avg: 0.022
```

