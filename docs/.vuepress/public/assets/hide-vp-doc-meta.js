(function() {
  const hide = () => document.querySelectorAll('.vp-doc-meta .create-time span:last-child')
    .forEach(span => span.textContent.trim() === '0000-00-00' && 
      span.closest('.vp-doc-meta')?.style.setProperty('display', 'none'));
  hide();
  document.addEventListener('DOMContentLoaded', hide);
  new MutationObserver(hide).observe(document, {childList: true, subtree: true});
})();