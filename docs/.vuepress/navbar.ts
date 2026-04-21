/**
 * @see https://theme-plume.vuejs.press/config/navigation/ 查看文档了解配置详情
 *
 * Navbar 配置文件，它在 `.vuepress/plume.config.ts` 中被导入。
 */

import { defineNavbarConfig } from 'vuepress-theme-plume'

export const zhNavbar = defineNavbarConfig([
  { text: '首页', icon: 'iconify carbon:home', link: '/' },
  { text: '博客', icon: 'iconify carbon:blog', link: '/blog/' },
  { text: '标签', icon: 'iconify carbon:tag', link: '/blog/tags/' },
  { text: '归档', icon: 'iconify carbon:archive', link: '/blog/archives/' },
  { text: '链接', icon: 'iconify carbon:link', link: '/friends/' },
  {
    text: '笔记',
    icon: 'iconify icon-park-outline:notes',
    items: [{ text: '示例', link: '/demo/README.md' }]
  },
])

export const enNavbar = defineNavbarConfig([
  { text: 'Home', icon: 'iconify carbon:home', link: '/en/' },
  { text: 'Blog', icon: 'iconify carbon:blog', link: '/en/blog/' },
  { text: 'Tags', icon: 'iconify carbon:tag', link: '/en/blog/tags/' },
  { text: 'Archives', icon: 'iconify carbon:archive', link: '/en/blog/archives/' },
  {
    text: 'Notes',
    icon: 'iconify icon-park-outline:notes',
    items: [{ text: 'Demo', link: '/en/demo/README.md' }]
  },
])

