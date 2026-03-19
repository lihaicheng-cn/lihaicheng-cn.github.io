---
title: Harbor 企业级容器镜像仓库安装与代理缓存配置实践
createTime: 2026/03/17 16:06:25
permalink: /article/docker/harbor-install/
excerpt: 本文介绍 Harbor 的安装与配置流程，另外讲解如何通过 Proxy Cache 实现 Docker Hub 等远程仓库的镜像代理与本地缓存。
tags:
- Harbor
---



> 本文介绍如何执行 Harbor 的全新安装，另外讲解如何通过 Proxy Cache 实现 Docker Hub 等远程仓库的镜像代理与本地缓存。



::: tip 什么是 Harbor?

Harbor 是一个开源镜像仓库，通过策略和基于角色的访问控制来保护镜像，确保镜像经过扫描且没有漏洞，并将镜像签名为可信镜像。Harbor 是一个 CNCF 毕业项目，提供合规性、性能和互操作性，帮助您在 Kubernetes 和 Docker 等云原生计算平台上一致且安全地管理镜像。

:::



## 1. Harbor 的安装先决条件

Harbor 可以使用 Docker Compose 部署到 Docker 主机，或使用 Helm 部署到 Kubernetes 集群。

### 资源需求

下表概述了部署 Harbor 的最低和建议资源需求。

| **资源** | **最低** | **推荐** |
| -------- | -------- | -------- |
| CPU      | 2 CPU    | 4 CPU    |
| 内存     | 4 GB     | 8 GB     |
| 磁盘     | 40 GB    | 160 GB   |

### 软件堆栈要求 Compose

下表列出了目标主机上必须安装的软件版本。

| **软件**       | **版本**             | **描述**                                                     |
| -------------- | -------------------- | ------------------------------------------------------------ |
| Docker 引擎    | 版本 > 20.10         | [Docker 引擎安装](https://docs.container.net.cn/engine/install/) |
| Docker Compose | Docker Compose > 2.3 | Docker Compose 是 Docker 引擎的一部分                        |
| OpenSSL        | 最新 (可选)          | 用于为 Harbor 生成证书和密钥                                 |

### 网络端口

Harbor 要求目标主机上打开以下端口。

| **端口** | **协议** | **描述**                                                     |
| -------- | -------- | ------------------------------------------------------------ |
| 443      | HTTPS    | Harbor 门户和核心 API 在此端口上接受 HTTPS 请求。您可以在配置文件中更改此端口。 |
| 80       | HTTP     | Harbor 门户和核心 API 在此端口上接受 HTTP 请求。您可以在配置文件中更改此端口。 |



## 2. 下载 Harbor 安装程序

可以从 [官方发布](https://github.com/goharbor/harbor/releases) 页面下载 Harbor 安装包。下载在线安装包或离线安装包。

- **在线安装包：** 在线安装包从 Docker Hub 下载 Harbor 镜像。因此，安装包体积非常小。
- **离线安装包：** 如果您要部署 Harbor 的主机无法连接到互联网，请使用离线安装包。离线安装包包含预构建的镜像，因此它比在线安装包更大。

在线和离线安装包的安装过程几乎相同。

### 下载并解压安装包

::: tabs

@tab 下载离线安装包（推荐）

```bash
VERSION="v2.14.3" # 指定需要下载的版本
wget https://github.com/goharbor/harbor/releases/download/${VERSION}/harbor-offline-installer-${VERSION}.tgz
```

@tab 下载在线安装包

```bash
VERSION="v2.14.3" # 指定需要下载的版本
wget https://github.com/goharbor/harbor/releases/download/${VERSION}/harbor-online-installer-${VERSION}.tgz
```

:::

使用 `tar` 命令解压安装包

::: tabs

@tab 离线安装包

```bash
tar zxvf harbor-offline-installer-${VERSION}.tgz
```

@tab 在线安装包

```bash
tar zxvf harbor-online-installer-${VERSION}.tgz
```

:::



## 3. 配置 Harbor 的 HTTPS 访问

要配置 HTTPS，必须创建 SSL 证书。可以使用由受信任的第三方 CA 签名的证书，也可以使用自签名证书。

::: warning 重要提示

Harbor 默认不包含任何证书。在 1.9.x 及更早版本中，Harbor 默认使用 HTTP 协议处理注册表请求。这仅适用于与外部网络隔离的测试或开发环境。在生产环境中，请始终使用 HTTPS 协议。

:::

可以使用受信任的第三方 CA 签名的证书，也可以使用自签名证书。有关如何创建 CA，以及如何使用 CA 签署服务器证书和客户端证书的信息，请参阅官方社区文档。

中文社区文档：[配置 Harbor 的 HTTPS 访问](https://goharbor.cn/docs/2.13.0/install-config/configure-https/)

英文官方文档：[Configure HTTPS Access to Harbor](https://goharbor.io/docs/2.13.0/install-config/configure-https/)



本文使用 [**Let's Encrypt**](https://letsencrypt.org/zh-cn/) 签发的 SSL 证书。

```bash
Certificate Path: /etc/letsencrypt/live/mirrors.ink/fullchain.pem
Private Key Path: /etc/letsencrypt/live/mirrors.ink/privkey.pem
```



## 4. 配置 Harbor YML文件

可以在安装程序包中包含的 `harbor.yml` 文件中设置 Harbor 的系统级参数。当运行 `install.sh` 脚本来安装或重新配置 Harbor 时，这些参数会生效。

默认情况下，所有必需参数在 `harbor.yml` 文件中都是未注释的。可选参数用 `#` 注释。不一定需要更改提供的默认必需参数值，但这些参数必须保持未注释状态。至少，必须更新 `hostname` 参数。

```bash
cd harbor
cp harbor.yml.tmpl harbor.yml

DATA_VOLUME="/data/harbor"
CERTIFICATE_PATH="/etc/letsencrypt/live/mirrors.ink/fullchain.pem"
PRIVATEKEY_PATH="/etc/letsencrypt/live/mirrors.ink/privkey.pem"

sed -i "s/hostname: reg.mydomain.com/hostname: reg.mirrors.ink/g" harbor.yml
# sed -i "s/port: 80/port: 8087/g" harbor.yml
# sed -i "s/port: 443/port: 8443/g" harbor.yml
sed -i "s#certificate:.*#certificate: ${CERTIFICATE_PATH}#g" harbor.yml
sed -i "s#private_key:.*#private_key: ${PRIVATEKEY_PATH}#g" harbor.yml
sed -i "s/^# external_url: .*/external_url: https:\/\/reg.mirrors.ink/g" harbor.yml
sed -i "s#data_volume: .*#data_volume: ${DATA_VOLUME}#g" harbor.yml
```

- DATA_VOLUME：用于存储 Harbor 数据的目标主机位置。
- CERTIFICATE_PATH：SSL 证书的路径。
- PRIVATEKEY_PATH：SSL 密钥的路径。



## 5. 运行安装脚本

在配置了从 `harbor.yml.tmpl` 复制的 `harbor.yml` 文件，并可选地设置了存储后端之后，可以使用 `install.sh` 脚本安装和启动 Harbor。请注意，在线安装程序可能需要一些时间才能从 Docker hub 下载所有 Harbor 镜像。

可以以不同的配置安装 Harbor

- 仅 Harbor，不包含 Trivy
- 包含 Trivy 的 Harbor

### 不包含 Trivy 的默认安装

默认的 Harbor 安装不包含 Trivy 服务。运行以下命令

```bash
sudo ./install.sh
```

### 包含 Trivy 的安装

要安装包含 Trivy 服务的 Harbor，请在运行 `install.sh` 时添加 `--with-trivy` 参数

```bash
sudo ./install.sh --with-trivy
```

如果安装成功，可以打开浏览器访问 Harbor 界面，地址为 `http://reg.yourdomain.com`，将 `reg.yourdomain.com` 更改为在 `harbor.yml` 中配置的主机名。如果没有在 `harbor.yml` 中更改它们，默认的管理员用户名和密码是 `admin` 和 `Harbor12345`。

登录到管理门户并创建一个新项目，例如 `myproject`。然后，可以使用 Docker 命令登录到 Harbor，标记镜像，并将它们推送到 Harbor。

```bash
docker login reg.yourdomain.com
docker push reg.yourdomain.com/myproject/myrepo:mytag
```



## 6. 实现 Proxy Cache 镜像代理

Proxy cache 允许使用 Harbor 代理并缓存来自目标公共或私有镜像仓库的镜像。

在互联网访问受限或无法访问的环境中，可以使用代理缓存从目标 Harbor 或非 Harbor 镜像仓库拉取镜像。还可以使用代理缓存来限制向公共镜像仓库发出的请求数量，避免消耗过多带宽或被镜像仓库服务器限速。



### 创建代理缓存项目

使用 Harbor 系统管理员通过 API 的方式创建代理缓存项目。

```python :collapsed-lines
import requests

BASE_URL = 'https://reg.yourdomain.com/api/v2.0' # 需替换为自己的 Harbor 地址
AUTH = ('admin', 'Harbor12345')
HEADERS = {
    'accept': 'application/json',
    'content-type': 'application/json',
}

REGISTRIES = [
    {'name': 'Docker', 'type': 'docker-hub',      'url': 'https://hub.docker.com'},
    {'name': 'GHCR',   'type': 'github-ghcr',     'url': 'https://ghcr.io'},
    {'name': 'K8S',    'type': 'docker-registry', 'url': 'https://registry.k8s.io'},
    {'name': 'QUAY',   'type': 'docker-registry', 'url': 'https://quay.io'},
]

PROJECTS = [
    {'project_name': 'docker', 'registry_name': 'Docker'},
    {'project_name': 'ghcr',   'registry_name': 'GHCR'},
    {'project_name': 'k8s',    'registry_name': 'K8S'},
    {'project_name': 'quay',   'registry_name': 'QUAY'},
]


def create_registries():
    for registry in REGISTRIES:
        data = {'insecure': False, **registry}
        resp = requests.post(f'{BASE_URL}/registries', headers=HEADERS, json=data, auth=AUTH)

def get_registry_map():
    names = ' '.join(r['name'] for r in REGISTRIES)
    resp = requests.get(f'{BASE_URL}/registries', params={'q': f'name={{{names}}}'}, headers=HEADERS, auth=AUTH)
    resp.raise_for_status()
    return {r['name']: r['id'] for r in resp.json()}


def create_projects(registry_map):
    for project in PROJECTS:
        name = project['registry_name']
        payload = {
            'project_name': project['project_name'],
            'metadata': {
                'public': 'true',
                'proxy_speed_kb': '-1',
                'max_upstream_conn': '-1',
            },
            'storage_limit': -1,
            'registry_id': registry_map[name],
        }
        resp = requests.post(f'{BASE_URL}/projects', headers=HEADERS, json=payload, auth=AUTH)

if __name__ == '__main__':
    create_registries()
    registry_map = get_registry_map()
    create_projects(registry_map)
```

开始使用代理缓存，配置 Docker 拉取命令或 Pod 清单，通过`<harbor_servername>/<proxy_project_name>/`在镜像标签前添加 `<proxycache-project>` 作为前缀来引用代理缓存项目。例如：

```bash
docker pull <harbor_server_name>/<proxy_project_name>/goharbor/harbor-core:dev
```



### Nginx 实现透明代理

::: tip 说明

Docker 和 Containerd 在配置镜像仓库（registry mirror）时，仅支持以**域名**作为仓库地址，不支持带路径前缀的形式（如 `reg.yourdomain.com/docker/`）。因此，可以借助 Nginx 为每个代理缓存项目单独绑定一个域名，将路径前缀转换为子域名的形式，使其与 Docker、Containerd 的配置方式兼容。

:::

**整体架构流量**：

```
Client
  │
  ▼
[Nginx]  docker.yourdomain.com ──┐
         ghcr.yourdomain.com   ──┤──► [Harbor]  /v2/<project>/...  ──► 上游仓库
         k8s.yourdomain.com    ──┤              (代理缓存项目)
         quay.yourdomain.com   ──┘
```



**创建 Nginx 配置文件**：

1. 域名到项目的映射

首先通过 `map` 指令，将不同的子域名映射到对应的 Harbor 代理缓存项目名称

```nginx
map $host $project {
    default               "";
    docker.yourdomain.com docker;
    k8s.yourdomain.com    k8s;
    quay.yourdomain.com   quay;
    ghcr.yourdomain.com   ghcr;
}
```

2. 基础 SSL 配置

```nginx
server {
    listen 443 ssl;
    server_name docker.yourdomain.com
                ghcr.yourdomain.com
                k8s.yourdomain.com
                quay.yourdomain.com;
    http2 on;

    ssl_certificate     /etc/letsencrypt/live/mirrors.ink/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mirrors.ink/privkey.pem;

    ssl_session_cache    shared:SSL:1m;
    ssl_session_timeout  5m;

    ssl_ciphers  HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers  on;

    access_log   /var/log/nginx/registry.access.log  main;

    # disable any limits to avoid HTTP 413 for large image uploads
    client_max_body_size 0;

    # required to avoid HTTP 411: see Issue #1486 (https://github.com/docker/docker/issues/1486)
    chunked_transfer_encoding on;
}
```

3. `/v2/` 入口处理

Docker 和 Containerd 在与镜像仓库交互时，会首先请求 `/v2/` 来检测仓库是否支持 v2 API，并从响应头的 `WWW-Authenticate` 字段中获取 Token 认证地址。

这里需要将请求转发给 Harbor，改写响应头中的 `WWW-Authenticate`，将 Token 认证地址替换为当前子域名，使客户端后续的认证请求也经过 Nginx。

```nginx
location = /v2/ {
    proxy_pass https://reg.yourdomain.com/v2/;
    proxy_set_header Host reg.yourdomain.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_hide_header WWW-Authenticate;
    add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header Content-Security-Policy "frame-ancestors 'none'" always;
    add_header WWW-Authenticate "Bearer realm=\"https://$host/service/token\",service=\"harbor-registry\"" always;
}
```

4. 镜像路径改写

客户端请求 `/v2/<image>/<path>` 时，Nginx 在转发给 Harbor 之前，在路径中插入对应的项目名称，将其改写为 `/v2/<project>/<image>/<path>`。

若当前 `$host` 未在 `map` 中匹配到项目，则直接返回 404。

```nginx
location ~ ^/v2/(.+)$ {
    if ($project = "") {
        return 404;
    }

    proxy_pass https://reg.yourdomain.com/v2/$project/$1;
    proxy_set_header Host reg.yourdomain.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_send_timeout 900;
    proxy_read_timeout 900;
    proxy_hide_header WWW-Authenticate;
    add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header Content-Security-Policy "frame-ancestors 'none'" always;
    add_header WWW-Authenticate "Bearer realm=\"https://$host/service/token\",service=\"harbor-registry\"" always;
}
```

5. Token 认证改写

Harbor 的 Token 认证请求中，`scope` 参数携带了客户端请求的镜像路径，格式为：

```
scope=repository%3A<image>%3Apull
```

由于客户端并不知道 Harbor 内部的项目结构，`scope` 中不包含项目名称。因此需要在转发前将 `scope` 改写为：

```
scope=repository%3A<project>%2F<image>%3Apull
```

```nginx
location = /service/token {
    set $new_args $args;

    if ($args ~ "^(.*)scope=repository%3A(.*)$") {
        set $new_args "$1scope=repository%3A${project}%2F$2";
    }

    proxy_pass https://reg.yourdomain.com/service/token?$new_args;
    proxy_set_header Host reg.yourdomain.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_request_buffering off;
}
```



附完整配置参考（代码框已折叠）：

```nginx :collapsed-lines
map $host $project {
    default               "";
    docker.yourdomain.com docker;
    k8s.yourdomain.com    k8s;
    quay.yourdomain.com   quay;
    ghcr.yourdomain.com   ghcr;
}

server {
    listen 443 ssl;
    server_name docker.yourdomain.com
                ghcr.yourdomain.com
                k8s.yourdomain.com
                quay.yourdomain.com;
    http2 on;

    ssl_certificate     /etc/letsencrypt/live/mirrors.ink/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mirrors.ink/privkey.pem;

    ssl_session_cache    shared:SSL:1m;
    ssl_session_timeout  5m;

    ssl_ciphers  HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers  on;

    access_log   /var/log/nginx/registry.access.log  main;

    # disable any limits to avoid HTTP 413 for large image uploads
    client_max_body_size 0;

    # required to avoid HTTP 411: see Issue #1486 (https://github.com/docker/docker/issues/1486)
    chunked_transfer_encoding on;

    location = /v2/ {
        proxy_pass https://reg.yourdomain.com/v2/;
        proxy_set_header Host reg.yourdomain.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_hide_header WWW-Authenticate;
        add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload" always;
        add_header X-Frame-Options DENY always;
        add_header Content-Security-Policy "frame-ancestors 'none'" always;
        add_header WWW-Authenticate "Bearer realm=\"https://$host/service/token\",service=\"harbor-registry\"" always;
    }

    location ~ ^/v2/(.+)$ {
        if ($project = "") {
            return 404;
        }

        proxy_pass https://reg.yourdomain.com/v2/$project/$1;
        proxy_set_header Host reg.yourdomain.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_send_timeout 900;
        proxy_read_timeout 900;
        proxy_hide_header WWW-Authenticate;
        add_header Strict-Transport-Security "max-age=31536000; includeSubdomains; preload" always;
        add_header X-Frame-Options DENY always;
        add_header Content-Security-Policy "frame-ancestors 'none'" always;
        add_header WWW-Authenticate "Bearer realm=\"https://$host/service/token\",service=\"harbor-registry\"" always;
    }

    location = /service/token {
        set $new_args $args;

        if ($args ~ "^(.*)scope=repository%3A(.*)$") {
            set $new_args "$1scope=repository%3A${project}%2F$2";
        }

        proxy_pass https://reg.yourdomain.com/service/token?$new_args;
        proxy_set_header Host reg.yourdomain.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

通过以上配置，实现了将 `reg.yourdomain.com/<projects>` 灵活拆分为 `<projects>.yourdomain.com`，并结合 Nginx 的参数解析与重写能力，完成了多上游仓库的统一代理与转发。同时兼容 Docker、Containerd 等客户端的标准访问方式，实现了对不同镜像源的透明加速与隔离，在保证使用习惯不变的前提下，大幅提升了镜像拉取的灵活性与可维护性。

整体上兼顾了易用性与扩展性，为构建统一的企业级镜像加速与代理体系提供了一种简洁而高效的实现思路。
