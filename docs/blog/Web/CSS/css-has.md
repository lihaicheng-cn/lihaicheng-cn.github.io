---
title: CSS :has() - 从选择子元素到选择父元素
createTime: 2025/05/22 14:14:30
permalink: /article/web/css/css-has/
excerpt: CSS 函数式伪类 :has() 表示一个元素，如果作为参数传递的任何相对选择器在锚定到该元素时，至少匹配一个元素。这个伪类通过把可容错相对选择器列表作为参数，提供了一种针对引用元素选择父元素或者先前的兄弟元素的方法。
tags:
- CSS
---



MDN 文档：[https://developer.mozilla.org/en-US/docs/Web/CSS/:has](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)

CSS 函数式伪类 :has() 表示一个元素，如果作为参数传递的任何相对选择器在锚定到该元素时，至少匹配一个元素。这个伪类通过把可容错相对选择器列表作为参数，提供了一种针对引用元素选择父元素或者先前的兄弟元素的方法。



```css
/* Selects an h1 heading with a
paragraph element that immediately follows
the h1 and applies the style to h1 */
h1:has(+ p) {
  margin-bottom: 0;
}
```

`:has()` 伪类的[优先级](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_cascade/Specificity)计算方法与 [`:is()`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:is) 和 [`:not()`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:not) 相同：以其参数中具体的选择器进行计算。



## 语法

```css
:has(<relative-selector-list>) {
  /* ... */
}
```

相对选择器列表参数是[可容错](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Selector_list#可容错选择器列表)的。通常在 CSS 中，选择器列表中的某个选择器无效时，那么整个列表则被视为无效。当 `:has()` 选择器列表中的一个选择器无法解析时，不正确或不受支持的选择器将被忽略，而其他的则将被正常使用。

注意，如果一个浏览器中不支持 `:has()` 伪类本身，则整个选择器块将失效（除非 `:has()` 本身位于一个可容错选择器列表中，比如在 [`:is()`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:is) 或 [`:where()`](https://developer.mozilla.org/zh-CN/docs/Web/CSS/:where) 中）。

`:has()` 伪类不能被嵌套在另一个 `:has()` 内。另外，伪元素不是 `:has()` 内的有效选择器。这是因为许多伪元素基于其祖先的样式有条件地存在，如果允许通过 `:has()` 查询这些伪元素可能导致循环查询。虽然 `:has()` 和伪元素在 `:has()` 中是无效的选择器，但由于选择器列表是可容错的，它们将只是被忽略。选择器将不会失效。



## 示例一：选择先前兄弟元素

### HTML

```html
<section>
  <article>
    <h1>Morning Times</h1>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </p>
  </article>
  <article>
    <h1>Morning Times</h1>
    <h2>Delivering you news every morning</h2>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </p>
  </article>
</section>
```

### CSS

```css
h1,
h2 {
  margin: 0 0 1rem 0;
}

h1:has(+ h2) {
  margin: 0 0 0.25rem 0;
  background-color: pink;
}
```

### 结果

:::: demo

::: code-tabs
@tab HTML

```html
<section>
  <article>
    <h1>Morning Times</h1>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </p>
  </article>
  <article>
    <h1>Morning Times</h1>
    <h2>Delivering you news every morning</h2>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </p>
  </article>
</section>
```

@tab CSS

```css
h1,
h2 {
  margin: 0 0 1rem 0;
}

h1:has(+ h2) {
  margin: 0 0 0.25rem 0;
  background-color: pink;
}
```

:::
::::

## 示例二：选择父元素

### HTML

```html
<ul>
  <li>
    <label>
      <input type="checkbox" checked>
      已选择的项目
  </li>
  <li>
    <label>
      <input type="checkbox">
      未选择的项目
    </label>
  </li>
</ul>
```



### CSS

```css
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
li:has(> label input:checked) {
  background-color: pink;
}
```



### 结果

:::: demo

::: code-tabs
@tab HTML

```html
<ul>
  <li>
    <label>
      <input type="checkbox" checked>
      已选择的项目
  </li>
  <li>
    <label>
      <input type="checkbox">
      未选择的项目
    </label>
  </li>
</ul>
```

@tab CSS

```css
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
li:has(> label input:checked) {
  background-color: pink;
}
```

:::
::::

## Can I Use

自 2023 年 12 月起，此功能可在最新设备和浏览器版本上运行。此功能可能无法在较旧的设备或浏览器中运行。

@[caniuse{-2,1}](css-has)
