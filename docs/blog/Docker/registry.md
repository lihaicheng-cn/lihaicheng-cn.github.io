---
title: 通过 registry:2 加速国外镜像源
createTime: 2023/11/28 12:06:25
permalink: /article/docker/registry/
tags:
- Containerd
- Docker
- Kubernetes
- Registry
---




registry 镜像仓库：https://hub.docker.com/_/registry

distribution 官网：https://distribution.github.io/distribution/



因为一些原因，在国内访问 `registry.k8s.io`、`quay.io` 等镜像源非常困难，所以当有一台中国大陆以外的服务器时，可以利用 registry 注册表作为拉取缓存。



> 官网文档：https://distribution.github.io/distribution/recipes/mirror/
>
> **Solution**
>
> The Registry can be configured as a pull through cache. In this mode a Registry responds to all normal docker pull requests but stores all content locally.



## 一、环境准备

开始之前需要准备的一些必需品

- [x] 一台可以公网访问的服务器（服务器需要具备访问 registry.k8s.io 的能力）
- [x] （可选）一个可以访问的二级域名



## 二、搭建服务

### 1. 功能实现

首先利用 docker 进行基本功能实现，后续优化。



#### a. 拉取 registry 镜像

使用 `docker pull` 拉取 registry:2 镜像

```bash
docker pull registry:2
```



#### b. 创建 registry 容器

使用 `docker run` 创建容器，映射 5000 端口，名称为 registry，使用镜像 registry:2

```bash
docker run -d -p 5000:5000 --name registry registry:2 -e REGISTRY_PROXY_REMOTEURL="https://registry.k8s.io"
# 通过 -e 参数设置变量 REGISTRY_PROXY_REMOTEURL，将 registry.k8s.io 作为缓存服务的上游
```

还可以通过设置配置文件实现：

```yaml
proxy:
  remoteurl: https://registry-1.docker.io
  username: [username]
  password: [password]
  ttl: 168h
# Docker 地址为 https://registry-1.docker.io, 按需配置。
# K8s: 
# Quay:
```



#### c. 验证服务的可用性

此时可以跳转到 [第三节](#三、配置客户端) 配置客户端并且在确保网络连通性正常后进行验证。

验证完成后，查看 registry 容器官网，无法镜像另外一个域。所以当需要同时代理缓存 `docker.io`、`quay.io` 时，就需要修改映射的端口和上游地址，启动新容器，对加速镜像分别进行缓存。



## 三、配置客户端

### 1. 配置 Docker 镜像加速

针对 Linux 系统的配置方法。docker 仅支持对 docker.io 进行加速。

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://[镜像加速地址]"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

如果 registry 加速地址配置了身份认证：

（1）通过 `docker login <PROXY.DOMAIN.COM>` 命令登录，登录成功之后，会在对应的 $HOME 目录下生成 `.docker/config.json` 配置文件

（2）修改配置文件，在 `auths` 配置块中添加官方地址 `https://index.docker.io/v1/`，`auth` 哈希值与代理镜像地址的 `auth`  一致，重启 Docker 服务，即可直接通过 `docker pull` 拉取镜像。

```json
{
        "auths": {
                "https://index.docker.io/v1/": {
                        "auth": "<BASE64[USER:PASSWORD]>"
                },
                "PROXY.DOMAIN.COM": {
                        "auth": "<BASE64[USER:PASSWORD]>"
                }
        }
}
```



### 2. 配置 Containerd 镜像加速

#### a. 指定配置目录

参考文档：https://github.com/containerd/containerd/blob/main/docs/hosts.md

```bash
sed 's#config_path.*#config_path = "/etc/containerd/conf.d"#g' /etc/containerd/config.toml -i

# 配置 registry.k8s.io、quay.io 同理
mkdir /etc/containerd/conf.d/docker.io -p
cat > /etc/containerd/conf.d/docker.io/hosts.toml << EOF
server = "https://docker.io"
[host."https://[镜像加速地址]"]
    capabilities = ["pull", "resolve"]
EOF

systemctl restart containerd.service
```

修改配置文件后，需要重启 containerd 服务。

#### b. 配置基本身份验证

当开启了身份验证后，还需要针对客户端进行一些必要的配置。

**修改配置文件**：

参考文档：https://github.com/containerd/containerd/blob/main/docs/cri/registry.md

```
version = 2
[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.configs]
    [plugins."io.containerd.grpc.v1.cri".registry.configs."gcr.io".auth]
      username = "_json_key"
      password = 'paste output from jq'
```

重启 containerd 服务

```bash
systemctl restart containerd.service
```

**使用命令行方式进行验证**：

```bash
# 使用 crictl 拉取镜像
crictl pull --auth AUTH_STRING registry.k8s.io/pause:3.6
crictl pull --creds USERNAME[:PASSWORD] registry.k8s.io/pause:3.6

# 使用 ctr 拉取镜像
ctr images pull --user USERNAME[:PASSWORD] --hosts-dir /etc/containerd/certs.d/ registry.k8s.io/pause:3.6
```



以上验证完成后，就可以轻松获取镜像了。
