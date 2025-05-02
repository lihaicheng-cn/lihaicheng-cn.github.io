---
title: 《星露谷物语》在 Windows 上安装 SMAPI
createTime: 2025/05/02 11:45:41
excerpt: 本文将介绍如何在 Windows 上安装《星露谷物语》的 mod 加载器 SMAPI。
permalink: /article/StardewValley/install/
tags:
- 'Stardew Valley'
- Mods
---



Stardew Valley WIKI：[在 Windows 上安装 SMAPI](https://stardewvalleywiki.com/Modding:Installing_SMAPI_on_Windows)

本文将介绍如何在 Windows 上安装《星露谷物语》的 mod 加载器 SMAPI。



## 1. 下载 SMAPI mod 加载器

[SMAPI](https://smapi.io/) ：The mod loader for Stardew Valley.

首先，需要下载最新版本的 SMAPI，浏览器访问 [SMAPI](https://smapi.io/) 官网，单击网站页面中的绿色下载按钮，会出现三种下载方式：

-  [Download from Nexus](https://www.nexusmods.com/stardewvalley/mods/2400)
-  [Download from CurseForge](https://www.curseforge.com/stardewvalley/utility/smapi)
-  [Download from GitHub](https://github.com/Pathoschild/SMAPI/releases/)

任意选择一种下载方式，这里推荐从 [Nexus](https://www.nexusmods.com/) (必须登录才能下载文件) 或者 [Github](https://github.com/) 上下载。

::: tip

文件下载格式：SMAPI-4.2.1-installer.zip，其中 4.2.1 为版本号，下载最新版本即可。

:::



## 2. 安装 SMAPI，使用脚本安装

下载完成后，在电脑中提取解压下载的文件并打开，文件目录格式如下：

::: file-tree icon="simple"

- SMAPI-4.2.1-installer
  - internal
    - linux
    - macOS
    - windows
  - **install on Linux.sh**
  - **install on macOS.command**
  - **install on Windows.bat**
  - README.txt

:::



运行对应操作系统脚本安装文件，安装 SMAPI。

这里以 Windows 操作系统为例，双击 `install on Windows.bat` 文件，然后按照屏幕上的说明进行操作：

```cmd
Hi there! I'll help you install or remove SMAPI. Just a few questions first.
Color scheme: auto-detect
----------------------------------------------------------------------------

Where do you want to add or remove SMAPI?

[1] D:\Steam\steamapps\common\Stardew Valley
[2] Enter a custom game path.

Type the number next to your choice, then press enter.
```

询问您想在哪里添加或删除 SMAPI？

[1] 为脚本自动检测的星露谷安装路径，如果正确，输入 `1` 然后按回车键即可。

[2] 如果 [1] 选项提示的路径不对，则可以手动输入自定义的游戏路径：

```cmd
Type the number next to your choice, then press enter.
2

Type the file path to the game directory (the one containing 'Stardew Valley.dll'), then press enter.
D:\Steam\steamapps\common\Stardew Valley # 自定义的游戏路径
```

输入包含 "Stardew Valley.dll" 的路径，然后按回车键。然后会提示：你想让安装脚本所做的操作？

```cmd
Hi there! I'll help you install or remove SMAPI. Just one question first.
Game path: D:\Steam\steamapps\common\Stardew Valley
Color scheme: auto-detect
----------------------------------------------------------------------------

What do you want to do?

[1] Install SMAPI.
[2] Uninstall SMAPI.

Type 1 or 2, then press enter.
```

这里输入 `1` , 然后按回车键，弹出以下内容：

```cmd
That's all I need! I'll install SMAPI now.
Game path: D:\Steam\steamapps\common\Stardew Valley
Color scheme: auto-detect
----------------------------------------------------------------------------

Removing previous SMAPI files...
Adding SMAPI files...
Adding bundled mods...
   adding Console Commands...
   adding Save Backup...


SMAPI is installed! If you use Steam, set your launch options to enable achievements (see smapi.io/install):
    "D:\Steam\steamapps\common\Stardew Valley\StardewModdingAPI.exe" %command%

If you don't use Steam, launch StardewModdingAPI.exe in your game folder to play with mods.
```



保持 SMAPI 安装程序窗口打开。**复制安装程序窗口中**如下所示的文本（[请参阅如何复制文本](https://community.playstarbound.com/threads/smapi-stardew-modding-api.108375/page-138#post-3292321)）：**确保复制整行，包括引号和部分内容。**

在 Steam 客户端中，右键单击 Stardew Valley 并选择 “属性”，单击启动选项下的文本框，将文本框中的所有内容替换为您从安装程序复制的文本。

::: tip

你需要输入自己的安装程序所弹出的文本。**"Your path here"** %command%

:::

从现在开始，只需通过 Steam 启动游戏即可使用 Steam 覆盖成就和运行 SMAPI。



## 3. 星露谷物语模组推荐

```txt
AutoGate（自动门）
https://www.nexusmods.com/stardewvalley/mods/820

Automate（自动化）
https://www.nexusmods.com/stardewvalley/mods/1063

Generic Mod Config Menu（通用模组配置菜单）
https://www.nexusmods.com/stardewvalley/mods/5098

Harvest With Scythe（用镰刀收割）前置模组：3213
https://www.nexusmods.com/stardewvalley/mods/2731

Horse Flute Anywhere（随处可见的马笛）
https://www.nexusmods.com/stardewvalley/mods/7500

Longer Days（更长的日子）
https://www.nexusmods.com/stardewvalley/mods/19027

Lookup Anything（查找一切）
https://www.nexusmods.com/stardewvalley/mods/541

NPC Map Locations（NPC 地图位置）
https://www.nexusmods.com/stardewvalley/mods/239

Passable Crops（可通行的农作物）
https://www.nexusmods.com/stardewvalley/mods/15223

Pony Weight Loss Program（小马减肥计划）
https://www.nexusmods.com/stardewvalley/mods/1232

Quick Glance（快速浏览）
https://www.nexusmods.com/stardewvalley/mods/12058

UIInfoSuite2（UI2）
https://github.com/Annosz/UIInfoSuite2/releases

Visible Fish（可见鱼）
https://www.nexusmods.com/stardewvalley/mods/8897

---
Zoom Level（缩放等级）
https://www.nexusmods.com/stardewvalley/mods/7363

```

后续计划单独出一篇文章介绍这些好用的模组。


