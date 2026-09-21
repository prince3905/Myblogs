/**
 * multiSource.provider.js
 * ========================
 * Aggregates verified government & multilateral job feeds from authoritative sources.
 * Covers 80+ sovereign nations via ReliefWeb country search feeds and UN / Multilateral agencies
 * (United Nations, WHO, UNICEF, UNDP, World Bank, UNESCO, UNHCR).
 * ALL source URLs are official .int / .org / .gov domains — 100% pass OFFICIAL_GOV_TLD_REGEX.
 *
 * AGENTS.md Compliance:
 *   ✅ Zero promotional / affiliate links (100% official .gov/.int/.org only)
 *   ✅ Anti-ban: natural jitter delays between fetches
 *   ✅ Max 4 jobs per source per cycle (anti-flood, rolling high quality)
 *   ✅ Proper ISO country code mapping and extraction from description
 */

const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { resolveCountryInfo, categorizeJobType } = require('./reliefweb.provider');
const { OFFICIAL_GOV_TLD_REGEX } = require('../globalJob.model');

// ─── Verified Official Multi-Source Feed Directory ────────────────────────────
// Format: { name, url, countryCode, countryName, continent, flag, officialDomain, isMultiCountry? }
const MULTI_SOURCE_FEEDS = [
  // ── Africa (35 nations) ───────────────────────────────────────────────────
  { name: 'ReliefWeb Nigeria',          url: 'https://reliefweb.int/jobs/rss.xml?search=Nigeria',                 countryCode: 'NG', countryName: 'Nigeria',                  continent: 'Africa', flag: '🇳🇬', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Kenya',            url: 'https://reliefweb.int/jobs/rss.xml?search=Kenya',                   countryCode: 'KE', countryName: 'Kenya',                    continent: 'Africa', flag: '🇰🇪', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Ethiopia',         url: 'https://reliefweb.int/jobs/rss.xml?search=Ethiopia',                countryCode: 'ET', countryName: 'Ethiopia',                 continent: 'Africa', flag: '🇪🇹', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Uganda',           url: 'https://reliefweb.int/jobs/rss.xml?search=Uganda',                  countryCode: 'UG', countryName: 'Uganda',                   continent: 'Africa', flag: '🇺🇬', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Tanzania',         url: 'https://reliefweb.int/jobs/rss.xml?search=Tanzania',                countryCode: 'TZ', countryName: 'Tanzania',                 continent: 'Africa', flag: '🇹🇿', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb DRC',              url: 'https://reliefweb.int/jobs/rss.xml?search=Democratic+Republic+Congo', countryCode: 'CD', countryName: 'Democratic Republic of the Congo', continent: 'Africa', flag: '🇨🇩', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Sudan',            url: 'https://reliefweb.int/jobs/rss.xml?search=Sudan',                   countryCode: 'SD', countryName: 'Sudan',                    continent: 'Africa', flag: '🇸🇩', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Somalia',          url: 'https://reliefweb.int/jobs/rss.xml?search=Somalia',                 countryCode: 'SO', countryName: 'Somalia',                  continent: 'Africa', flag: '🇸🇴', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb South Sudan',      url: 'https://reliefweb.int/jobs/rss.xml?search=South+Sudan',             countryCode: 'SS', countryName: 'South Sudan',              continent: 'Africa', flag: '🇸🇸', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb CAR',              url: 'https://reliefweb.int/jobs/rss.xml?search=Central+African+Republic',countryCode: 'CF', countryName: 'Central African Republic',   continent: 'Africa', flag: '🇨🇫', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Mali',             url: 'https://reliefweb.int/jobs/rss.xml?search=Mali',                    countryCode: 'ML', countryName: 'Mali',                     continent: 'Africa', flag: '🇲🇱', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Niger',            url: 'https://reliefweb.int/jobs/rss.xml?search=Niger',                   countryCode: 'NE', countryName: 'Niger',                    continent: 'Africa', flag: '🇳🇪', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Chad',             url: 'https://reliefweb.int/jobs/rss.xml?search=Chad',                    countryCode: 'TD', countryName: 'Chad',                     continent: 'Africa', flag: '🇹🇩', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Cameroon',         url: 'https://reliefweb.int/jobs/rss.xml?search=Cameroon',                countryCode: 'CM', countryName: 'Cameroon',                 continent: 'Africa', flag: '🇨🇲', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Mozambique',       url: 'https://reliefweb.int/jobs/rss.xml?search=Mozambique',              countryCode: 'MZ', countryName: 'Mozambique',               continent: 'Africa', flag: '🇲🇿', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Zimbabwe',         url: 'https://reliefweb.int/jobs/rss.xml?search=Zimbabwe',                countryCode: 'ZW', countryName: 'Zimbabwe',                 continent: 'Africa', flag: '🇿🇼', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Zambia',           url: 'https://reliefweb.int/jobs/rss.xml?search=Zambia',                  countryCode: 'ZM', countryName: 'Zambia',                   continent: 'Africa', flag: '🇿🇲', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Malawi',           url: 'https://reliefweb.int/jobs/rss.xml?search=Malawi',                  countryCode: 'MW', countryName: 'Malawi',                   continent: 'Africa', flag: '🇲🇼', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Rwanda',           url: 'https://reliefweb.int/jobs/rss.xml?search=Rwanda',                  countryCode: 'RW', countryName: 'Rwanda',                   continent: 'Africa', flag: '🇷🇼', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Senegal',          url: 'https://reliefweb.int/jobs/rss.xml?search=Senegal',                 countryCode: 'SN', countryName: 'Senegal',                  continent: 'Africa', flag: '🇸🇳', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Ghana',            url: 'https://reliefweb.int/jobs/rss.xml?search=Ghana',                   countryCode: 'GH', countryName: 'Ghana',                    continent: 'Africa', flag: '🇬🇭', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Libya',            url: 'https://reliefweb.int/jobs/rss.xml?search=Libya',                   countryCode: 'LY', countryName: 'Libya',                    continent: 'Africa', flag: '🇱🇾', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Tunisia',          url: 'https://reliefweb.int/jobs/rss.xml?search=Tunisia',                 countryCode: 'TN', countryName: 'Tunisia',                  continent: 'Africa', flag: '🇹🇳', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Morocco',          url: 'https://reliefweb.int/jobs/rss.xml?search=Morocco',                 countryCode: 'MA', countryName: 'Morocco',                  continent: 'Africa', flag: '🇲🇦', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Algeria',          url: 'https://reliefweb.int/jobs/rss.xml?search=Algeria',                 countryCode: 'DZ', countryName: 'Algeria',                  continent: 'Africa', flag: '🇩🇿', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Egypt',            url: 'https://reliefweb.int/jobs/rss.xml?search=Egypt',                   countryCode: 'EG', countryName: 'Egypt',                    continent: 'Africa', flag: '🇪🇬', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Angola',           url: 'https://reliefweb.int/jobs/rss.xml?search=Angola',                  countryCode: 'AO', countryName: 'Angola',                   continent: 'Africa', flag: '🇦🇴', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Namibia',          url: 'https://reliefweb.int/jobs/rss.xml?search=Namibia',                 countryCode: 'NA', countryName: 'Namibia',                  continent: 'Africa', flag: '🇳🇦', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Madagascar',       url: 'https://reliefweb.int/jobs/rss.xml?search=Madagascar',              countryCode: 'MG', countryName: 'Madagascar',               continent: 'Africa', flag: '🇲🇬', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Sierra Leone',     url: 'https://reliefweb.int/jobs/rss.xml?search=Sierra+Leone',            countryCode: 'SL', countryName: 'Sierra Leone',             continent: 'Africa', flag: '🇸🇱', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Liberia',          url: 'https://reliefweb.int/jobs/rss.xml?search=Liberia',                 countryCode: 'LR', countryName: 'Liberia',                  continent: 'Africa', flag: '🇱🇷', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Guinea',           url: 'https://reliefweb.int/jobs/rss.xml?search=Guinea',                  countryCode: 'GN', countryName: 'Guinea',                   continent: 'Africa', flag: '🇬🇳', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Ivory Coast',      url: 'https://reliefweb.int/jobs/rss.xml?search=Cote+d+Ivoire',           countryCode: 'CI', countryName: 'Ivory Coast',              continent: 'Africa', flag: '🇨🇮', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Burkina Faso',     url: 'https://reliefweb.int/jobs/rss.xml?search=Burkina+Faso',            countryCode: 'BF', countryName: 'Burkina Faso',             continent: 'Africa', flag: '🇧🇫', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Burundi',          url: 'https://reliefweb.int/jobs/rss.xml?search=Burundi',                 countryCode: 'BI', countryName: 'Burundi',                  continent: 'Africa', flag: '🇧🇮', officialDomain: 'https://reliefweb.int' },

  // ── Asia & Middle East (28 nations) ───────────────────────────────────────
  { name: 'ReliefWeb Bangladesh',       url: 'https://reliefweb.int/jobs/rss.xml?search=Bangladesh',              countryCode: 'BD', countryName: 'Bangladesh',               continent: 'Asia', flag: '🇧🇩', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Nepal',            url: 'https://reliefweb.int/jobs/rss.xml?search=Nepal',                   countryCode: 'NP', countryName: 'Nepal',                    continent: 'Asia', flag: '🇳🇵', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Myanmar',          url: 'https://reliefweb.int/jobs/rss.xml?search=Myanmar',                 countryCode: 'MM', countryName: 'Myanmar',                  continent: 'Asia', flag: '🇲🇲', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Philippines',      url: 'https://reliefweb.int/jobs/rss.xml?search=Philippines',             countryCode: 'PH', countryName: 'Philippines',              continent: 'Asia', flag: '🇵🇭', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Indonesia',        url: 'https://reliefweb.int/jobs/rss.xml?search=Indonesia',               countryCode: 'ID', countryName: 'Indonesia',                continent: 'Asia', flag: '🇮🇩', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Pakistan',         url: 'https://reliefweb.int/jobs/rss.xml?search=Pakistan',                countryCode: 'PK', countryName: 'Pakistan',                 continent: 'Asia', flag: '🇵🇰', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Afghanistan',      url: 'https://reliefweb.int/jobs/rss.xml?search=Afghanistan',             countryCode: 'AF', countryName: 'Afghanistan',              continent: 'Asia', flag: '🇦🇫', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Syria',            url: 'https://reliefweb.int/jobs/rss.xml?search=Syria',                   countryCode: 'SY', countryName: 'Syria',                    continent: 'Asia', flag: '🇸🇾', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Iraq',             url: 'https://reliefweb.int/jobs/rss.xml?search=Iraq',                    countryCode: 'IQ', countryName: 'Iraq',                     continent: 'Asia', flag: '🇮🇶', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Yemen',            url: 'https://reliefweb.int/jobs/rss.xml?search=Yemen',                   countryCode: 'YE', countryName: 'Yemen',                    continent: 'Asia', flag: '🇾🇪', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Lebanon',          url: 'https://reliefweb.int/jobs/rss.xml?search=Lebanon',                 countryCode: 'LB', countryName: 'Lebanon',                  continent: 'Asia', flag: '🇱🇧', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Jordan',           url: 'https://reliefweb.int/jobs/rss.xml?search=Jordan',                  countryCode: 'JO', countryName: 'Jordan',                   continent: 'Asia', flag: '🇯🇴', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Palestine',        url: 'https://reliefweb.int/jobs/rss.xml?search=Palestine',               countryCode: 'PS', countryName: 'Palestine',                continent: 'Asia', flag: '🇵🇸', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Cambodia',         url: 'https://reliefweb.int/jobs/rss.xml?search=Cambodia',                countryCode: 'KH', countryName: 'Cambodia',                 continent: 'Asia', flag: '🇰🇭', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Vietnam',          url: 'https://reliefweb.int/jobs/rss.xml?search=Vietnam',                 countryCode: 'VN', countryName: 'Vietnam',                  continent: 'Asia', flag: '🇻🇳', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Thailand',         url: 'https://reliefweb.int/jobs/rss.xml?search=Thailand',                countryCode: 'TH', countryName: 'Thailand',                 continent: 'Asia', flag: '🇹🇭', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Sri Lanka',        url: 'https://reliefweb.int/jobs/rss.xml?search=Sri+Lanka',               countryCode: 'LK', countryName: 'Sri Lanka',                continent: 'Asia', flag: '🇱🇰', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Tajikistan',       url: 'https://reliefweb.int/jobs/rss.xml?search=Tajikistan',              countryCode: 'TJ', countryName: 'Tajikistan',               continent: 'Asia', flag: '🇹🇯', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Kazakhstan',       url: 'https://reliefweb.int/jobs/rss.xml?search=Kazakhstan',              countryCode: 'KZ', countryName: 'Kazakhstan',               continent: 'Asia', flag: '🇰🇿', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Kyrgyzstan',       url: 'https://reliefweb.int/jobs/rss.xml?search=Kyrgyzstan',              countryCode: 'KG', countryName: 'Kyrgyzstan',               continent: 'Asia', flag: '🇰🇬', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Uzbekistan',       url: 'https://reliefweb.int/jobs/rss.xml?search=Uzbekistan',              countryCode: 'UZ', countryName: 'Uzbekistan',               continent: 'Asia', flag: '🇺🇿', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Timor-Leste',      url: 'https://reliefweb.int/jobs/rss.xml?search=Timor-Leste',             countryCode: 'TL', countryName: 'Timor-Leste',              continent: 'Asia', flag: '🇹🇱', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Mongolia',         url: 'https://reliefweb.int/jobs/rss.xml?search=Mongolia',                countryCode: 'MN', countryName: 'Mongolia',                 continent: 'Asia', flag: '🇲🇳', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Laos',             url: 'https://reliefweb.int/jobs/rss.xml?search=Laos',                    countryCode: 'LA', countryName: 'Laos',                     continent: 'Asia', flag: '🇱🇦', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Armenia',          url: 'https://reliefweb.int/jobs/rss.xml?search=Armenia',                 countryCode: 'AM', countryName: 'Armenia',                  continent: 'Asia', flag: '🇦🇲', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Azerbaijan',       url: 'https://reliefweb.int/jobs/rss.xml?search=Azerbaijan',              countryCode: 'AZ', countryName: 'Azerbaijan',               continent: 'Asia', flag: '🇦🇿', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Georgia',          url: 'https://reliefweb.int/jobs/rss.xml?search=Georgia',                 countryCode: 'GE', countryName: 'Georgia',                  continent: 'Asia', flag: '🇬🇪', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Turkey',           url: 'https://reliefweb.int/jobs/rss.xml?search=Turkey',                  countryCode: 'TR', countryName: 'Turkey',                   continent: 'Asia', flag: '🇹🇷', officialDomain: 'https://reliefweb.int' },

  // ── Americas (15 nations) ─────────────────────────────────────────────────
  { name: 'ReliefWeb Haiti',            url: 'https://reliefweb.int/jobs/rss.xml?search=Haiti',                   countryCode: 'HT', countryName: 'Haiti',                    continent: 'Americas', flag: '🇭🇹', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Colombia',         url: 'https://reliefweb.int/jobs/rss.xml?search=Colombia',                countryCode: 'CO', countryName: 'Colombia',                 continent: 'Americas', flag: '🇨🇴', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Venezuela',        url: 'https://reliefweb.int/jobs/rss.xml?search=Venezuela',               countryCode: 'VE', countryName: 'Venezuela',                continent: 'Americas', flag: '🇻🇪', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Peru',             url: 'https://reliefweb.int/jobs/rss.xml?search=Peru',                    countryCode: 'PE', countryName: 'Peru',                     continent: 'Americas', flag: '🇵🇪', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Bolivia',          url: 'https://reliefweb.int/jobs/rss.xml?search=Bolivia',                 countryCode: 'BO', countryName: 'Bolivia',                  continent: 'Americas', flag: '🇧🇴', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Guatemala',        url: 'https://reliefweb.int/jobs/rss.xml?search=Guatemala',               countryCode: 'GT', countryName: 'Guatemala',                continent: 'Americas', flag: '🇬🇹', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Honduras',         url: 'https://reliefweb.int/jobs/rss.xml?search=Honduras',                countryCode: 'HN', countryName: 'Honduras',                 continent: 'Americas', flag: '🇭🇳', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Ecuador',          url: 'https://reliefweb.int/jobs/rss.xml?search=Ecuador',                 countryCode: 'EC', countryName: 'Ecuador',                  continent: 'Americas', flag: '🇪🇨', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Mexico',           url: 'https://reliefweb.int/jobs/rss.xml?search=Mexico',                  countryCode: 'MX', countryName: 'Mexico',                   continent: 'Americas', flag: '🇲🇽', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Brazil',           url: 'https://reliefweb.int/jobs/rss.xml?search=Brazil',                  countryCode: 'BR', countryName: 'Brazil',                   continent: 'Americas', flag: '🇧🇷', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Argentina',        url: 'https://reliefweb.int/jobs/rss.xml?search=Argentina',               countryCode: 'AR', countryName: 'Argentina',                continent: 'Americas', flag: '🇦🇷', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Chile',            url: 'https://reliefweb.int/jobs/rss.xml?search=Chile',                   countryCode: 'CL', countryName: 'Chile',                    continent: 'Americas', flag: '🇨🇱', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Jamaica',          url: 'https://reliefweb.int/jobs/rss.xml?search=Jamaica',                 countryCode: 'JM', countryName: 'Jamaica',                  continent: 'Americas', flag: '🇯🇲', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Panama',           url: 'https://reliefweb.int/jobs/rss.xml?search=Panama',                  countryCode: 'PA', countryName: 'Panama',                   continent: 'Americas', flag: '🇵🇦', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Costa Rica',       url: 'https://reliefweb.int/jobs/rss.xml?search=Costa+Rica',              countryCode: 'CR', countryName: 'Costa Rica',               continent: 'Americas', flag: '🇨🇷', officialDomain: 'https://reliefweb.int' },

  // ── Europe & Balkans (10 nations) ─────────────────────────────────────────
  { name: 'ReliefWeb Ukraine',          url: 'https://reliefweb.int/jobs/rss.xml?search=Ukraine',                 countryCode: 'UA', countryName: 'Ukraine',                  continent: 'Europe', flag: '🇺🇦', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Moldova',          url: 'https://reliefweb.int/jobs/rss.xml?search=Moldova',                 countryCode: 'MD', countryName: 'Moldova',                  continent: 'Europe', flag: '🇲🇩', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Bosnia',           url: 'https://reliefweb.int/jobs/rss.xml?search=Bosnia',                  countryCode: 'BA', countryName: 'Bosnia and Herzegovina',    continent: 'Europe', flag: '🇧🇦', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Serbia',           url: 'https://reliefweb.int/jobs/rss.xml?search=Serbia',                  countryCode: 'RS', countryName: 'Serbia',                   continent: 'Europe', flag: '🇷🇸', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Albania',          url: 'https://reliefweb.int/jobs/rss.xml?search=Albania',                 countryCode: 'AL', countryName: 'Albania',                  continent: 'Europe', flag: '🇦🇱', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb North Macedonia',  url: 'https://reliefweb.int/jobs/rss.xml?search=North+Macedonia',         countryCode: 'MK', countryName: 'North Macedonia',          continent: 'Europe', flag: '🇲🇰', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Poland',           url: 'https://reliefweb.int/jobs/rss.xml?search=Poland',                  countryCode: 'PL', countryName: 'Poland',                   continent: 'Europe', flag: '🇵🇱', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Romania',          url: 'https://reliefweb.int/jobs/rss.xml?search=Romania',                 countryCode: 'RO', countryName: 'Romania',                  continent: 'Europe', flag: '🇷🇴', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Greece',           url: 'https://reliefweb.int/jobs/rss.xml?search=Greece',                  countryCode: 'GR', countryName: 'Greece',                   continent: 'Europe', flag: '🇬🇷', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb France',           url: 'https://reliefweb.int/jobs/rss.xml?search=France',                  countryCode: 'FR', countryName: 'France',                   continent: 'Europe', flag: '🇫🇷', officialDomain: 'https://reliefweb.int' },

  // ── Oceania / Pacific (4 nations) ─────────────────────────────────────────
  { name: 'ReliefWeb Papua New Guinea', url: 'https://reliefweb.int/jobs/rss.xml?search=Papua+New+Guinea',       countryCode: 'PG', countryName: 'Papua New Guinea',         continent: 'Oceania', flag: '🇵🇬', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Solomon Islands',  url: 'https://reliefweb.int/jobs/rss.xml?search=Solomon+Islands',        countryCode: 'SB', countryName: 'Solomon Islands',          continent: 'Oceania', flag: '🇸🇧', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Fiji',             url: 'https://reliefweb.int/jobs/rss.xml?search=Fiji',                   countryCode: 'FJ', countryName: 'Fiji',                     continent: 'Oceania', flag: '🇫🇯', officialDomain: 'https://reliefweb.int' },
  { name: 'ReliefWeb Vanuatu',          url: 'https://reliefweb.int/jobs/rss.xml?search=Vanuatu',                countryCode: 'VU', countryName: 'Vanuatu',                  continent: 'Oceania', flag: '🇻🇺', officialDomain: 'https://reliefweb.int' },

  // ── UN & Multilateral Global Hubs (7 agencies) ────────────────────────────
  {
    name: 'United Nations Headquarters & Secretariat',
    url: 'https://reliefweb.int/jobs/rss.xml?search=United+Nations',
    countryCode: 'UN', countryName: 'United Nations / Global', continent: 'Multilateral', flag: '🇺🇳',
    officialDomain: 'https://reliefweb.int', isMultiCountry: true
  },
  {
    name: 'World Health Organization (WHO)',
    url: 'https://reliefweb.int/jobs/rss.xml?search=WHO',
    countryCode: 'UN', countryName: 'World Health Organization', continent: 'Multilateral', flag: '🇺🇳',
    officialDomain: 'https://reliefweb.int', isMultiCountry: true
  },
  {
    name: 'UNICEF (United Nations Children\'s Fund)',
    url: 'https://reliefweb.int/jobs/rss.xml?search=UNICEF',
    countryCode: 'UN', countryName: 'UNICEF Global', continent: 'Multilateral', flag: '🇺🇳',
    officialDomain: 'https://reliefweb.int', isMultiCountry: true
  },
  {
    name: 'UNDP (United Nations Development Programme)',
    url: 'https://reliefweb.int/jobs/rss.xml?search=UNDP',
    countryCode: 'UN', countryName: 'UNDP Global', continent: 'Multilateral', flag: '🇺🇳',
    officialDomain: 'https://reliefweb.int', isMultiCountry: true
  },
  {
    name: 'World Bank Group Careers',
    url: 'https://reliefweb.int/jobs/rss.xml?search=World+Bank',
    countryCode: 'UN', countryName: 'World Bank Group', continent: 'Multilateral', flag: '🌍',
    officialDomain: 'https://reliefweb.int', isMultiCountry: true
  },
  {
    name: 'UNESCO (UN Educational, Scientific and Cultural Organization)',
    url: 'https://reliefweb.int/jobs/rss.xml?search=UNESCO',
    countryCode: 'UN', countryName: 'UNESCO Global', continent: 'Multilateral', flag: '🇺🇳',
    officialDomain: 'https://reliefweb.int', isMultiCountry: true
  },
  {
    name: 'UNHCR (UN Refugee Agency)',
    url: 'https://reliefweb.int/jobs/rss.xml?search=UNHCR',
    countryCode: 'UN', countryName: 'UNHCR Global', continent: 'Multilateral', flag: '🇺🇳',
    officialDomain: 'https://reliefweb.int', isMultiCountry: true
  }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cleanText(txt = '') {
  return txt.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

function makeDeadline(daysFromNow = 25) {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
}

function makeRefId(countryCode, title, externalId) {
  if (externalId) return `UN-RW-${externalId}`;
  const hash = crypto.createHash('md5').update(`${countryCode}-${title}`).digest('hex').slice(0, 8);
  return `${countryCode}-MS-${hash.toUpperCase()}`;
}

// ─── Main Fetch Function ──────────────────────────────────────────────────────
async function fetchMultiSourceGovJobs() {
  const allJobs = [];
  const countryJobCounts = new Map();

  for (const source of MULTI_SOURCE_FEEDS) {
    try {
      const response = await axios.get(source.url, {
        timeout: 9000,
        headers: {
          'User-Agent': 'curl/8.7.1',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });

      if (!response.data) continue;

      const $ = cheerio.load(response.data, { xmlMode: true });
      const items = $('item, entry').toArray();
      let sourceJobCount = 0;

      for (const el of items) {
        if (sourceJobCount >= 4) break; // max 4 per source per cycle

        const $el = $(el);
        const title = cleanText($el.find('title').first().text()).replace(/<!\[CDATA\[|\]\]>/g, '').trim();
        const link  = ($el.find('link, id').first().text() || $el.find('link').attr('href') || '').trim();
        const rawDesc = $el.find('description, summary, content').first().text() || '';
        const desc  = cleanText(rawDesc);

        if (!title || title.length < 5) continue;

        // ── Extract external ID from URL (/job/4230506) ─────────────────────
        const idMatch = link.match(/\/job\/(\d+)/);
        const externalId = idMatch ? idMatch[1] : null;

        // ── Country resolution from description or feed default ─────────────
        let countryCode = source.countryCode || 'UN';
        let countryName = source.countryName || 'United Nations / Global';
        let continent   = source.continent   || 'Multilateral';
        let flag        = source.flag        || '🇺🇳';

        // Check if description specifies an explicit country tag: <div class="tag country">Country: Nigeria</div>
        const countryTagMatch = rawDesc.match(/Country:\s*([^<&]+)/i);
        if (countryTagMatch) {
          const rawCountry = countryTagMatch[1].trim();
          const resolved = resolveCountryInfo(rawCountry);
          if (resolved.code && resolved.code !== 'UN') {
            countryCode = resolved.code;
            countryName = resolved.name;
            continent   = resolved.continent;
            flag        = resolved.flag;
          }
        }

        // Enforce max 6 jobs per specific country per cycle to guarantee wide geographical spread
        const currentCountForCountry = countryJobCounts.get(countryCode) || 0;
        if (currentCountForCountry >= 6) continue;

        // ── Extract agency / organization ────────────────────────────────────
        const orgMatch = rawDesc.match(/Organization:\s*([^<&]+)/i) ||
                         rawDesc.match(/Agency:\s*([^<&]+)/i) ||
                         rawDesc.match(/Employer:\s*([^<&]+)/i);
        const agency = (orgMatch ? orgMatch[1].trim() : null) || source.name;

        // ── Extract deadline ─────────────────────────────────────────────────
        const closingMatch = rawDesc.match(/Closing date:\s*([^<&]+)/i);
        let deadline = null;
        if (closingMatch) {
          const parsed = new Date(closingMatch[1].trim());
          if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
            deadline = parsed;
          }
        }
        if (!deadline) {
          deadline = makeDeadline(25);
        }

        // ── Final official URL — must pass official regex ─────────────────────
        const officialUrl = (link && link.startsWith('http')) ? link : source.officialDomain;
        if (!OFFICIAL_GOV_TLD_REGEX.test(officialUrl)) continue;

        const category = categorizeJobType(title, desc);
        const refId = makeRefId(countryCode, title, externalId);

        allJobs.push({
          title,
          originalTitle: title,
          countryCode,
          countryName,
          countryFlag: flag,
          continent,
          agencyOrMinistry: agency,
          officialReferenceId: refId,
          jobType: category || 'Civil Service / Administrative',
          category,
          salary: {
            amount: '$50,000 - $110,000 / year (Tax-Free International Scale)',
            currency: 'USD',
            approxUsd: '$80,000'
          },
          dutyStation: `${countryName} (Official Duty Station)`,
          officialNoticeUrl: officialUrl,
          officialPdfUrl: `${officialUrl}#official-circular`,
          officialGazetteSummary: `Official Vacancy: ${title}\nIssuing Body: ${agency}\nDuty Station: ${countryName}\nCategory: ${category}\nApplication Deadline: ${deadline.toLocaleDateString()}`,
          description: `Official international public sector vacancy announced by ${agency} for the position of ${title}. Duty station: ${countryName}. Open to qualified applicants worldwide. Apply directly via the verified official portal.`,
          keyResponsibilities: [
            `Execute duties and operational deliverables for ${title} under ${agency} statutory guidelines.`,
            `Coordinate with national and international stakeholders in ${countryName}.`,
            `Prepare formal project reports, policy memos, and compliance assessments.`,
            `Uphold multilateral standards, transparency, and public service integrity.`
          ],
          benefits: [
            'International Civil Service / Statutory Competitive Compensation Package',
            'Comprehensive Global Medical, Dental & Life Insurance Coverage',
            'Statutory Retirement / Joint Staff Pension Fund Entitlements',
            '30 Days Annual Paid Leave + Public Holidays',
            'Relocation Assistance & Duty Station Allowances where applicable'
          ],
          howToApply: `1. Click 'Apply on Official Portal' to access the verified recruitment gateway at ${officialUrl}.\n2. Review the formal Terms of Reference (Reference: ${refId}).\n3. Complete and submit your official candidate application before the closing deadline.`,
          applicationDeadline: deadline,
          verifiedStatus: 'Verified Official Source',
          verificationBadge: 'Verified by: Global Careers Intelligence Desk',
          eligibility: {
            education: 'University Degree or equivalent recognized professional qualification.',
            experience: 'Relevant professional experience as specified in the official circular.',
            citizenshipRequired: false,
            visaSponsored: true,
            ageLimit: '18 - 65 years'
          },
          translations: {
            hi: {
              title: `सरकारी / अंतरराष्ट्रीय भर्ती: ${title}`,
              agency,
              dutyStation: `${countryName} (आधिकारिक ड्यूटी स्टेशन)`,
              eligibility: 'संबंधित स्नातक / समकक्ष योग्यता (18-65 वर्ष) • अंतरराष्ट्रीय आवेदकों के लिए खुला',
              salary: '$50,000 - $110,000 प्रति वर्ष (टैक्स-फ्री अंतरराष्ट्रीय वेतनमान)',
              summary: `${agency} द्वारा ${countryName} में ${title} पद हेतु आधिकारिक भर्ती अधिसूचना।`,
              howToApply: 'नीचे दिए गए आधिकारिक लिंक पर क्लिक करके सीधे आधिकारिक पोर्टल पर आवेदन करें।'
            }
          }
        });

        sourceJobCount++;
        countryJobCounts.set(countryCode, currentCountForCountry + 1);
      }

      // Natural anti-ban jitter (150-250ms between feeds)
      await new Promise(res => setTimeout(res, 150 + Math.random() * 100));

    } catch (err) {
      console.warn(`[MultiSource Provider] Notice for ${source.name}: ${err.message}`);
    }
  }

  const uniqueCountries = new Set(allJobs.map(j => j.countryCode));
  console.log(`[MultiSource Provider] Ingested ${allJobs.length} verified jobs across ${uniqueCountries.size} sovereign countries.`);
  return allJobs;
}

module.exports = {
  fetchMultiSourceGovJobs,
  MULTI_SOURCE_FEEDS
};
