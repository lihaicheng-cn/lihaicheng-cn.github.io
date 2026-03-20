---
title: 在 Bash 终端中为 Git 仓库目录添加提示信息
createTime: 2025/08/11 10:16:26
permalink: /article/tricks/git-prompt/
excerpt: 利用 Git 官方仓库的 contrib/completion/git-prompt.sh 脚本，在 Bash 终端中为 Git 仓库目录添加提示信息，优化终端体验。
tags:
- Bash
- Git
---



## 1. 下载 git-prompt.sh 脚本

Git 仓库地址：[https://github.com/git/git](https://github.com/git/git)

从 Git 官方仓库下载 `contrib/completion/git-prompt.sh` 脚本

```bash
wget https://raw.githubusercontent.com/git/git/refs/heads/master/contrib/completion/git-prompt.sh
# 或者
curl -O https://raw.githubusercontent.com/git/git/refs/heads/master/contrib/completion/git-prompt.sh
```

移动 `git-prompt.sh` 到 `/usr/local/share/git/` 目录

```bash
mkdir -p /usr/local/share/git/
mv ./git-prompt.sh /usr/local/share/git/
```



## 2. 运行 git-prompt.sh 脚本

```bash
source /usr/local/share/git/git-prompt.sh
PROMPT_COMMAND='__git_ps1 "\u@\h:\w" "\\\$ " "$(tput setaf 2)(%s)$(tput sgr0)"'
PROMPT_COMMAND='__git_ps1 "\u@\h:\w" "\\\$ " "\[\e[0;32m\](%s)\[\e[0m\]"'
```



将运行命令添加到 `~/.bashrc` 文件中

```bash 
cat <<'EOF' >>  ~/.bashrc
source /usr/local/share/git/git-prompt.sh
PROMPT_COMMAND='__git_ps1 "\u@\h:\w" "\\\$ " "$(tput setaf 2)(%s)$(tput sgr0)"'
PROMPT_COMMAND='__git_ps1 "\u@\h:\w" "\\\$ " "\[\e[0;32m\](%s)\[\e[0m\]"'
EOF
```



此时进入 Git 仓库目录即可在终端看到分支提示

```bash
root@localhost:/data/git-test(master)# git checkout -b dev
Switched to a new branch 'dev'
root@localhost:/data/git-test(dev)#
```

