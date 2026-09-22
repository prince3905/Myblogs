/**
 * translationProtection.js
 * Comprehensive Internationalization Guardian for Digital Home.
 * Prevents brand names, technical acronyms, payment systems, and official bodies
 * from being mangled or literally translated by Google Translate or browser engines.
 */

import React from 'react';

// Protected Dictionary of Terms & Brands
export const PROTECTED_TERMS = [
  // Messaging, Social & Tech Apps
  'WhatsApp', 'Telegram', 'YouTube', 'Twitter', 'Facebook', 'Instagram',
  'LinkedIn', 'Reddit', 'Discord', 'Google', 'Gmail', 'Android', 'iOS', 'OneSignal',

  // Document & Web Standards
  'PDF', 'DOC', 'DOCX', 'ZIP', 'URL', 'URLs', 'HTTP', 'HTTPS', 'API', 'APIs', 'RSS',

  // Indian Exam Bodies & Sarkari Acronyms
  'UPSC', 'SSC', 'RRB', 'IBPS', 'NTA', 'UGC NET', 'CSIR NET', 'NEET', 'GATE',
  'NDA', 'CDS', 'AFCAT', 'DRDO', 'ISRO', 'BARC',
  'BPSC', 'UPPSC', 'MPPSC', 'RPSC', 'MPSC', 'KPSC', 'APPSC', 'TNPSC', 'WBPSC',
  'OPSC', 'JPSC', 'GPSC', 'HPSC', 'JKPSC',
  'Sarkari Result', 'Sarkari Naukri', 'Sarkari',

  // Banking, Identity, Security & Official Terms
  'UPI', 'QR Code', 'QR', 'OTP', 'PIN', 'ATM', 'CVV', 'SMS',
  'Email', 'E-mail', 'ID', 'Reference ID', 'Roll No', 'Roll Number',

  // International Portals & TLDs
  'USAJOBS', 'Bund.de', 'BOE', 'Careers@Gov', 'APSjobs', 'FAHR', 'Jadarat',
  '.nic.in', '.gov.in', '.gov', '.org', '.int',

  // Brand Name
  'Digital Home', 'DigitalHomeBlog'
];

// Regex matching whole words (case-insensitive for safety, but preserves original casing)
// Sorted by length descending so multi-word terms like "Sarkari Result" match before "Sarkari"
const SORTED_TERMS = [...PROTECTED_TERMS].sort((a, b) => b.length - a.length);
const ESCAPED_TERMS = SORTED_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const PROTECTED_REGEX = new RegExp(`\\b(${ESCAPED_TERMS.join('|')})\\b`, 'gi');

/**
 * React Component to explicitly protect inline words or children
 */
export function NoTranslate({ children, className = '', component = 'span', ...props }) {
  return React.createElement(
    component,
    {
      className: `notranslate ${className}`.trim(),
      translate: 'no',
      ...props
    },
    children
  );
}

/**
 * Scans a DOM node and wraps protected terms in <span class="notranslate" translate="no">
 * Ignores scripts, styles, inputs, editable content, and elements already marked notranslate.
 */
export function protectElement(root = document.body) {
  if (!root || typeof window === 'undefined') return;

  const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'CODE', 'PRE']);

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        if (IGNORED_TAGS.has(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip if already inside a notranslate element
        if (parent.closest('.notranslate, [translate="no"], .skiptranslate')) {
          return NodeFilter.FILTER_REJECT;
        }

        PROTECTED_REGEX.lastIndex = 0;
        return PROTECTED_REGEX.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodesToReplace = [];
  while (walker.nextNode()) {
    nodesToReplace.push(walker.currentNode);
  }

  nodesToReplace.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent) return;

    const originalText = textNode.nodeValue;
    PROTECTED_REGEX.lastIndex = 0;

    // Split text and wrap matches
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = PROTECTED_REGEX.exec(originalText)) !== null) {
      const matchIndex = match.index;
      const matchedWord = match[0];

      if (matchIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(originalText.slice(lastIndex, matchIndex)));
      }

      const span = document.createElement('span');
      span.className = 'notranslate';
      span.setAttribute('translate', 'no');
      span.textContent = matchedWord;
      fragment.appendChild(span);

      lastIndex = matchIndex + matchedWord.length;
    }

    if (lastIndex < originalText.length) {
      fragment.appendChild(document.createTextNode(originalText.slice(lastIndex)));
    }

    parent.replaceChild(fragment, textNode);
  });
}

/**
 * Initializes continuous DOM protection with a debounced MutationObserver
 */
let isObserverActive = false;
export function initTranslationProtection() {
  if (typeof window === 'undefined' || isObserverActive) return;
  isObserverActive = true;

  // 1. Initial Protection Pass
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => protectElement(document.body), { once: true });
  } else {
    setTimeout(() => protectElement(document.body), 100);
  }

  // 2. Continuous debounced MutationObserver for dynamic React transitions
  let debounceTimeout = null;
  const observer = new MutationObserver((mutations) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            protectElement(node);
          } else if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            protectElement(node.parentElement);
          }
        });
      });
    }, 150);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
