(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const $ = id => document.getElementById(id);
  const tabs = [...document.querySelectorAll('[data-method]')];
  const cache = new Map();
  let active = 'standard', command = '', controller, request = 0;
  const mobile = window.matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 1100px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const text = (id, value) => {
    $(id).textContent = value;
    if (id === 'command-status') $(id).classList.toggle('loading', value === 'Loading…');
  };
  function httpsUrl(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
    catch { return null; }
  }
  function repositoryIdentity() {
    // Standard GitHub Pages URLs encode the owner in the host and project in the path.
    const host = window.location.hostname.match(/^([a-z0-9-]+)\.github\.io$/i);
    let owner = '', project = '';
    if (host) {
      owner = host[1];
      const segment = window.location.pathname.split('/').filter(Boolean)[0];
      try { project = segment && !/^index\.html?$/i.test(segment) ? decodeURIComponent(segment) : `${owner}.github.io`; }
      catch { project = `${owner}.github.io`; }
    } else {
      const configuredUrl = httpsUrl(config.repositoryUrl);
      if (configuredUrl) {
        const url = new URL(configuredUrl);
        const parts = url.pathname.split('/').filter(Boolean);
        if (url.hostname === 'github.com' && parts.length >= 2) {
          owner = parts[0];
          project = parts[1].replace(/\.git$/i, '');
        }
      }
    }
    owner = typeof config.owner === 'string' && config.owner.trim() ? config.owner.trim() : owner;
    project = typeof config.project === 'string' && config.project.trim() ? config.project.trim() : project;
    const valid = /^[a-z0-9-]+$/i.test(owner) && /^[a-z0-9_.-]+$/i.test(project);
    return { owner, project, url: valid ? `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(project)}` : null };
  }
  const identity = repositoryIdentity();
  const content = { ...config, owner: identity.owner, project: identity.project };
  for (const key of ['brand', 'owner', 'project', 'description']) {
    if (typeof content[key] === 'string' && content[key].trim()) {
      document.querySelectorAll(`[data-${key}]`).forEach(el => { el.textContent = content[key]; });
    }
  }
  document.title = `Desktop setup · ${config.brand || 'Launchpad'}`;
  const repository = identity.url || httpsUrl(config.repositoryUrl);
  if (repository) document.querySelectorAll('.repository-link').forEach(link => { link.href = repository; link.hidden = false; });
  function updateCopy() { $('copy-command').disabled = !command || mobile.matches; }
  mobile.addEventListener('change', updateCopy);
  function ready(value) {
    command = value;
    text('command-text', value);
    text('command-status', 'Ready to copy');
    text('command-feedback', 'Loaded from the publisher’s source.');
    updateCopy();
  }
  async function load(method, force = false) {
    active = method;
    const current = ++request;
    controller?.abort();
    const currentController = new AbortController();
    controller = currentController;
    command = '';
    $('copy-command').classList.remove('copied');
    $('copy-command').setAttribute('aria-label', 'Copy command');
    updateCopy();
    tabs.forEach(tab => {
      const selected = tab.dataset.method === method;
      tab.classList.toggle('selected', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    $('command-panel').setAttribute('aria-labelledby', `tab-${method}`);
    if (!reducedMotion.matches && $('command-panel').animate) {
      $('command-panel').animate([
        { opacity: 0.35, transform: 'translateY(4px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 220, easing: 'ease-out' });
    }
    text('method-title', method === 'standard' ? 'The standard setup command' : 'The execution policy alternative');
    text('method-description', method === 'standard' ? 'Use this method for your usual PowerShell setup.' : 'Use only if the default command reports an error. Review the source first.');
    $('retry').hidden = true;
    $('source-link').hidden = true;
    $('source-link').removeAttribute('href');
    const raw = config.commands?.[method];
    const url = httpsUrl(raw);
    text('command-text', '# Your command will appear here.');
    if (!raw) {
      text('command-status', 'Not configured');
      text('command-feedback', `Add commands.${method} in config.js to load this command.`);
      return;
    }
    if (!url) {
      text('command-status', 'Invalid source');
      text('command-feedback', 'The command source must be a valid HTTPS URL.');
      return;
    }
    $('source-link').href = url;
    $('source-link').hidden = false;
    if (!force && cache.has(url)) { ready(cache.get(url)); return; }
    text('command-status', 'Loading…');
    text('command-text', '# Loading command from source…');
    text('command-feedback', 'Fetching plain text over HTTPS…');
    const timeout = setTimeout(() => currentController.abort(), 12000);
    try {
      const response = await fetch(url, { signal: currentController.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error(`Source returned HTTP ${response.status}.`);
      const type = response.headers.get('content-type') || '';
      if (/text\/html|application\/(json|xhtml)/i.test(type)) throw new Error('The source must return a command as plain text.');
      const reader = response.body.getReader();
      const chunks = []; let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 32768) { await reader.cancel(); throw new Error('The command exceeds the 32 KB limit.'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
      const value = new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim();
      if (!value || /^(?:<!doctype|<html|<head|<body)/i.test(value) || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(value)) throw new Error('The source did not return valid command text.');
      if (current !== request) return;
      cache.set(url, value);
      ready(value);
    } catch (error) {
      if (current !== request) return;
      text('command-status', 'Unable to load');
      text('command-text', '# Command unavailable. Check the source and try again.');
      text('command-feedback', error.name === 'AbortError' ? 'Request timed out. Try again.' : error instanceof TypeError ? 'Could not fetch the source. Check the URL, connection, and CORS settings.' : error.message);
      $('retry').hidden = false;
    } finally { clearTimeout(timeout); }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => load(tab.dataset.method));
    tab.addEventListener('keydown', event => {
      let index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') index = (i + 1) % tabs.length;
      if (event.key === 'Home') index = 0;
      if (event.key === 'End') index = tabs.length - 1;
      if (index !== undefined) { event.preventDefault(); tabs[index].focus(); load(tabs[index].dataset.method); }
    });
  });
  document.querySelectorAll('[data-select]').forEach(link => link.addEventListener('click', () => load(link.dataset.select)));
  $('retry').addEventListener('click', () => load(active, true));
  $('copy-command').addEventListener('click', async () => {
    if (!command || mobile.matches) return;
    const copiedRequest = request;
    try {
      await navigator.clipboard.writeText(command);
      if (copiedRequest === request) {
        text('command-feedback', 'Copied. Paste into PowerShell when you’re ready.');
        $('copy-command').classList.add('copied');
        $('copy-command').setAttribute('aria-label', 'Command copied');
        setTimeout(() => {
          if (copiedRequest !== request) return;
          $('copy-command').classList.remove('copied');
          $('copy-command').setAttribute('aria-label', 'Copy command');
        }, 2200);
      }
    } catch {
      if (copiedRequest !== request) return;
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents($('command-text'));
      selection.removeAllRanges(); selection.addRange(range);
      text('command-feedback', 'Clipboard unavailable. Command selected — press Ctrl+C to copy.');
    }
  });
  load(active);
})();
