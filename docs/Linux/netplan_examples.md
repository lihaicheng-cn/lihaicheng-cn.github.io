---
title: 基于官方仓库的 Netplan 配置示例指南
createTime: 2025/11/20 15:39:30
permalink: /article/linux/netplan-examples/
excerpt: 本文档包含常见的 Netplan 配置示例与解读：DHCP、Bonding（链路聚合）、静态 IP、自定义网关、Wi‑Fi 等 YAML 配置。
tags:
- Ubuntu
- Netplan
---

本文档包含常见的 Netplan 配置示例与解读：DHCP、Bonding（链路聚合）、静态 IP、自定义网关、Wi‑Fi 配置与常见问题排查命令。每个示例都有 YAML 配置、说明与验证步骤，可以拷贝到 `/etc/netplan/*.yaml` 并使用 `netplan apply` 生效。

官方仓库地址：[https://github.com/canonical/netplan/tree/main/examples](https://github.com/canonical/netplan/tree/main/examples)

## Netplan 简介

Netplan 是一个网络配置抽象渲染器。

Netplan 是一款用于在 Linux 系统上轻松配置网络的实用程序。只需要创建一个 YAML 描述，其中包含所需的网络接口以及每个接口的配置功能。Netplan 将根据此描述生成选择的渲染工具所需的所有配置。


## 写 YAML 的注意事项

YAML 官方规范：[YAML Ain't Markup Language™ version 1.2](https://yaml.org/spec/1.2.2/)

- 使用 2 或 4 个空格缩进，全文保持一致。
- 顶层必须是 `network:`，并包含 `version: 2`。
- `renderer:` 可选，常见值：`networkd`（服务器）、`NetworkManager`（桌面/Wi‑Fi）；如果同时配置 Wi‑Fi 并希望由 NetworkManager 管理，应设置 `renderer: NetworkManager`。
- 文件名以 `.yaml` 结尾并放在 `/etc/netplan/`，然后运行 `sudo netplan try` 或 `sudo netplan apply`。


## 使用 DHCP 和静态地址

要让名称为 “eth0” 的接口通过 DHCP 获取地址，请使用以下内容创建 YAML 文件：

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: true
      dhcp6: false
```

要改为设置静态 IP 地址，需要使用 addresses 关键字，addresses 接受一个 IPv4 或 IPv6 地址列表以及子网前缀长度（例如 /24）。还可以提供 DNS 信息，并且可以通过默认路由定义网关：

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      dhcp4: false
      addresses: [10.10.10.2/24]
      # gateway4: 10.10.10.1
      nameservers:
        search: [mydomain, otherdomain]
        addresses: [10.10.10.1, 1.1.1.1]
      routes:
        - to: default
          via: 10.10.10.1
```

- `addresses` 接受多地址列表，例如 `- 10.10.10.2/24` 和 `- 10.10.10.21/32`。

- 若有多条网关路由需求，可以使用 `routes` 定义多个网关。

高级路由示例：

```yaml
routes:
  - to: 0.0.0.0/0
    via: 10.10.10.1
    table: 254
    metric: 100
  - to: 192.168.0.0/16
    via: 10.10.10.254
    metric: 200
```

## 使用 DHCP 连接多个接口

现在很多系统都包含多个网络接口。服务器通常需要连接到多个网络，并且可能要求访问互联网的流量必须通过特定的接口，尽管所有这些接口都提供有效的网关。

可以通过为通过 DHCP 获取的路由指定度量值，来实现精确的路由期望，从而确保某些路由优先于其他路由。在本例中，'enred' 优先于 'engreen'，因为它具有更低的路由度量值：

```yaml
network:
  version: 2
  ethernets:
    enred:
      dhcp4: yes
      dhcp4-overrides:
        route-metric: 100
    engreen:
      dhcp4: yes
      dhcp4-overrides:
        route-metric: 200
```



## 连接到开放的无线网络

Netplan 可以轻松连接到开放式无线网络（即未设置密码保护的网络），只需要定义接入点即可：

```yaml
network:
  version: 2
  wifis:
    wlan0:
      access-points:
        opennetwork: {}
      dhcp4: yes
```

## 连接到 WPA 个人无线网络

无线设备使用 “wifis” 密钥，并与有线以太网设备共享相同的配置选项。还需要指定无线接入点名称和密码：

```yaml
network:
  version: 2
  renderer: networkd
  wifis:
    wlan0:
      dhcp4: no
      dhcp6: no
      addresses: [192.168.0.21/24]
      nameservers:
        addresses: [192.168.0.1, 8.8.8.8]
      access-points:
        "network_ssid_name":
            password: "**********"
      routes:
        - to: default
          via: 192.168.0.1
```

## 连接到 WPA 企业级无线网络

使用 WPA 或 WPA2 企业版进行加密的无线网络也很常见，这需要额外的身份验证参数。

例如，如果网络使用 WPA-EAP 和 TTLS 进行保护：

```yaml
network:
  version: 2
  wifis:
    wl0:
      access-points:
        workplace:
          auth:
            key-management: eap
            method: ttls
            anonymous-identity: "@internal.example.com"
            identity: "joe@internal.example.com"
            password: "v3ryS3kr1t"
        dhcp4: yes
```

或者，如果网络使用 WPA-EAP 和 TLS 进行保护：

```yaml
network:
  version: 2
  wifis:
    wl0:
      access-points:
        university:
          auth:
            key-management: eap
            method: tls
            anonymous-identity: "@cust.example.com"
            identity: "cert-joe@cust.example.com"
            ca-certificate: /etc/ssl/cust-cacrt.pem
            client-certificate: /etc/ssl/cust-crt.pem
            client-key: /etc/ssl/cust-key.pem
            client-key-password: "d3cryptPr1v4t3K3y"
      dhcp4: yes
```

Netplan支持多种不同的加密模式。请参阅 [Netplan 参考](https://netplan.io/reference) 页面。

## 在单个接口上使用多个地址

addresses 键可以接受一个地址列表，用于指定要分配给接口的地址：

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp3s0:
      addresses:
          - 10.100.1.37/24
          - 10.100.1.38/24:
              label: enp3s0:0
          - 10.100.1.39/24:
              label: enp3s0:some-label
      routes:
          - to: default
            via: 10.100.1.1
```

## 使用多个地址和多个网关

与上述示例类似，具有多个地址的接口可以配置多个网关。

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp3s0:
      addresses:
        - 10.0.0.10/24
        - 11.0.0.11/24
        routes:
        - to: default
          via: 10.0.0.1
          metric: 200
        - to: default
          via: 11.0.0.1
          metric: 300
```

## 使用 NetworkManager 作为渲染器

```yaml
network:
  version: 2
  renderer: NetworkManager
```

## 配置 Bond 接口

Bond 是配置声明一个 Bond 接口 (包括物理接口列表和绑定模式)。下面是一个使用 DHCP 获取地址的主备绑定示例：

```yaml
network:
  version: 2
  renderer: networkd
  bonds:
    bond0:
      dhcp4: yes
      interfaces:
        - enp3s0
        - enp4s0
      parameters:
        mode: active-backup
        primary: enp3s0
```

下面是一个 Bond（LACP 802.3ad）示例，交换机需要支持 LACP：

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0: {}
    eth1: {}
    bonds:
      bond0:
        dhcp4: false
        interfaces: [eth0, eth1]
        parameters:
          mode: 802.3ad
          mii-monitor-interval: 100
          lacp-rate: fast
          transmit-hash-policy: layer3+4
        addresses: [10.10.10.10/24]
        routes:
          - to: default
            via: 10.10.10.1
        nameservers:
          addresses: [10.0.0.53]
```

## 将 VLAN 附加到网络接口

要配置多个具有重命名接口的 VLAN：

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    mainif:
      match:
        macaddress: "de:ad:be:ef:ca:fe"
      set-name: mainif
      addresses: [ "10.3.0.5/23" ]
      nameservers:
        addresses: [ "8.8.8.8", "8.8.4.4" ]
        search: [ example.com ]
      routes:
        - to: default
          via: 10.3.0.1
  vlans:
    vlan15:
      id: 15
      link: mainif
      addresses: [ "10.3.99.5/24" ]
    vlan10:
      id: 10
      link: mainif
      addresses: [ "10.3.98.5/24" ]
      nameservers:
        addresses: [ "127.0.0.1" ]
        search: [domain1.example.com, domain2.example.com]
```

## 配置环回接口

Networkd 不允许创建新的环回设备，但用户可以向标准环回接口 lo 添加新地址，以便将其视为机器上的有效地址，并用于自定义路由：

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    lo:
      addresses: ["127.0.0.1/8", "::1/128", "7.7.7.7/32"]
```

## 与 Windows DHCP 服务器集成

对于由 Windows 服务器提供 DHCP 服务的网络，使用 dhcp-identifier 密钥可以实现互操作性：

```yaml
network:
  version: 2
  ethernets:
    enp3s0:
      dhcp4: yes
      dhcp-identifier: mac
```
