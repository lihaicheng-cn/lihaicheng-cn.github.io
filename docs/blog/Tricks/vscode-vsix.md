---
title: 解决 VSCode 扩展商店无 vsix 扩展下载按钮
createTime: 2025-03-19 11:16:13
permalink: /article/tricks/vscode-vsix/
tags:
- VSCode
---


VSCode 扩展市场：https://marketplace.visualstudio.com/

从 2025 年开始，访问 VSCode 扩展市场的扩展时，已经没有 vsix 扩展的下载按钮，官方扩展市场已经不提供下载离线包的方式了，实际上只是屏蔽了下载按钮，现在通过下载链接拼接的方式，仍然可以下载。

```javascript
const targetPlatform = 'linux-x64';
const baseUrl = 'https://marketplace.visualstudio.com/_apis/public/gallery';

const identifierElement = document.querySelector('#unique-identifier');
const versionElement = document.querySelector('#version');

const identifier = identifierElement.nextElementSibling.innerText.split('.');
const version = versionElement.nextElementSibling.innerText;

const publisherId = identifier[0];
const extensionId = identifier[1];
const path = `publishers/${publisherId}/vsextensions/${extensionId}/${version}`;
const queryParams = `targetPlatform=${targetPlatform}`;
const vsixUrl = `${baseUrl}/${path}/vspackage?${queryParams}`;

console.log('VSIX 下载地址:', vsixUrl);
```

将以上代码通过 F12 打开控制台，输入即可获取下载链接。

如果想要将下载按钮显示到页面当中，可以继续输入以下内容：

```javascript
['win32-x64', 'linux-x64', 'darwin-x64', 'web'].forEach(platform => document.querySelector('.ux-section-resources ul').insertAdjacentHTML('beforeend', `<li><a href="${baseUrl}/${path}/vspackage?targetPlatform=${platform}">下载 (${platform})</a></li>`));
```



参考：[知乎：2025 年 VSCode 插件离线下载攻略：官方渠道一键获取](https://zhuanlan.zhihu.com/p/26003070992)
