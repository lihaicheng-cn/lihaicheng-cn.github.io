<script setup lang="ts">
import { computed } from 'vue'
import { VPLink } from 'vuepress-theme-plume/client'
import { useRouteLocale, usePageFrontmatter } from 'vuepress/client'

interface Locale {
  sponsor: string
  comment: string
}

const locales: Record<string, Locale> = {
  '/': { sponsor: '喝杯咖啡', comment: '留言评论' },
  '/en/': { sponsor: 'Buy me a coffee', comment: 'Go to comment' },
}

const lang = useRouteLocale()
const locale = computed(() => locales[lang.value])
const frontmatter = usePageFrontmatter<{ comments?: boolean }>()
const showComments = computed(() => frontmatter.value.comments !== false)
</script>

<template>
  <div class="aside-nav-wrapper">
    <VPLink class="link" href="/sponsor/">
      <span class="vpi-coffee-half-empty-twotone-loop" />
      <span class="link-text">{{ locale.sponsor }}</span>
      <span class="vpi-arrow-right" />
    </VPLink>
    <a v-if="showComments" class="vp-link no-icon link" href="#comment">
      <span class="vpi-chat-round-dots" />
      <span class="link-text">{{ locale.comment }}</span>
      <span class="vpi-arrow-down" />
    </a>
  </div>
</template>

<style scoped>
.aside-nav-wrapper {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  margin: 16px 16px 0;
  border-top: solid 1px var(--vp-c-divider);
}

.aside-nav-wrapper .link {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: var(--vp-c-text-2);
  transition: color var(--vp-t-color);
}

.aside-nav-wrapper .link:hover {
  color: var(--vp-c-brand-1);
}

.aside-nav-wrapper .link .link-text {
  flex: 1 2;
  font-size: 12px;
}

.vpi-coffee-half-empty-twotone-loop {
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' fill-opacity='0.3' d='M17 14v4c0 1.66 -1.34 3 -3 3h-6c-1.66 0 -3 -1.34 -3 -3v-4Z'/%3E%3Cg fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'%3E%3Cpath d='M17 9v9c0 1.66 -1.34 3 -3 3h-6c-1.66 0 -3 -1.34 -3 -3v-9Z'/%3E%3Cpath d='M17 9h3c0.55 0 1 0.45 1 1v3c0 0.55 -0.45 1 -1 1h-3'/%3E%3Cmask id='lineMdCoffeeHalfEmptyTwotoneLoop0'%3E%3Cpath stroke='%23fff' d='M8 0c0 2-2 2-2 4s2 2 2 4-2 2-2 4 2 2 2 4M12 0c0 2-2 2-2 4s2 2 2 4-2 2-2 4 2 2 2 4M16 0c0 2-2 2-2 4s2 2 2 4-2 2-2 4 2 2 2 4'/%3E%3C/mask%3E%3Crect width='24' height='5' y='2' fill='%23000' mask='url(%23lineMdCoffeeHalfEmptyTwotoneLoop0)'/%3E%3C/g%3E%3C/svg%3E");
}

.vpi-chat-round-dots {
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M5 15.5c1 1 2.5 2 4 2.5c-2 2 -5 3 -7 3c2 -2 3 -3.5 3 -5.5Z'/%3E%3Cg fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'%3E%3Cpath d='M7 16.82c-2.41 -1.25 -4 -3.39 -4 -5.82c0 -3.87 4.03 -7 9 -7c4.97 0 9 3.13 9 7c0 3.87 -4.03 7 -9 7c-1.85 0 -3.57 -0.43 -5 -1.18Z'/%3E%3Cpath d='M8 11h0.01'/%3E%3Cpath d='M12 11h0.01'/%3E%3Cpath d='M16 11h0.01'/%3E%3C/g%3E%3C/svg%3E");
}
</style>