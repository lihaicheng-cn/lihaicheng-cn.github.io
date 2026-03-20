---
title: 在 Ubuntu 中安全的缩小根分区（使用 initramfs）
createTime: 2025/05/09 17:40:54
excerpt: 利用 Ubuntu/Debian 的 initramfs 引导机制，在系统启动阶段、根分区挂载之前执行 `e2fsck` 和 `resize2fs`，实现根分区的安全缩容操作。
permalink: /article/linux/resize-ext4-root-initramfs/
tags:
- Ubuntu
- initramfs
---



本文介绍一种利用 Ubuntu/Debian 的 initramfs 引导机制，在系统启动阶段、根分区挂载之前执行 `e2fsck` 和 `resize2fs`，实现根分区的安全缩容操作。



Github 仓库地址：[https://github.com/szepeviktor/debian-server-tools](https://github.com/szepeviktor/debian-server-tools)

附详细脚本内容（代码框已折叠）：

```sh :collapsed-lines=11
#!/bin/bash
#
# Resize root filesystem during boot.
#
# VERSION       :1.0.1
# DATE          :2018-04-01
# URL           :https://github.com/szepeviktor/debian-server-tools
# AUTHOR        :Viktor Szépe <viktor@szepe.net>
# LICENSE       :The MIT License (MIT)
# BASH-VERSION  :4.2+
# ALTERNATIVE   :http://www.ivarch.com/blogs/oss/2007/01/resize-a-live-root-fs-a-howto.shtml

# Check current filesystem type
ROOT_FS_TYPE="$(sed -n -e 's|^/dev/\S\+ / \(ext4\) .*$|\1|p' /proc/mounts)"
test "$ROOT_FS_TYPE" == ext4 || exit 100

# Copy e2fsck and resize2fs to initrd
cat > /etc/initramfs-tools/hooks/resize2fs <<"EOF"
#!/bin/sh

PREREQ=""

prereqs() {
    echo "$PREREQ"
}

case "$1" in
    prereqs)
        prereqs
        exit 0
        ;;
esac

. /usr/share/initramfs-tools/hook-functions
copy_exec /sbin/findfs /sbin
copy_exec /sbin/e2fsck /sbin
copy_exec /sbin/resize2fs /sbin
EOF

chmod +x /etc/initramfs-tools/hooks/resize2fs

# Execute resize2fs before mounting root filesystem
cat > /etc/initramfs-tools/scripts/init-premount/resize <<"EOF"
#!/bin/sh

PREREQ=""

prereqs() {
    echo "$PREREQ"
}

case "$1" in
    prereqs)
        prereqs
        exit 0
        ;;
esac

# New size of root filesystem
ROOT_SIZE="20G"

# Convert root from possible UUID to device name
echo "root=${ROOT}  "
ROOT_DEVICE="$(/sbin/findfs "$ROOT")"
echo "root device name is ${ROOT_DEVICE}  "
# Make sure LVM volumes are activated
if [ -x /sbin/vgchange ]; then
    /sbin/vgchange -a y || echo "vgchange: $?  "
fi
# Check root filesystem
/sbin/e2fsck -y -v -f "$ROOT_DEVICE" || echo "e2fsck: $?  "
# Resize
# debug-flag 8 means debug moving the inode table
/sbin/resize2fs -d 8 "$ROOT_DEVICE" "$ROOT_SIZE" || echo "resize2fs: $?  "
EOF

chmod +x /etc/initramfs-tools/scripts/init-premount/resize

# Regenerate initrd
update-initramfs -v -u

# Remove files
rm -f /etc/initramfs-tools/hooks/resize2fs /etc/initramfs-tools/scripts/init-premount/resize

reboot

# List files in initrd
# lsinitramfs /boot/initrd.img-*-amd64

# Remove files from initrd after reboot
# update-initramfs -u
```



::: caution

- 不要在运行系统中直接执行 `resize2fs` 缩小操作！
- 文件系统损坏风险极大，务必提前备份。
- 如果目标大小设置过小，resize2fs 会失败，系统可能无法启动。
- `resize2fs` 缩小前一定会先跑 `e2fsck`，否则操作不会被执行。

:::



## 1. 背景介绍

**问题起源**：在 Linux 中扩大根分区非常容易，但是缩小根分区却非常困难，因为无法在挂载状态下缩小文件系统。通常需要 LiveCD、另外一台机器或者 chroot 环境，非常不方便。

**使用场景**：

- 镜像制作时想要压缩根分区大小。
- 克隆系统后想调整磁盘空间「腾出来」或「归还」。



## 2. 原理简介

- 使用 initramfs 的机制，在挂载根分区 **之前** 执行 `resize2fs`。
- 利用了 initramfs 的两个关键机制：

  - `hooks`：将 `resize2fs`、`e2fsck` 等工具打包进 initrd。
  - `init-premount`：在真正挂载 `/` 之前执行缩容逻辑。



## 3. 操作步骤详解

下面分步解释一下缩容操作系统根分区的流程。

::: tip

首先检查当前的文件系统类型，只支持 ext4，xfs、btrfs 不适用。

:::

### 检查文件系统是否使用 ext4

```sh
# Check current filesystem type
ROOT_FS_TYPE="$(sed -n -e 's|^/dev/\S\+ / \(ext4\) .*$|\1|p' /proc/mounts)"
test "$ROOT_FS_TYPE" == ext4 || exit 100
```

::: note

检查当前的文件系统类型是否使用 ext4，否则将退出，状态码为 100。

:::



### 创建 initramfs 的 `hook` 文件

```sh
# Copy e2fsck and resize2fs to initrd
cat > /etc/initramfs-tools/hooks/resize2fs <<"EOF"
#!/bin/sh

PREREQ=""

prereqs() {
    echo "$PREREQ"
}

case "$1" in
    prereqs)
        prereqs
        exit 0
        ;;
esac

. /usr/share/initramfs-tools/hook-functions
copy_exec /sbin/findfs /sbin
copy_exec /sbin/e2fsck /sbin
copy_exec /sbin/resize2fs /sbin
EOF

chmod +x /etc/initramfs-tools/hooks/resize2fs
```

- 解释：将 `findfs`、`e2fsck`、`resize2fs` 打包到 initrd 中。
- 注意点：`/etc/initramfs-tools/hooks/resize2fs` 需要有执行权限。



### 创建 `init-premount` 脚本（执行 resize）

```sh
# Execute resize2fs before mounting root filesystem
cat > /etc/initramfs-tools/scripts/init-premount/resize <<"EOF"
#!/bin/sh

PREREQ=""

prereqs() {
    echo "$PREREQ"
}

case "$1" in
    prereqs)
        prereqs
        exit 0
        ;;
esac

# New size of root filesystem
ROOT_SIZE="20G"

# Convert root from possible UUID to device name
echo "root=${ROOT}  "
ROOT_DEVICE="$(/sbin/findfs "$ROOT")"
echo "root device name is ${ROOT_DEVICE}  "
# Make sure LVM volumes are activated
if [ -x /sbin/vgchange ]; then
    /sbin/vgchange -a y || echo "vgchange: $?  "
fi
# Check root filesystem
/sbin/e2fsck -y -v -f "$ROOT_DEVICE" || echo "e2fsck: $?  "
# Resize
# debug-flag 8 means debug moving the inode table
/sbin/resize2fs -d 8 "$ROOT_DEVICE" "$ROOT_SIZE" || echo "resize2fs: $?  "
EOF

chmod +x /etc/initramfs-tools/scripts/init-premount/resize
```

- 设置需要缩容的目标大小（`ROOT_SIZE="20G"`）。

- 自动查找根设备（无论是 `/dev/sda1` 还是 UUID）。
- 执行 `e2fsck` 和 `resize2fs`。



### 重新生成 initrd 并重启

```sh
# Regenerate initrd
update-initramfs -v -u

reboot
```

重启让新的 initrd 生效，并在下一次启动时触发 resize 操作。



### 从 initrd 中删除清理文件

```sh
# Remove files
rm -f /etc/initramfs-tools/hooks/resize2fs /etc/initramfs-tools/scripts/init-premount/resize

# List files in initrd
# lsinitramfs /boot/initrd.img-*-amd64

# Remove files from initrd after reboot
update-initramfs -u
```

重启后，需要执行一次 `update-initramfs -u` 命令，清理 `hooks` 和 `init-premount` 文件，防止重复 resize。

此时，可以执行 `df -Th` 命令，查看根分区是否缩容成功。

