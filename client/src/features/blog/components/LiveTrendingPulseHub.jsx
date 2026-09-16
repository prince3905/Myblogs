import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Chip, 
  IconButton, 
  Tooltip,
  Skeleton,
  Dialog,
  DialogContent,
  Button,
  Divider
} from '@mui/material';
import { 
  Refresh, 
  AccessTime, 
  ElectricBolt,
  Close,
  CheckCircle,
  Lightbulb,
  Explore,
  Work,
  Build,
  Article,
  Share,
  Help,
  VerifiedUser,
  Shield,
  AutoAwesome
} from '@mui/icons-material';
import { request } from '../../../shared/lib/api';

/**
 * Intelligent In-Depth Editorial Report Synthesizer
 * Generates exhaustive, multi-paragraph reports with full ground reality, statistics, action checklist & FAQs.
 * 100% SELF-CONTAINED ON-SITE — ZERO EXTERNAL REDIRECTS OR BOUNCE!
 */
function getDeepReport(item) {
  if (!item) return null;

  // Use backend report if it is already extensive and complete
  if (item.report && item.report.summaryLead && item.report.groundReality && item.report.keyTakeaways?.length >= 4 && item.report.faqs?.length >= 2) {
    return item.report;
  }

  const title = item.title || '';
  const t = title.toLowerCase();
  const cat = item.categoryKey || 'news';

  // 1. FINANCE & UPI CATEGORY
  if (cat === 'finance') {
    if (t.includes('upi') || t.includes('payment') || t.includes('charge') || t.includes('fee') || t.includes('limit') || t.includes('npc') || t.includes('wallet')) {
      return {
        subtitle: 'डिजिटल पेमेंट्स, यूपीआई गाइडलाइन्स, लिमिट्स व बैंकिंग सुरक्षा पर विस्तृत रिपोर्ट',
        summaryLead: `भारतीय राष्ट्रीय भुगतान निगम (NPCI) और भारतीय रिज़र्व बैंक (RBI) द्वारा संचालित यूनिफाइड पेमेंट्स इंटरफेस (UPI) को लेकर हालिया दिनों में उपभोक्ताओं और व्यापारियों के बीच कई नई चर्चाएं शुरू हुई हैं। देश के करोड़ों डिजिटल उपयोगकर्ताओं के लिए सबसे बड़ी और राहत भरी बात यह है कि आम नागरिकों के बीच होने वाले व्यक्तिगत (Person-to-Person यानी P2P) पेमेंट्स पूरी तरह 100% मुफ्त और सुरक्षित बने रहेंगे। सरकार और नियामक संस्थाओं ने आधिकारिक रूप से स्पष्ट किया है कि सामान्य यूपीआई लेनदेन पर आम जनता से कोई अतिरिक्त शुल्क या हिडन चार्ज नहीं लिया जाएगा। सामान्य मर्चेंट क्यूआर कोड स्कैनिंग पर भी ग्राहकों के लिए कोई अतिरिक्त सरचार्ज लागू नहीं है।`,
        groundReality: `डिजिटल लेन-देन की दुनिया में पारदर्शिता लाने के लिए प्रीपेड पेमेंट इंस्ट्रूमेंट्स (वॉलेट्स आदि) और बड़े मर्चेंट ट्रांजेक्शन के लिए नियम पहले से परिभाषित हैं। तकनीकी स्तर पर सर्वर लोड को संतुलित करने और असफल लेनदेन (Failed Transactions) की दर को शून्य करने के लिए बैंक अपने कोर बैंकिंग सिस्टम को अपग्रेड कर रहे हैं। इसके साथ ही साइबर सुरक्षा के कड़े मानक लागू किए गए हैं ताकि ऑनलाइन फ्रॉड पर तत्काल रोक लगाई जा सके। बैंकों को सख्त निर्देश दिए गए हैं कि यदि किसी तकनीकी खराबी के कारण खाते से पैसे कट जाएं और सामने वाले को न पहुंचे, तो निर्धारित ऑटो-रिवर्सल समय सीमा (T+1 वर्किंग डे) के भीतर पैसा वापस किया जाए, अन्यथा ग्राहक को प्रतिदिन के हिसाब से हर्जाना मिलेगा।`,
        keyTakeaways: [
          'व्यक्तिगत बैंक-टू-बैंक UPI ट्रांसफर पर किसी भी प्रकार का कोई शुल्क नहीं है — यह पूर्णतः निःशुल्क रहेगा।',
          'दैनिक सामान्य UPI ट्रांजेक्शन लिमिट बैंक के अनुसार ₹1 लाख से ₹2 लाख तक निर्धारित है, जबकि अस्पताल और शिक्षण संस्थानों के लिए यह ₹5 लाख तक है।',
          'आरबीआई के निर्देशानुसार ऑटोमैटिक फ्रॉड डिटेक्शन और रियल-टाइम एसएमएस अलर्ट्स को अनिवार्य किया गया है।',
          'यदि यूपीआई ट्रांजेक्शन के दौरान पैसे कट जाएं और रिसीवर को न पहुंचें, तो T+1 वर्किंग डे के अंदर बैंक को पैसे वापस करने होंगे।',
          'गलत खाते में पेमेंट जाने की स्थिति में तुरंत बैंक के टोल-फ्री नंबर या NPCI के आधिकारिक पोर्टल पर यूटीआर नंबर (UTR) के साथ शिकायत दर्ज कराई जा सकती है।'
        ],
        statGrid: [
          { label: 'P2P ट्रांसफर शुल्क', value: '₹0 (बिल्कुल फ्री)' },
          { label: 'सामान्य दैनिक लिमिट', value: '₹1,00,000 - ₹2,00,000' },
          { label: 'शिक्षा/अस्पताल लिमिट', value: '₹5,00,000 / दिन' },
          { label: 'नियामक प्राधिकरण', value: 'RBI & NPCI भारत' }
        ],
        actionChecklist: [
          'अपने यूपीआई ऐप्स (Google Pay, PhonePe, Paytm, BHIM) को केवल आधिकारिक गूगल प्ले स्टोर या ऐपल ऐप स्टोर से ही अपडेट रखें।',
          'किसी भी अनजान व्यक्ति द्वारा भेजा गया क्यूआर कोड स्कैन न करें — ध्यान रहे कि पैसे प्राप्त करने के लिए कभी यूपीआई पिन नहीं डालना होता।',
          'अपने बैंक खाते में दैनिक यूपीआई लिमिट अपनी जरूरत के अनुसार सेट करें ताकि मोबाइल गुम होने की दशा में भी आपका मुख्य फंड सुरक्षित रहे।',
          'लॉटरी, इनाम या रिफंड का झांसा देने वाले किसी भी संदिग्ध मैसेज या लिंक पर कभी क्लिक न करें।'
        ],
        faqs: [
          {
            q: 'क्या दोस्तों या परिवार को यूपीआई से पैसे भेजने पर कोई एक्स्ट्रा चार्ज कटेगा?',
            a: 'बिल्कुल नहीं! आम नागरिकों के बीच सामान्य बैंक-टू-बैंक यूपीआई लेन-देन पर सरकार या बैंक द्वारा कोई शुल्क नहीं लगाया जाता।'
          },
          {
            q: 'यदि गलत खाते में यूपीआई पेमेंट हो जाए तो क्या करें?',
            a: 'ट्रांजेक्शन का यूटीआर नंबर (UTR Number) नोट करें, तुरंत अपने बैंक के कस्टमर केयर पर कॉल करके ट्रांजेक्शन को फ्लैग कराएं और 1930 राष्ट्रीय साइबर हेल्पलाइन या npci.org.in पर शिकायत दर्ज करें।'
          },
          {
            q: 'यूपीआई लाइट (UPI Lite) क्या है और इसके क्या फायदे हैं?',
            a: 'यूपीआई लाइट छोटे भुगतानों (₹500 तक) के लिए बिना पिन डाले तुरंत ट्रांजेक्शन करने की सुरक्षित सुविधा है, जिससे बैंक का मुख्य सर्वर व्यस्त होने पर भी पेमेंट फेल नहीं होता।'
          }
        ]
      };
    }

    if (t.includes('tax') || t.includes('income') || t.includes('budget') || t.includes('itr') || t.includes('gst')) {
      return {
        subtitle: 'आयकर नियम, टैक्स स्लैब व बजट प्रावधानों का संपूर्ण विश्लेषण',
        summaryLead: `प्रत्यक्ष कर बोर्ड (CBDT) और वित्त मंत्रालय द्वारा आयकर नियमों में पारदर्शिता और सरलीकरण को सर्वोच्च प्राथमिकता दी जा रही है। टैक्सपेयर्स को नए टैक्स रिजीम (New Tax Regime) और पुराने टैक्स रिजीम (Old Tax Regime) के बीच चयन करते समय अपनी वार्षिक आय, निवेश और मिलने वाली विभिन्न कटौतियों का सही मिलान करना आवश्यक है। नई कर व्यवस्था को अब डिफॉल्ट रिजीम बना दिया गया है, जिसमें मध्यम वर्ग को अधिक राहत प्रदान करने के लिए टैक्स स्लैब और रिबेट की सीमाओं को संशोधित किया गया है।`,
        groundReality: `कर विशेषज्ञों के अनुसार, मध्यम वर्ग और वेतनभोगी कर्मचारियों के लिए नई कर व्यवस्था में दी गई मानक कटौती (Standard Deduction) और धारा 87A के तहत मिलने वाली टैक्स रिबेट से ₹7 लाख से अधिक की वार्षिक आय वाले कई लोगों का प्रभावी कर शून्य हो जाता है। वहीं जिन करदाताओं के पास होम लोन का ब्याज, एचआरए (HRA) और 80C/80D के तहत बड़े निवेश हैं, उनके लिए पुरानी कर व्यवस्था का तुलनात्मक अध्ययन करना अधिक लाभकारी सिद्ध हो सकता है। आईटीआर फाइलिंग प्रक्रिया को अब पूरी तरह डिजिटल, पारदर्शी और फेसलेस बना दिया गया है।`,
        keyTakeaways: [
          'न्यू टैक्स रिजीम को डिफॉल्ट रिजीम बनाया गया है, जिसमें सरल स्लैब और अधिक टैक्स रिबेट उपलब्ध है।',
          'वेतनभोगी कर्मचारियों को न्यू टैक्स रिजीम में भी मानक कटौती (Standard Deduction) का पूरा लाभ मिलता है।',
          'वार्षिक आईटीआर फाइलिंग समय पर पूरी करना आवश्यक है, अन्यथा लेट फीस (धारा 234F) और ब्याज का भुगतान करना पड़ सकता है।',
          'फॉर्म 26AS और एआईएस (AIS) के माध्यम से अपने सभी टीडीएस और वित्तीय लेन-देन का पूर्व सत्यापन अनिवार्य है।',
          'आईटीआर दाखिल करने के बाद 30 दिनों के भीतर आधार ओटीपी द्वारा ई-वेरिफिकेशन करना अनिवार्य होता है।'
        ],
        statGrid: [
          { label: 'डिफॉल्ट रिजीम', value: 'New Tax Regime' },
          { label: 'टैक्स रिबेट सीमा', value: '₹7 लाख तक (धारा 87A)' },
          { label: 'मानक कटौती', value: 'वेतनभोगियों के लिए मान्य' },
          { label: 'निगरानी एजेंसी', value: 'CBDT & इनकम टैक्स विभाग' }
        ],
        actionChecklist: [
          'आयकर पोर्टल (incometax.gov.in) पर अपना ई-फाइलिंग अकाउंट एक्टिव और आधार-पैन लिंक्ड रखें।',
          'वित्तीय वर्ष समाप्त होने से पहले सभी जरूरी टैक्स सेविंग विकल्पों और फॉर्म 16 का सावधानीपूर्वक मिलान करें।',
          'आईटीआर फाइल करने के बाद तुरंत आधार ओटीपी द्वारा ई-वेरिफिकेशन पूरा करें ताकि रिफंड जल्द से जल्द प्रोसेस हो सके।',
          'अपने बैंक खातों का प्री-वैलिडेशन जरूर करवाएं ताकि रिफंड सीधे आपके सही बैंक खाते में क्रेडिट हो सके।'
        ],
        faqs: [
          {
            q: 'क्या हर किसी के लिए न्यू टैक्स रिजीम ही सबसे अच्छा है?',
            a: 'यदि आपके पास होम लोन ब्याज, एचआरए या बड़े 80C/80D निवेश नहीं हैं तो न्यू टैक्स रिजीम बेहतर है, अन्यथा दोनों की गणना करके ही चयन करें।'
          },
          {
            q: 'ई-वेरिफिकेशन न करने पर क्या आईटीआर अमान्य हो जाता है?',
            a: 'हाँ, बिना समय पर ई-वेरिफिकेशन किए दाखिल किया गया आईटीआर आयकर विभाग द्वारा अमान्य घोषित कर दिया जाता है।'
          }
        ]
      };
    }

    if (t.includes('stock') || t.includes('market') || t.includes('sensex') || t.includes('nifty') || t.includes('share') || t.includes('sebi')) {
      return {
        subtitle: 'शेयर बाजार रुझान, सेबी गाइडलाइन्स व खुदरा निवेशकों के लिए संपूर्ण रिपोर्ट',
        summaryLead: `भारतीय शेयर बाजार और पूंजी बाजार में खुदरा (Retail) निवेशकों की भागीदारी में रिकॉर्ड वृद्धि देखी जा रही है। मार्केट रेगुलेटर सेबी (SEBI) और प्रमुख स्टॉक एक्सचेंजों (NSE/BSE) द्वारा छोटे निवेशकों के हितों की सुरक्षा के लिए कई नए नियम और सख्त सुरक्षा मानक लागू किए जा रहे हैं। डेरिवेटिव्स (F&O) ट्रेडिंग में रिस्क मैनेजमेंट और सोशल मीडिया पर अनधिकृत 'टिप्स' देने वालों पर लगाम लगाने के लिए विशेष निगरानी तंत्र स्थापित किया गया है।`,
        groundReality: `बाजार के उतार-चढ़ाव के बीच वित्तीय सलाहकारों का स्पष्ट मानना है कि बिना गहन रिसर्च के सीधे सट्टेबाजी या शॉर्ट-टर्म ट्रेडिंग करने के बजाय म्यूचुअल फंड्स में सिस्टमैटिक इन्वेस्टमेंट प्लान (SIP) के जरिए लंबी अवधि का अनुशासित निवेश ही पूंजी को सुरक्षित रखता है। वैश्विक आर्थिक संकेतों, मुद्रास्फीति और कंपनियों के बुनियादी वित्तीय नतीजों का बाजार के दीर्घकालिक रुख पर गहरा प्रभाव पड़ता है।`,
        keyTakeaways: [
          'सेबी के अध्ययन के अनुसार F&O ट्रेडिंग में 90% से अधिक खुदरा ट्रेडर्स को घाटा होता है, अतः बिना विशेषज्ञता के ट्रेडिंग से बचें।',
          'लंबी अवधि के वेल्थ क्रिएशन के लिए इंडेक्स फंड्स और लार्ज-कैप म्यूचुअल फंड्स सबसे संतुलित और विश्वसनीय विकल्प माने जाते हैं।',
          'किसी भी अनरजिस्टर्ड टेलीग्राम ग्रुप या सोशल मीडिया टिप्स के बहकावे में आकर अपनी गाढ़ी कमाई न लगाएं।',
          'डीमैट खाते में टू-फैक्टर ऑथेंटिकेशन और नॉमिनी का नाम अनिवार्य रूप से अपडेट रखें।'
        ],
        statGrid: [
          { label: 'मार्केट रेगुलेटर', value: 'SEBI भारत' },
          { label: 'निवेश का सुरक्षित मार्ग', value: 'अनुशासित SIP' },
          { label: 'डीमैट सुरक्षा', value: '2FA व बायोमेट्रिक' },
          { label: 'निगरानी', value: 'NSE & BSE' }
        ],
        actionChecklist: [
          'हमेशा सेबी-पंजीकृत रिसर्च एनालिस्ट या वित्तीय सलाहकारों की राय पर ही अमल करें।',
          'अपने निवेश को केवल एक शेयर या सेक्टर में न लगाएं, पोर्टफोलियो में विविधता रखें।',
          'हर महीने अपने डीमैट स्टेटमेंट (CAS) को चेक करें ताकि अनधिकृत लेन-देन का तुरंत पता चल सके।'
        ],
        faqs: [
          {
            q: 'क्या नए निवेशकों को सीधे शेयर खरीदने चाहिए या म्यूचुअल फंड में जाना चाहिए?',
            a: 'नए निवेशकों के लिए म्यूचुअल फंड एसआईपी के जरिए शुरुआत करना सबसे सुरक्षित और समझदारी भरा कदम माना जाता है।'
          },
          {
            q: 'यदि डीमैट खाते से कोई संदिग्ध गतिविधि दिखे तो क्या करें?',
            a: 'तुरंत अपने ब्रोकर के कस्टमर सपोर्ट से संपर्क करके खाता अस्थायी रूप से फ्रीज कराएं और सेबी के SCORES पोर्टल पर शिकायत दर्ज करें।'
          }
        ]
      };
    }

    // Default Finance
    return {
      subtitle: 'बैंकिंग नियम, मार्केट रुझान व सुरक्षित निवेश की संपूर्ण गाइड',
      summaryLead: `भारतीय अर्थव्यवस्था और बैंकिंग क्षेत्र में हो रहे निरंतर सुधारों से आम नागरिकों की बचत, एफडी और निवेश पर सीधा असर पड़ रहा है। रिज़र्व बैंक ऑफ इंडिया (RBI) की मौद्रिक नीति समिति द्वारा महंगाई दर और जीडीपी विकास के संतुलन को बनाए रखने के लिए ब्याज दरों पर नियमित समीक्षा की जाती है। शेड्यूल्ड बैंकों में जमाकर्ताओं की पूंजी को सुरक्षा प्रदान करने के लिए केंद्रीय बैंक लगातार कड़े कदम उठा रहा है।`,
      groundReality: `बैंकों द्वारा फिक्स्ड डिपॉजिट (FD) और सेविंग्स अकाउंट्स पर दिए जाने वाले ब्याज दरों में स्थिरता बनी हुई है। दूसरी ओर खुदरा निवेशक अनुशासित रूप से सरकारी बचत योजनाओं (PPF, Sukanya Samriddhi, NSC) और म्यूचुअल फंड एसआईपी की ओर तेजी से आकर्षित हो रहे हैं। डिजिटल बैंकिंग के विस्तार के साथ साइबर धोखाधड़ी से बचाव के लिए भी बैंकों ने दोहरे सत्यापन के नियम अनिवार्य कर दिए हैं।`,
      keyTakeaways: [
        'आरबीआई की गाइडलाइन्स के तहत प्रत्येक बैंक जमाकर्ता का ₹5 लाख तक का डिपॉजिट DICGC द्वारा 100% बीमित (Insured) होता है।',
        'अपने बजट का कम से कम 20% हिस्सा नियमित बचत और आपातकालीन फंड (Emergency Fund) में रखना चाहिए।',
        'सिबिल क्रेडिट स्कोर को 750 से ऊपर रखने से भविष्य में होम लोन या पर्सनल लोन सबसे कम ब्याज दर पर आसानी से मिल जाता है।',
        'अनधिकृत लोन ऐप्स या तुरंत पैसा दोगुना करने का झांसा देने वाली किसी भी फर्जी स्कीम से पूरी तरह दूर रहें।'
      ],
      statGrid: [
        { label: 'डिपॉजिट बीमा सुरक्षा', value: '₹5 लाख प्रति बैंक' },
        { label: 'आदर्श सिबिल स्कोर', value: '750+' },
        { label: 'अनुशंसित बचत नियम', value: '50-30-20 फॉर्मूला' },
        { label: 'रेगुलेटर', value: 'RBI & SEBI' }
      ],
      actionChecklist: [
        'किसी भी अनधिकृत लोन ऐप या तुरंत पैसा दोगुना करने का दावा करने वाली फर्जी स्कीमों से दूर रहें।',
        'हर 6 महीने में अपना क्रेडिट स्कोर और बैंक स्टेटमेंट अनिवार्य रूप से चेक करें।',
        'लंबी अवधि के लक्ष्यों के लिए फिक्स्ड इनकम और इक्विटी का संतुलित पोर्टफोलियो बनाएं।'
      ],
      faqs: [
        {
          q: 'क्या फिक्स्ड डिपॉजिट में पैसा लगाना आज भी सुरक्षित है?',
          a: 'हाँ, शेड्यूल्ड बैंकों में जमा राशि सरकारी गारंटी (DICGC) के तहत ₹5 लाख तक पूरी तरह सुरक्षित होती है।'
        },
        {
          q: 'सिबिल स्कोर खराब होने पर उसे कैसे सुधारा जा सकता है?',
          a: 'क्रेडिट कार्ड के बिल और लोन की ईएमआई समय पर चुकाएं और क्रेडिट कार्ड लिमिट का 30% से अधिक इस्तेमाल न करें।'
        }
      ]
    };
  }

  // 2. AI & TOOLS CATEGORY
  if (cat === 'ai') {
    return {
      subtitle: 'आर्टिफिशियल इंटेलिजेंस, जनरेटिव मॉडल्स व डिजिटल टूल्स का गहन विश्लेषण',
      summaryLead: `आर्टिफिशियल इंटेलिजेंस (AI) का दायरा अब केवल रिसर्च लैब्स तक सीमित नहीं रहा, बल्कि यह रोजमर्रा के जीवन, शिक्षा और पेशेवर कार्यप्रणाली में क्रांति ला रहा है। नए जनरेटिव एआई मॉडल्स और ऑटोमेशन टूल्स ने छात्रों, शोधकर्ताओं और क्रिएटर्स के काम करने के तरीके को पूरी तरह बदल दिया है। भारतीय बाजार में भी स्थानीय भाषाओं में एआई समाधानों की मांग बहुत तेजी से बढ़ रही है।`,
      groundReality: `सर्च इंजन, कोडिंग असिस्टेंट्स और कंटेंट क्रिएशन प्लेटफॉर्म्स अब रीज़निंग मॉडल्स और एजेंटिक वर्कफ़्लो पर काम कर रहे हैं। इससे डेटा समराइजेशन, कॉम्प्लेक्स प्रॉब्लम सॉल्विंग और विजुअल डिजाइनिंग का काम सेकंडों में पूरा हो रहा है। भारत में एआई टूल्स का उपयोग शिक्षा, सरकारी प्रतियोगी परीक्षाओं की तैयारी और छोटे व्यवसायों के ऑटोमेशन में क्रांतिकारी रूप से बढ़ रहा है।`,
      keyTakeaways: [
        'स्मार्ट प्रॉम्प्ट इंजीनियरिंग के जरिए किसी भी एआई टूल से 10 गुना बेहतर, प्रासंगिक और सटीक परिणाम प्राप्त किए जा सकते हैं।',
        'मार्केट में अनेक पावरफुल एआई टूल्स विद्यार्थियों और प्रोफेशनल्स के लिए फ्री टियर में उपलब्ध हैं जिनका सही उपयोग उत्पादकता को दोगुना कर सकता है।',
        'एआई द्वारा तैयार किए गए डेटा और सूचनाओं का फैक्ट-चेक करना आवश्यक है ताकि तथ्यात्मक गलतियों (Hallucinations) से बचा जा सके।',
        'प्राइवेसी और डेटा सिक्योरिटी के नियमों का पालन करते हुए किसी भी गोपनीय दस्तावेज को पब्लिक एआई बॉट्स में अपलोड करने से बचें।'
      ],
      statGrid: [
        { label: 'कार्य दक्षता वृद्धि', value: '3x - 10x तेज' },
        { label: 'उपलब्धता', value: 'मोबाइल व वेब ब्राउज़र' },
        { label: 'प्रमुख उपयोग', value: 'रिसर्च, कोडिंग व एनालिसिस' },
        { label: 'कैटेगरी', value: 'Generative AI & Tools' }
      ],
      actionChecklist: [
        'प्रॉम्प्ट लिखते समय एआई को सटीक संदर्भ (Context), अपना लक्ष्य और अपेक्षित आउटपुट फॉर्मेट स्पष्ट रूप से बताएं।',
        'किसी भी संवेदनशील व्यक्तिगत, आधार या वित्तीय जानकारी को पब्लिक एआई बॉट्स में इनपुट न करें।',
        'एआई टूल्स को अपना सहायक बनाएं, उन पर आंख बंद करके निर्भर न रहें — अंतिम निर्णय हमेशा अपनी बुद्धि से लें।'
      ],
      faqs: [
        {
          q: 'क्या छात्र अपनी पढ़ाई और नोट्स बनाने के लिए एआई का उपयोग कर सकते हैं?',
          a: 'हाँ, कठिन विषयों को आसान भाषा में समझने, जटिल अवधारणाओं को स्पष्ट करने और त्वरित रिवीज़न नोट्स बनाने के लिए एआई एक बेहतरीन टूल है।'
        },
        {
          q: 'क्या एआई टूल्स हमेशा 100% सही जानकारी देते हैं?',
          a: 'नहीं, एआई कभी-कभी पुराने या गलत तथ्य (Hallucinations) दे सकता है, इसलिए महत्वपूर्ण सरकारी नियमों व आंकड़ों की पुष्टि आधिकारिक स्रोतों से जरूर करें।'
        }
      ]
    };
  }

  // 3. TECH & GADGETS CATEGORY
  if (cat === 'tech') {
    return {
      subtitle: 'सॉफ्टवेयर गाइड, प्राइवेसी सेटिंग्स व गैजेट्स पर पूरी जानकारी',
      summaryLead: `तकनीक और डिजिटल गैजेट्स हमारे जीवन का अभिन्न हिस्सा बन चुके हैं। स्मार्टफोन, लैपटॉप और ऑपरेटिंग सिस्टम के नए फीचर्स जहां एक ओर हमारी उत्पादकता बढ़ाते हैं, वहीं दूसरी ओर साइबर सुरक्षा और डेटा प्राइवेसी को लेकर जागरूक रहना भी बेहद जरूरी हो गया है। ऑपरेटिंग सिस्टम्स में आने वाले नए सुरक्षा पैच और परफॉर्मेंस बूस्टर्स डिवाइस की लाइफ को बढ़ाने में महत्वपूर्ण भूमिका निभाते हैं।`,
      groundReality: `विंडोज 11, एंड्रॉयड और आईओएस में लगातार सुरक्षा पैच और परफॉर्मेंस बूस्टर्स जारी किए जा रहे हैं। बैकग्राउंड डेटा कंजम्पशन को कम करने, बैटरी लाइफ को अनुकूलित करने और क्लाउड स्टोरेज के सुरक्षित उपयोग के लिए सही सेटिंग्स का चुनाव करना प्रत्येक यूज़र के लिए आवश्यक है। फ्रॉड से जुड़े स्पैम कॉल्स और फिशिंग एसएमएस पर रोक लगाने के लिए टेलीकॉम विभाग भी नए दिशा-निर्देश लागू कर रहा है।`,
      keyTakeaways: [
        'स्मार्टफोन और कंप्यूटर की स्पीड तेज रखने के लिए कैशे फाइल्स और गैर-जरूरी बैकग्राउंड ऐप्स को समय पर क्लियर करें।',
        'मैलवेयर और स्पाईवेयर से बचाव के लिए हमेशा टू-फैक्टर ऑथेंटिकेशन (2FA) और बायोमेट्रिक लॉक ऑन रखें।',
        'अनजान लिंक्स से एपीके फाइल्स (APK) डाउनलोड करने से बचें क्योंकि इनमें खतरनाक ट्रोजन हो सकते हैं।',
        'अपने ऑपरेटिंग सिस्टम और महत्वपूर्ण ऐप्स के अपडेट्स को कभी भी नजरअंदाज न करें।'
      ],
      statGrid: [
        { label: 'सिस्टम परफॉर्मेंस', value: 'ऑप्टिमाइज्ड सेटिंग्स' },
        { label: 'सुरक्षा स्तर', value: '2-फैक्टर वेरिफिकेशन' },
        { label: 'सपोर्टेड ओएस', value: 'Android, Windows, iOS' },
        { label: 'गाइड प्रकार', value: 'Tested & Practical' }
      ],
      actionChecklist: [
        'अपने सभी जरूरी अकाउंट्स के पासवर्ड मजबूत रखें और हर कुछ महीनों में उन्हें बदलें।',
        'अपने फोन के महत्वपूर्ण फोटो और फाइल्स का ऑटोमैटिक गूगल ड्राइव या लोकल सुरक्षित बैकअप सेट करें।',
        'सिस्टम अपडेट आने पर उसे टालने के बजाय वाई-फाई कनेक्ट करके तुरंत अपडेट करें।'
      ],
      faqs: [
        {
          q: 'फोन बहुत धीमा चल रहा हो तो उसे बिना फॉर्मेट किए कैसे तेज करें?',
          a: 'फोन की इंटरनल स्टोरेज में कम से कम 20% स्पेस खाली रखें, बैकग्राउंड रनिंग ऐप्स को बंद करें और सेटिंग्स में जाकर एनिमेशन स्पीड 0.5x पर सेट करें।'
        },
        {
          q: 'क्या सार्वजनिक वाई-फाई पर नेट बैंकिंग का उपयोग करना सुरक्षित है?',
          a: 'नहीं, पब्लिक वाई-फाई पर बिना वीपीएन के वित्तीय लेनदेन करने से डेटा हैक होने का खतरा रहता है।'
        }
      ]
    };
  }

  // 4. HEALTH & WELLNESS CATEGORY
  if (cat === 'health') {
    return {
      subtitle: 'स्वास्थ्य जागरूकता, जीवनशैली सुधार व क्लिनिकल एडवाइजरी',
      summaryLead: `आधुनिक भागदौड़ भरी जिंदगी और डेस्क जॉब कल्चर के कारण स्वास्थ्य से जुड़ी चुनौतियां तेजी से बढ़ रही हैं। स्वास्थ्य विशेषज्ञों और चिकित्सकों का मानना है कि दैनिक दिनचर्या में छोटे-छोटे सकारात्मक बदलाव करके कई गंभीर जीवनशैली बीमारियों से आसानी से बचा जा सकता है। शारीरिक फिटनेस के साथ-साथ मानसिक संतुलन और पर्याप्त नींद का ध्यान रखना आज के समय में सबसे प्राथमिक आवश्यकता बन गया है।`,
      groundReality: `संतुलित पोषण, पर्याप्त जल सेवन (हाइड्रेशन) और मानसिक तनाव को नियंत्रित रखना उत्तम स्वास्थ्य की कुंजी है। स्क्रीन टाइम अधिक होने के कारण आंखों में खिंचाव (Digital Eye Strain), सर्वाइकल पेन और नींद न आने की समस्याएं आम हो गई हैं, जिसके लिए प्राकृतिक और व्यावहारिक उपायों को अपनाना आवश्यक है। मौसमी बदलाव के समय खान-पान और रोग प्रतिरोधक क्षमता का विशेष ध्यान रखना चाहिए।`,
      keyTakeaways: [
        'रोजाना 7 से 8 घंटे की गहरी और नियमित नींद शरीर की रोग प्रतिरोधक क्षमता (Immunity) को प्राकृतिक रूप से मजबूत करती है।',
        'ज्यादा नमक, रिफाइंड चीनी और पैकेज्ड प्रोसेस्ड फूड का सेवन सीमित करके हृदय स्वास्थ्य और रक्तचाप को नियंत्रित रखा जा सकता है।',
        'काम के दौरान हर 20 मिनट बाद 20 सेकंड के लिए 20 फीट दूर देखने से (20-20-20 नियम) आंखों की थकान दूर होती है।',
        'दैनिक रूप से 30 मिनट की तेज वॉक या योग करने से तनाव हार्मोन्स कम होते हैं और ऊर्जा का स्तर बढ़ता है।'
      ],
      statGrid: [
        { label: 'दैनिक जल सेवन', value: '2.5 से 3.5 लीटर' },
        { label: 'शारीरिक व्यायाम', value: '30 मिनट प्रतिदिन' },
        { label: 'नींद का समय', value: '7-8 घंटे आवश्यक' },
        { label: 'गाइडलाइन स्रोत', value: 'WHO व मेडिकल रिसर्च' }
      ],
      actionChecklist: [
        'सुबह उठकर खाली पेट गुनगुना पानी पिएं और दिन की शुरुआत ताजे फलों या भीगे मेवों से करें।',
        'सोने से कम से कम 1 घंटा पहले मोबाइल और टीवी स्क्रीन को पूरी तरह बंद कर दें।',
        'वर्ष में कम से कम एक बार अपनी बुनियादी स्वास्थ्य जांच (ब्लड टेस्ट, बीपी, शुगर) जरूर करवाएं।'
      ],
      faqs: [
        {
          q: 'लगातार थकान और सुस्ती महसूस होने का मुख्य कारण क्या हो सकता है?',
          a: 'विटामिन डी3, विटामिन बी12 की कमी, पर्याप्त नींद न मिलना या हीमोग्लोबिन का स्तर कम होना इसके मुख्य कारण हो सकते हैं।'
        },
        {
          q: 'तनाव और चिंता को तुरंत कम करने का सबसे सरल तरीका क्या है?',
          a: 'गहरी सांस लेने का अभ्यास (4-7-8 ब्रीदिंग तकनीक) करें और कुछ मिनटों के लिए खुली हवा में टहलें।'
        }
      ]
    };
  }

  // 5. DEFAULT: NEWS & TOP HEADLINES
  return {
    subtitle: 'राष्ट्रीय घटनाक्रम, प्रशासनिक निर्णय व सार्वजनिक नीति विश्लेषण',
    summaryLead: `देश-दुनिया और शासन व्यवस्था में हो रहे महत्वपूर्ण नीतिगत निर्णयों का सीधा असर आम नागरिकों, युवाओं और विद्यार्थियों के भविष्य पर पड़ता है। विकास योजनाओं, तकनीकी विस्तार और प्रशासनिक सुधारों से नए अवसर पैदा हो रहे हैं। सरकारी योजनाओं के डिजिटलीकरण से अब योजनाओं का लाभ सीधे डीबीटी (Direct Benefit Transfer) के माध्यम से पात्र नागरिकों तक पहुंच रहा है।`,
    groundReality: `डिजिटल इंडिया, कौशल विकास और नागरिक सेवाओं के ऑनलाइन होने से पारदर्शिता बढ़ी है। प्रतियोगी परीक्षाओं की तैयारी कर रहे विद्यार्थियों के लिए राष्ट्रीय करंट अफेयर्स, सरकारी योजनाओं और नए कानूनों की सटीक जानकारी रखना बेहद आवश्यक है ताकि वे हर परीक्षा में आगे रह सकें। प्रशासनिक स्तर पर लिए गए फैसलों का समय पर और प्रामाणिक विश्लेषण मिलना हर जागरूक नागरिक के लिए जरूरी है।`,
    keyTakeaways: [
      'सरकारी योजनाओं और कल्याणकारी कार्यक्रमों का लाभ उठाने के लिए सही पात्रता और आधिकारिक पोर्टल की जानकारी होना जरूरी है।',
      'समसामयिक घटनाक्रम (Current Affairs) का नियमित अध्ययन प्रतियोगी परीक्षाओं के लिए अत्यधिक लाभकारी है।',
      'सोशल मीडिया पर फैलने वाली अफवाहों से बचें और केवल सत्यापित आधिकारिक स्रोतों पर ही विश्वास करें।',
      'योजनाओं और भर्तियों के लिए आवेदन करते समय केवल संबंधित विभाग के आधिकारिक वेब पते (.gov.in / .nic.in) का ही उपयोग करें।'
    ],
    statGrid: [
      { label: 'इम्पैक्ट क्षेत्र', value: 'राष्ट्रीय व जनहित' },
      { label: 'सत्यापन स्तर', value: 'प्रामाणिक व निष्पक्ष' },
      { label: 'अपडेट प्रकार', value: '24x7 लाइव न्यूज' },
      { label: 'कवरेज', value: 'Digital Home Special' }
    ],
    actionChecklist: [
      'महत्वपूर्ण सरकारी घोषणाओं और अधिसूचनाओं के लिए हमारे लाइव अलर्ट्स सेक्शन को बुकमार्क करके रखें।',
      'अपने सभी आधिकारिक दस्तावेज (आधार, पैन, वोटर आईडी, जाति/निवास प्रमाण पत्र) समय पर अपडेट रखें।',
      'शिक्षा और रोजगार से जुड़ी खबरों के लिए नियमित रूप से हमारे पोर्टल पर विजिट करते रहें।'
    ],
    faqs: [
      {
        q: 'सरकारी योजनाओं से जुड़ी सही और प्रामाणिक जानकारी कहां मिलती है?',
        a: 'केंद्र और राज्य सरकारों के आधिकारिक पोर्टल्स और हमारे डिजिटल होम ब्लॉग के लाइव अपडेट्स सेक्शन पर पूरी जानकारी उपलब्ध रहती है।'
      },
      {
        q: 'प्रतियोगी परीक्षाओं के लिए करंट अफेयर्स की तैयारी कैसे करें?',
        a: 'दैनिक रूप से राष्ट्रीय व अंतरराष्ट्रीय मुख्य बिंदुओं को संक्षेप में नोट करें और नियमित क्विज का अभ्यास करें।'
      }
    ]
  };
}

export default function LiveTrendingPulseHub() {
  const navigate = useNavigate();
  const [pulseData, setPulseData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchPulse = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const url = isManualRefresh 
        ? '/api/public/trending-pulse?refresh=true' 
        : '/api/public/trending-pulse';
      const res = await request(url);
      if (res && res.success) {
        setPulseData(res.data || []);
        if (res.categories) setCategories(res.categories);
        if (res.lastUpdated) setLastUpdated(res.lastUpdated);
      }
    } catch (err) {
      console.warn('[TrendingPulseHub] Fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(() => fetchPulse(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return pulseData;
    return pulseData.filter(item => item.categoryKey === activeCategory);
  }, [pulseData, activeCategory]);

  const breakingItems = useMemo(() => {
    return pulseData.slice(0, 5);
  }, [pulseData]);

  const countsByCategory = useMemo(() => {
    const counts = { all: pulseData.length };
    pulseData.forEach(item => {
      counts[item.categoryKey] = (counts[item.categoryKey] || 0) + 1;
    });
    return counts;
  }, [pulseData]);

  const handleShare = async () => {
    if (!selectedTrend) return;
    const shareText = `${selectedTrend.title} - Read full report on Digital Home Blog!`;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: selectedTrend.title, text: shareText, url: shareUrl });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Comprehensive report memo: ALWAYS returns deep report, never empty or null!
  const report = useMemo(() => {
    if (!selectedTrend) return null;
    return getDeepReport(selectedTrend);
  }, [selectedTrend]);

  return (
    <Box 
      component="section" 
      id="trending-news-radar"
      sx={{ 
        py: { xs: 5, md: 7 }, 
        bgcolor: '#0F172A',
        color: '#F8FAFC',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '20%',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0) 70%)',
          pointerEvents: 'none'
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          right: '10%',
          width: '500px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.07) 0%, rgba(15, 23, 42, 0) 70%)',
          pointerEvents: 'none'
        }
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6 }, position: 'relative', zIndex: 1 }}>
        
        {/* Header Bar */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'flex-end' },
          gap: 2,
          mb: 3.5
        }}>
          <Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.4,
                py: 0.4,
                borderRadius: '20px',
                bgcolor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#F87171',
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: 1
              }}>
                <Box sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#EF4444',
                  boxShadow: '0 0 10px #EF4444',
                  animation: 'pulse 1.5s infinite ease-in-out',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(0.8)', opacity: 0.6 },
                    '50%': { transform: 'scale(1.3)', opacity: 1 },
                    '100%': { transform: 'scale(0.8)', opacity: 0.6 }
                  }
                }} />
                24x7 TRENDING RADAR
              </Box>

              <Chip 
                label="LIVE MULTI-CATEGORY" 
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  bgcolor: 'rgba(56, 189, 248, 0.12)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '6px'
                }}
              />
            </Box>

            <Typography 
              variant="h3" 
              component="h2"
              sx={{ 
                fontWeight: 850, 
                fontSize: { xs: '1.5rem', sm: '1.9rem', md: '2.2rem' },
                letterSpacing: '-0.03em',
                color: '#FFFFFF',
                lineHeight: 1.2
              }}
            >
              India & Global <span style={{ 
                background: 'linear-gradient(135deg, #38BDF8 0%, #A855F7 50%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Live Trends Hub</span>
            </Typography>

            <Typography 
              variant="body2" 
              sx={{ 
                color: '#94A3B8', 
                mt: 0.8, 
                fontSize: { xs: '0.82rem', md: '0.9rem' },
                maxWidth: '680px'
              }}
            >
              किसी भी कार्ड पर क्लिक करके उसकी पूरी विस्तृत रिपोर्ट, आंकड़े और जरूरी बातें यहीं इसी पेज पर पढ़ें।
            </Typography>
          </Box>

          {/* Refresh & Status Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, alignSelf: { xs: 'flex-start', md: 'flex-end' } }}>
            {lastUpdated && (
              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 13 }} />
                Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
            
            <Tooltip title="Refresh Live Trends">
              <IconButton 
                onClick={() => fetchPulse(true)}
                disabled={refreshing}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#38BDF8',
                  width: 38,
                  height: 38,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(56, 189, 248, 0.15)',
                    borderColor: '#38BDF8',
                    transform: 'rotate(90deg)'
                  }
                }}
              >
                <Refresh sx={{ fontSize: 20, animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Breaking News Ticker Strip */}
        {breakingItems.length > 0 && (
          <Box sx={{
            mb: 3,
            p: 1.2,
            bgcolor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            overflow: 'hidden'
          }}>
            <Box sx={{
              px: 1.2,
              py: 0.4,
              bgcolor: '#EF4444',
              color: '#FFFFFF',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              flexShrink: 0
            }}>
              <ElectricBolt sx={{ fontSize: 13 }} />
              PULSE
            </Box>

            <Box sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              py: 0.2
            }}>
              {breakingItems.map((item, idx) => (
                <Box 
                  key={item.id || idx}
                  onClick={() => setSelectedTrend(item)}
                  sx={{
                    color: '#E2E8F0',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                    transition: 'all 0.2s ease',
                    '&:hover': { color: '#38BDF8', transform: 'translateX(2px)' }
                  }}
                >
                  <span style={{ color: item.color || '#38BDF8', fontWeight: 800 }}>
                    {item.icon} [{item.badge || item.categoryName}]:
                  </span>
                  <span>{item.title}</span>
                  <span style={{ color: '#64748B', fontSize: '0.72rem' }}>• {item.timeAgo}</span>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Category Filter Pills */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mb: 3, 
          overflowX: 'auto', 
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.key;
            const count = countsByCategory[cat.key] || 0;
            return (
              <Box
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 1.8,
                  py: 0.7,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 800 : 600,
                  bgcolor: isActive ? `${cat.color || '#38BDF8'}25` : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? (cat.color || '#38BDF8') : '#94A3B8',
                  border: '1px solid',
                  borderColor: isActive ? (cat.color || '#38BDF8') : 'rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF'
                  }
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {count > 0 && (
                  <Box sx={{
                    px: 0.7,
                    py: 0.1,
                    borderRadius: '10px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    bgcolor: isActive ? cat.color || '#38BDF8' : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? '#FFFFFF' : '#CBD5E1'
                  }}>
                    {count}
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Content Stream Grid */}
        {loading ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2
          }}>
            {[...Array(8)].map((_, i) => (
              <Box key={i} sx={{ p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }} />
                <Skeleton variant="text" width="90%" height={30} sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', my: 1 }} />
                <Skeleton variant="text" width="70%" height={20} sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }} />
              </Box>
            ))}
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px' }}>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>इस श्रेणी में अभी कोई लाइव अपडेट उपलब्ध नहीं है।</Typography>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2
          }}>
            {filteredItems.map((item) => (
              <Box
                key={item.id}
                onClick={() => setSelectedTrend(item)}
                sx={{
                  p: 2,
                  bgcolor: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    bgcolor: 'rgba(30, 41, 59, 0.85)',
                    borderColor: `${item.color || '#38BDF8'}80`,
                    boxShadow: `0 10px 25px -5px ${item.color || '#38BDF8'}25`,
                    '& .card-title': {
                      color: item.color || '#38BDF8'
                    },
                    '& .pulse-tag': {
                      transform: 'scale(1.03)'
                    }
                  }
                }}
              >
                {/* Top Card Meta: Badge + Relative Time */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                    <Chip
                      className="pulse-tag"
                      label={`${item.icon} ${item.badge || item.categoryName}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        bgcolor: `${item.color}20`,
                        color: item.color || '#38BDF8',
                        border: `1px solid ${item.color}40`,
                        borderRadius: '4px',
                        transition: 'transform 0.2s',
                        '& .MuiChip-label': { px: 0.8 }
                      }}
                    />

                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#64748B', 
                        fontSize: '0.68rem', 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.4
                      }}
                    >
                      <AccessTime sx={{ fontSize: 12 }} />
                      {item.timeAgo}
                    </Typography>
                  </Box>

                  {/* Headline Title */}
                  <Typography
                    className="card-title"
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      lineHeight: 1.45,
                      color: '#E2E8F0',
                      letterSpacing: '-0.01em',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      transition: 'color 0.2s ease'
                    }}
                  >
                    {item.title}
                  </Typography>
                </Box>

                {/* Bottom Action Prompt */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  pt: 1.5,
                  mt: 1,
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#94A3B8', 
                      fontSize: '0.72rem', 
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}
                  >
                    <VerifiedUser sx={{ fontSize: 13, color: item.color }} />
                    विस्तृत रिपोर्ट
                  </Typography>

                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: item.color || '#38BDF8', 
                      fontSize: '0.7rem', 
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.3
                    }}
                  >
                    पूरी जानकारी पढ़ें ➔
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}

      </Container>

      {/* ULTRA-PREMIUM IN-DEPTH EDITORIAL POPUP MODAL (100% On-Site, Zero Bounce) */}
      <Dialog
        open={Boolean(selectedTrend)}
        onClose={() => setSelectedTrend(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: '22px', sm: '32px' },
            background: 'linear-gradient(180deg, #0B132B 0%, #060A17 100%)',
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderTop: `6px solid ${selectedTrend?.color || '#38BDF8'}`,
            boxShadow: `0 35px 90px -10px rgba(0, 0, 0, 0.95), 0 0 60px ${selectedTrend?.color || '#38BDF8'}35`,
            backdropFilter: 'blur(30px)',
            overflow: 'hidden',
            maxHeight: '92vh',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '10px' }
          }
        }}
      >
        {selectedTrend && report && (
          <DialogContent sx={{ p: { xs: 2.5, sm: 4.5 }, overflowY: 'auto' }}>
            
            {/* Top Meta Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                  label={`${selectedTrend.icon} ${selectedTrend.badge || selectedTrend.categoryName}`}
                  size="small"
                  sx={{
                    height: 28,
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    bgcolor: selectedTrend.color || '#38BDF8',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: `0 0 15px ${selectedTrend.color || '#38BDF8'}40`
                  }}
                />
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: '15px !important', color: '#10B981' }} />}
                  label="Digital Home Special Briefing"
                  size="small"
                  sx={{
                    height: 28,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                    color: '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px'
                  }}
                />
                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <AccessTime sx={{ fontSize: 13 }} />
                  {selectedTrend.timeAgo}
                </Typography>
              </Box>

              {/* Action Toolbar */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title={copied ? "Copied to clipboard!" : "Share Report"}>
                  <IconButton 
                    onClick={handleShare}
                    size="small"
                    sx={{ 
                      color: copied ? '#10B981' : '#94A3B8', 
                      bgcolor: 'rgba(255,255,255,0.06)', 
                      border: '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.2s',
                      '&:hover': { color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.15)' } 
                    }}
                  >
                    <Share sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <IconButton 
                  onClick={() => setSelectedTrend(null)}
                  size="small"
                  sx={{ 
                    color: '#94A3B8', 
                    bgcolor: 'rgba(255,255,255,0.06)', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.2s',
                    '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.4)' } 
                  }}
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Main Title Headline */}
            <Typography 
              variant="h4" 
              component="h2"
              sx={{ 
                fontWeight: 900, 
                fontSize: { xs: '1.35rem', sm: '1.75rem' },
                lineHeight: 1.35,
                color: '#FFFFFF',
                letterSpacing: '-0.025em',
                mb: 1
              }}
            >
              {selectedTrend.title}
            </Typography>

            {/* Subtitle / Context Header */}
            {report.subtitle && (
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: selectedTrend.color || '#38BDF8', 
                  fontSize: { xs: '0.92rem', sm: '1.05rem' },
                  fontWeight: 750,
                  mb: 3,
                  lineHeight: 1.45
                }}
              >
                {report.subtitle}
              </Typography>
            )}

            {/* Statistics / Key Metrics Grid */}
            {report.statGrid && report.statGrid.length > 0 && (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 1.5,
                mb: 3.5
              }}>
                {report.statGrid.map((stat, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1.8,
                      borderRadius: '16px',
                      bgcolor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      textAlign: 'center',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.6 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: { xs: '0.88rem', sm: '1rem' } }}>
                      {stat.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Section 1: In-Depth Overview & Ground Story */}
            <Box sx={{
              p: { xs: 2.2, sm: 3 },
              mb: 3.5,
              borderRadius: '20px',
              bgcolor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: selectedTrend.color || '#38BDF8', 
                  fontWeight: 850, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.8,
                  fontSize: '0.98rem',
                  letterSpacing: 0.3,
                  mb: 1.8
                }}
              >
                <Explore sx={{ fontSize: 20 }} />
                विस्तृत रिपोर्ट व संपूर्ण पृष्ठभूमि (In-Depth Analysis)
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#F1F5F9', 
                  fontSize: '0.94rem', 
                  lineHeight: 1.75,
                  mb: 2
                }}
              >
                {report.summaryLead}
              </Typography>

              {report.groundReality && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#CBD5E1', 
                    fontSize: '0.9rem', 
                    lineHeight: 1.7 
                  }}
                >
                  {report.groundReality}
                </Typography>
              )}
            </Box>

            {/* Section 2: Key Takeaways / Points */}
            {report.keyTakeaways && report.keyTakeaways.length > 0 && (
              <Box sx={{ mb: 3.5 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#F59E0B', 
                    fontWeight: 850, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.8,
                    fontSize: '0.98rem',
                    mb: 1.8
                  }}
                >
                  <CheckCircle sx={{ fontSize: 20 }} />
                  मुख्य तथ्य व जरूरी नियम (Key Highlights)
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {report.keyTakeaways.map((pt, i) => (
                    <Box 
                      key={i} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 1.4,
                        p: 1.6,
                        borderRadius: '14px',
                        bgcolor: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <Box sx={{ 
                        width: 9, 
                        height: 9, 
                        borderRadius: '50%', 
                        bgcolor: selectedTrend.color || '#38BDF8', 
                        mt: 0.8, 
                        flexShrink: 0,
                        boxShadow: `0 0 10px ${selectedTrend.color || '#38BDF8'}`
                      }} />
                      <Typography variant="body2" sx={{ color: '#F1F5F9', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {pt}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Section 3: Actionable Checklist / Practical Advice */}
            {report.actionChecklist && report.actionChecklist.length > 0 && (
              <Box sx={{
                p: { xs: 2.2, sm: 3 },
                mb: 3.5,
                borderRadius: '18px',
                bgcolor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#F59E0B', 
                    fontWeight: 850, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.8,
                    fontSize: '0.95rem',
                    mb: 1.5
                  }}
                >
                  <Lightbulb sx={{ fontSize: 20 }} />
                  नागरिकों व विद्यार्थियों के लिए जरूरी सलाह (Action Checklist)
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {report.actionChecklist.map((tip, idx) => (
                    <Typography key={idx} variant="body2" sx={{ color: '#FEF3C7', fontSize: '0.88rem', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <span style={{ color: '#F59E0B', fontWeight: 900, fontSize: '1rem' }}>✔</span> {tip}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {/* Section 4: FAQs (Common Doubts Addressed) */}
            {report.faqs && report.faqs.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: '#A855F7', 
                    fontWeight: 850, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.8,
                    fontSize: '0.98rem',
                    mb: 1.8
                  }}
                >
                  <Help sx={{ fontSize: 20 }} />
                  अक्सर पूछे जाने वाले सवाल (Frequently Asked Questions)
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {report.faqs.map((faq, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        bgcolor: 'rgba(30, 41, 59, 0.55)',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.92rem', mb: 0.6 }}>
                        Q: {faq.q}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.86rem', lineHeight: 1.6 }}>
                        {faq.a}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Section 5: Editorial Verification Notice (100% On-Site, Zero Outbound Bounce) */}
            <Box sx={{
              p: 2,
              mb: 3.5,
              borderRadius: '14px',
              bgcolor: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}>
              <Shield sx={{ fontSize: 24, color: '#10B981', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: '#A7F3D0', fontSize: '0.82rem', lineHeight: 1.55 }}>
                <strong>प्रामाणिक संपादकीय संकलन:</strong> यह संपूर्ण रिपोर्ट राष्ट्रीय समाचार बुलेटिनों व नियामक संस्थाओं (RBI, NPCI, CBDT आदि) के आधिकारिक दिशा-निर्देशों के आधार पर Digital Home Editorial Desk द्वारा संकलित की गई है। समस्त प्रामाणिक जानकारी यहीं उपलब्ध है — किसी बाहरी लिंक पर जाने की आवश्यकता नहीं है।
              </Typography>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 3 }} />

            {/* Section 6: Internal Navigation Hub (Keeps User 100% on Site!) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1 }}>
                डिजिटल होम पोर्टल की अन्य महत्वपूर्ण सेवाएं:
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.4 }}>
                <Button
                  onClick={() => { setSelectedTrend(null); navigate('/job-alerts'); }}
                  variant="outlined"
                  startIcon={<Work sx={{ fontSize: 18 }} />}
                  sx={{
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    bgcolor: 'rgba(56, 189, 248, 0.08)',
                    color: '#38BDF8',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 1.3,
                    borderRadius: '14px',
                    '&:hover': { borderColor: '#38BDF8', bgcolor: 'rgba(56, 189, 248, 0.2)' }
                  }}
                >
                  सरकारी जॉब वैकेंसी व रिजल्ट्स
                </Button>

                <Button
                  onClick={() => { setSelectedTrend(null); navigate('/tools'); }}
                  variant="outlined"
                  startIcon={<Build sx={{ fontSize: 18 }} />}
                  sx={{
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    bgcolor: 'rgba(16, 185, 129, 0.08)',
                    color: '#10B981',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 1.3,
                    borderRadius: '14px',
                    '&:hover': { borderColor: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.2)' }
                  }}
                >
                  फ्री स्टूडेंट टूल्स (Photo/PDF)
                </Button>

                <Button
                  onClick={() => { setSelectedTrend(null); navigate('/blog'); }}
                  variant="outlined"
                  startIcon={<Article sx={{ fontSize: 18 }} />}
                  sx={{
                    borderColor: 'rgba(168, 85, 247, 0.3)',
                    bgcolor: 'rgba(168, 85, 247, 0.08)',
                    color: '#A855F7',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    py: 1.3,
                    borderRadius: '14px',
                    '&:hover': { borderColor: '#A855F7', bgcolor: 'rgba(168, 85, 247, 0.2)' }
                  }}
                >
                  कैरियर व टेक ब्लॉग्स
                </Button>
              </Box>

              {/* Verified Editorial Footer */}
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography 
                  variant="caption"
                  sx={{
                    color: '#64748B',
                    fontSize: '0.72rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 13, color: '#38BDF8' }} />
                  Digital Home Editorial Desk द्वारा सत्यापित व संकलित | 100% ऑन-साइट इन-डेप्थ रिपोर्टिंग
                </Typography>
              </Box>
            </Box>

          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
}
