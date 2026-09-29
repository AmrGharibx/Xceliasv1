'use strict';

(() => {
  const STORAGE_PREFIX = 'xcelias.marketToMastery.v1';
  const MAX_BRIEF_PROJECTS = 3;
  const MAX_PROJECTS = 500;
  const MAX_OBSERVATIONS_PER_PROJECT = 100;
  const MAX_BATCHES = 1000;
  const MAX_IMPORT_ROWS = 500;
  const strings = {
    en: {
      workspace: 'WORKSPACE', buyerBriefs: 'Buyer briefs', priceEvidence: 'Price evidence', sourceAccess: 'Source access',
      privateWorkspace: 'On-device workspace', savedInBrowser: 'This browser profile only', portal: 'Portal',
      exportBackup: 'Export backup', importBackup: 'Import backup', fieldDesk: 'FIELD DESK · EGYPT',
      headline: 'Make the price conversation provable.',
      intro: 'Build buyer-ready comparisons from evidence you are allowed to use. Keep launch offers, resale asking prices, and transaction evidence separate.',
      addEvidence: 'Add project evidence', localOnlyTitle: 'Local by design',
      localOnlyText: 'Drafts are keyed to your signed-in account but stored in this browser profile. Other people using this same profile could see them. Avoid shared devices; nothing is uploaded unless you export it.', noLiveFeeds: 'NO LIVE FEEDS CONNECTED',
      savedBriefs: 'SAVED PROJECTS', savedLocally: 'Stored only on this device', priceObservations: 'PRICE OBSERVATIONS', evidenceCount: 'Evidence entries you added',
      permissionGate: 'AUTOMATION GATE', permissionRequired: 'Permission first', permissionCount: 'No source has an approved feed here',
      workingSet: 'YOUR WORKING SET', evidenceTitle: 'Price evidence', projectCount: (n) => `${n} project${n === 1 ? '' : 's'}`,
      buyerFit: 'BUYER FIT', buyerNeeds: 'What matters to them?', buyerPrivacy: 'Keep it non-identifying. No buyer name, phone, income, or contact history belongs in a property brief.',
      areas: 'Preferred areas', areaPlaceholder: 'e.g. New Cairo, Mostakbal City', budgetCeiling: 'Budget ceiling (EGP)', optional: 'Optional',
      propertyType: 'Property type', anyType: 'Any type', apartments: 'Apartment', villas: 'Villa', townhouses: 'Townhouse', commercial: 'Commercial',
      mustHave: 'Must-have / trade-off', prioritiesPlaceholder: 'Delivery timing, payment flexibility, commute…',
      stressReady: 'Deal Stress Test ready', stressDesc: 'Add evidence to surface missing terms, stale dates, and incomparable offers.',
      previewBrief: 'Preview buyer brief', clearDraft: 'Clear workspace', permissionMap: 'PERMISSION MAP',
      sourceAccessTitle: 'Connect sources the right way', developerFeed: 'Developer price books',
      developerFeedDetail: 'Best launch-price source · request a dated feed or approved price sheet', permissionNeeded: 'PERMISSION NEEDED',
      licensedPortals: 'Licensed portal feeds', licensedPortalsDetail: 'Use a contracted API/feed with explicit database and display rights', partnerAccess: 'PARTNER ACCESS',
      resaleEvidence: 'Resale asking prices', resaleDetail: 'Only a permissioned feed; label as asking, never as a completed sale', noFeed: 'NO FEED',
      pfSourceDetail: 'Partner feed only · public terms restrict scraping and property-database reuse',
      nawySourceDetail: 'Written permission needed before any automated collection',
      dubizzleName: 'Dubizzle resale', dubizzleDetail: 'Commercial feed/contract only · show as asking price, not a sale',
      redOfficial: 'RED / official property platform', redOfficialDetail: 'Review data rights; public discovery is not transaction proof', reviewRights: 'RIGHTS REVIEW',
      humanIntake: 'Human-reviewed documents', humanIntakeDetail: 'Enter a price sheet or message only when Xcelias may use it', manual: 'MANUAL',
      sourceFootnote: 'No WhatsApp group monitoring, browser scraping, or listing mirroring. A joined phone number is not permission to harvest messages.',
      footerNote: 'Evidence, not promises. Every price needs a source, capture date, and like-for-like basis.',
      emptyTitle: 'Start with one real source',
      emptyText: 'Add a developer-issued price sheet or an authorized resale-feed observation. We do not seed this desk with guessed or unlicensed prices.', addFirst: 'Add your first evidence',
      newEvidence: 'NEW EVIDENCE', recordOffer: 'Record a price observation',
      formLede: 'Capture exactly what the source says. The app will not combine offers with different unit, phase, or payment terms.',
      projectName: 'Project name', developer: 'Developer / seller', area: 'Area / city', offerKind: 'What kind of price?',
      launchPrice: 'Developer launch / primary offer', resaleAsking: 'Resale asking price', transactionEvidence: 'Completed transaction evidence', rentAsking: 'Rental asking price',
      amount: 'Observed amount (EGP)', capturedDate: 'Captured on', unitType: 'Unit type', areaSize: 'Area (m²)', phase: 'Phase / release', finishing: 'Finishing',
      paymentTerms: 'Payment / delivery terms', sourceName: 'Source name / document reference', sourceUrl: 'Source URL (optional)',
      authorizedConfirm: 'I confirm Xcelias is allowed to use this price fact and source for an internal buyer brief. I have not copied private group messages or unlicensed portal data.',
      cancel: 'Cancel', saveEvidence: 'Save evidence locally', backToDesk: 'Back to desk', printOrPdf: 'Print / Save as PDF',
      evidenceAdded: 'Evidence saved in this browser.', evidenceRemoved: 'Project removed from this browser.', workspaceCleared: 'This browser workspace was cleared.',
      backupExported: 'Backup exported. Keep the file somewhere private.', backupImported: 'Backup imported into this browser.', backupInvalid: 'That backup could not be read. No saved data was changed.',
      invalidHttps: 'Use an HTTPS source link, or leave the URL blank.', noProjectsBrief: 'Add at least one project before previewing a buyer brief.',
      selectForBrief: 'Include in brief', removeProject: 'Remove', addAnother: '＋ Add observation',
      noSourceItems: 'No observations recorded for this project yet.', launchLabel: 'Developer launch', resaleLabel: 'Resale asking', transactionLabel: 'Transaction evidence', rentLabel: 'Rental asking',
      capturedLabel: 'Captured', unitLabel: 'Unit', areaLabel: 'Area', phaseLabel: 'Phase', finishingLabel: 'Finish', termsLabel: 'Terms',
      authorizedLabel: 'Use permission recorded', missingTerms: 'Payment, delivery, or unit-basis details are incomplete. Confirm before comparing.',
      sourceDisagree: 'These observations differ. They are not averaged; check unit, phase, finishing, and payment terms before drawing a conclusion.',
      notComparable: 'Multiple observations are not directly comparable because the offer type or unit/phase basis differs or is missing.',
      singleObservation: 'One source observation is recorded. Confirm current availability and the exact unit quote with the seller.',
      noEvidenceAlert: 'No price evidence is recorded yet.',
      stressWarnings: (n) => `${n} check${n === 1 ? '' : 's'} to resolve before sharing`,
      stressClear: 'Evidence checks passed', stressClearDesc: 'Source, date, and offer details are present. Availability still needs confirmation.',
      briefTitle: 'A clearer way to compare', briefSubtitle: 'A source-led starting point for a real conversation—not a quote or recommendation.',
      prioritiesTitle: 'What you told us matters', budgetLine: 'Budget ceiling', notSet: 'Not specified', noPriorities: 'No additional priorities were recorded.',
      sourceColumn: 'Source / reference', kindColumn: 'Offer type', amountColumn: 'Observed amount', basisColumn: 'Unit / terms',
      buyerCaution: 'These are dated source observations, not a confirmed unit quote, current availability, a completed sale unless explicitly labeled, or investment advice. Ask the developer/seller to reconfirm the exact unit, price, fees, payment schedule, and availability.',
      buyerQuestions: 'Questions to confirm', questionOne: 'Which exact unit, floor, view, finish, and phase does this figure refer to?',
      questionTwo: 'Is this offer still available today, and what fees or conditions are excluded?',
      questionThree: 'Can you provide the current dated price sheet and written payment schedule?',
      sheetDate: 'Prepared', sheetFooter: 'Prepared with Xcelias Market to Mastery · verify every offer directly before making a decision.',
      sharePrivacy: 'This preview is not uploaded. Print to PDF to share it deliberately.',
      areaFit: 'Area fit', budgetFit: 'Budget fit', missingBasis: 'Comparable basis not established', comparable: 'Comparable basis recorded',
      underBudget: 'At or below entered ceiling', aboveBudget: 'Above entered ceiling', unknownBudget: 'No ceiling entered',
      confirmAfter: 'Reconfirm current availability directly.',
      dailyIntakeLabel: 'DAILY PRICE INTAKE',
      dailyIntakeTitle: 'Submit today’s authorized prices',
      dailyIntakeCopy: 'Download the blank CSV, add only price facts Xcelias is permitted to use, then import it here. The file is read on this device and never uploaded.',
      downloadCsvTemplate: 'Download blank CSV', chooseDailyCsv: 'Choose daily CSV',
      csvTemplateReady: 'Blank CSV template downloaded.', csvFileHint: 'Keep the template headers unchanged. Dates use YYYY-MM-DD; amounts are EGP digits without commas. Leave permissionReference blank if needed; never paste private messages.',
      csvPreviewTitle: 'Import preview', csvRowsLabel: 'Rows', csvDuplicatesLabel: 'Duplicates skipped', csvIssuesLabel: 'Issues',
      csvPreviewIssue: 'Fix every issue and choose the CSV again. No rows will be staged while any issue remains.',
      csvNoNewRows: 'There are no new rows to stage.', csvEmpty: 'Choose a CSV to preview it here.',
      csvLine: 'Line', csvProject: 'Project', csvPrice: 'Observed price', csvSource: 'Source', csvResult: 'Import result',
      csvReadyRow: 'Ready', csvDuplicateRow: 'Duplicate · skipped', csvInvalidRow: 'Needs correction',
      importRightsConfirm: 'I confirm Xcelias has permission or a license to use every fact and source. This file was not made by scraping or copied from confidential competitor material or private group chats. This is my responsibility; the app cannot verify legal rights.',
      stageCsvBatch: 'Stage for review', csvBatchStaged: 'Daily CSV staged on this device. It cannot appear in a buyer brief until you review and approve it.',
      pendingBatchesTitle: 'Daily batches awaiting review', noPendingBatches: 'No price batches are waiting for review.',
      pendingReview: 'PENDING REVIEW', batchRowCount: (n) => `${n} price row${n === 1 ? '' : 's'}`,
      reviewBatchConfirm: 'I reviewed each project, amount, date, source, and permission reference in this batch.',
      approveBatch: 'Approve batch', discardBatch: 'Discard batch', batchApproved: 'Batch approved. Its observations can now appear in buyer briefs.',
      batchDiscarded: 'Pending batch discarded and its price rows removed.', batchNeedsReview: 'Review every row and confirm before approving.',
      noApprovedPrices: 'No approved prices are available for this project yet. Pending rows are excluded from buyer briefs.',
      pendingPriceLabel: 'Pending review', approvedPriceLabel: 'Reviewed',
      csvImportFailed: 'The CSV could not be saved in this browser. Nothing from this batch was added. Export a backup or free local storage, then try again.',
      csvCapacity: 'This batch would exceed a local workspace limit. Split it into smaller files or remove older project evidence first.',
      permissionReference: 'Permission reference (optional; no private message text)',
      authError: "We couldn't verify your workspace session. Refresh the portal and try again.",
      authError: "We couldn't verify your workspace session. Refresh the portal and try again.",
    },
    ar: {
      workspace: 'مساحة العمل', buyerBriefs: 'ملخصات المشتري', priceEvidence: 'بيانات الأسعار', sourceAccess: 'صلاحيات المصادر',
      privateWorkspace: 'مساحة على الجهاز', savedInBrowser: 'على ملف المتصفح ده بس', portal: 'البوابة',
      exportBackup: 'تصدير نسخة', importBackup: 'استيراد نسخة', fieldDesk: 'مساحة العمل · مصر',
      headline: 'خلّي كل رقم ليه مصدر واضح.',
      intro: 'جهّز مقارنة للمشتري من بيانات مسموح باستخدامها. افصل سعر الطرح عن طلبات إعادة البيع وعن أدلة البيع الفعلي.',
      addEvidence: 'أضف بيانات مشروع', localOnlyTitle: 'خصوصيتك أولاً',
      localOnlyText: 'المسودات مرتبطة بحسابك لكن محفوظة في ملف المتصفح ده. أي حد بيستخدم نفس الملف ممكن يشوفها. بلاش جهاز مشترك؛ مفيش رفع إلا لو صدّرت البيانات بنفسك.', noLiveFeeds: 'مفيش مصادر مباشرة متوصلة',
      savedBriefs: 'المشاريع المحفوظة', savedLocally: 'على الجهاز ده بس', priceObservations: 'ملاحظات الأسعار', evidenceCount: 'البيانات اللي ضفتها',
      permissionGate: 'تشغيل المصادر', permissionRequired: 'لازم إذن الأول', permissionCount: 'مفيش مصدر عنده ربط معتمد هنا',
      workingSet: 'مساحة شغلك', evidenceTitle: 'بيانات الأسعار', projectCount: (n) => `${n} مشروع`,
      buyerFit: 'مناسب للمشتري', buyerNeeds: 'إيه اللي يهمّه؟', buyerPrivacy: 'بلاش بيانات شخصية. الملخص مايحطّش اسم المشتري أو رقمه أو دخله أو سجل كلامه.',
      areas: 'المناطق المفضلة', areaPlaceholder: 'مثلاً: القاهرة الجديدة، المستقبل سيتي', budgetCeiling: 'أقصى ميزانية (جنيه)', optional: 'اختياري',
      propertyType: 'نوع الوحدة', anyType: 'أي نوع', apartments: 'شقة', villas: 'فيلا', townhouses: 'تاون هاوس', commercial: 'تجاري',
      mustHave: 'أولوية أو تنازل ممكن', prioritiesPlaceholder: 'ميعاد الاستلام، مرونة السداد، المشوار…',
      stressReady: 'اختبار الصفقة جاهز', stressDesc: 'ضيف البيانات عشان نطلع الشروط الناقصة والتواريخ القديمة والعروض اللي مينفعش تتقارن.',
      previewBrief: 'معاينة ملخص المشتري', clearDraft: 'مسح مساحة العمل', permissionMap: 'خريطة الصلاحيات',
      sourceAccessTitle: 'وصّل المصادر بشكل سليم', developerFeed: 'قوائم أسعار المطورين',
      developerFeedDetail: 'أفضل مصدر لسعر الطرح · اطلب ملف مؤرخ أو ربط معتمد', permissionNeeded: 'محتاجين إذن',
      licensedPortals: 'مصادر عقارية بترخيص', licensedPortalsDetail: 'استخدم API أو ملف تعاقدي بحقوق واضحة للعرض وتخزين البيانات', partnerAccess: 'صلاحية شريك',
      resaleEvidence: 'طلبات إعادة البيع', resaleDetail: 'من خلال مصدر مسموح بس؛ ده سعر طلب مش سعر بيع نهائي', noFeed: 'مفيش ربط',
      pfSourceDetail: 'من خلال ربط شريك بس · الشروط العامة بتمنع السحب الآلي وبناء قاعدة بيانات بدون إذن',
      nawySourceDetail: 'لازم إذن مكتوب قبل أي جمع آلي للبيانات',
      dubizzleName: 'دوبيزل لإعادة البيع', dubizzleDetail: 'من خلال عقد أو ملف تجاري بس · يتعرض كسعر طلب مش سعر بيع',
      redOfficial: 'RED / المنصة العقارية الرسمية', redOfficialDetail: 'راجع حقوق البيانات؛ ظهور المشروع مش إثبات بيع', reviewRights: 'مراجعة الحقوق',
      humanIntake: 'مستندات بمراجعة بشرية', humanIntakeDetail: 'سجّل قائمة أسعار أو رسالة بس لما يكون مسموح لـ Xcelias يستخدمها', manual: 'يدوي',
      sourceFootnote: 'مفيش متابعة لجروبات واتساب أو سحب آلي أو نسخ لإعلانات. وجود رقم في جروب مش معناه إن من حقنا نجمع الرسائل.',
      footerNote: 'دليل مش وعود. كل سعر محتاج مصدر وتاريخ تسجيل وأساس مقارنة مماثل.',
      emptyTitle: 'ابدأ بمصدر حقيقي واحد',
      emptyText: 'أضف قائمة أسعار صادرة من المطور أو ملاحظة من مصدر إعادة بيع مسموح. مش هنحط أسعار متخيلة أو من غير تصريح.', addFirst: 'أضف أول معلومة',
      newEvidence: 'معلومة جديدة', recordOffer: 'سجّل ملاحظة سعر',
      formLede: 'سجّل اللي المصدر كاتبه زي ما هو. التطبيق مش هيجمع عروض بوحدات أو مراحل أو شروط سداد مختلفة.',
      projectName: 'اسم المشروع', developer: 'المطور / البائع', area: 'المنطقة / المدينة', offerKind: 'نوع السعر',
      launchPrice: 'طرح مطور / سعر أساسي', resaleAsking: 'سعر طلب إعادة بيع', transactionEvidence: 'دليل على بيع مكتمل', rentAsking: 'سعر طلب إيجار',
      amount: 'السعر المرصود (جنيه)', capturedDate: 'تاريخ التسجيل', unitType: 'نوع الوحدة', areaSize: 'المساحة (م²)', phase: 'المرحلة / الطرح', finishing: 'التشطيب',
      paymentTerms: 'شروط السداد / الاستلام', sourceName: 'اسم المصدر / مرجع المستند', sourceUrl: 'رابط المصدر (اختياري)',
      authorizedConfirm: 'بأكد إن مسموح لـ Xcelias يستخدم السعر والمصدر في ملخص داخلي للمشتري. ما نسختش رسائل خاصة من جروب أو بيانات من موقع بدون ترخيص.',
      cancel: 'إلغاء', saveEvidence: 'احفظ على المتصفح', backToDesk: 'رجوع للمكتب', printOrPdf: 'طباعة / حفظ PDF',
      evidenceAdded: 'اتحفظت المعلومة على المتصفح ده.', evidenceRemoved: 'اتمسح المشروع من المتصفح ده.', workspaceCleared: 'اتمسحت مساحة العمل من المتصفح ده.',
      backupExported: 'اتصدّرت نسخة احتياطية. احتفظ بيها في مكان خاص.', backupImported: 'تم استيراد النسخة للمتصفح ده.', backupInvalid: 'مش قادرين نقرأ النسخة دي. البيانات المحفوظة ما اتغيرتش.',
      invalidHttps: 'استخدم رابط HTTPS أو سيب خانة الرابط فاضية.', noProjectsBrief: 'ضيف مشروع واحد على الأقل قبل معاينة الملخص.',
      selectForBrief: 'أضفه للملخص', removeProject: 'إزالة', addAnother: '＋ أضف ملاحظة سعر',
      noSourceItems: 'لسه مفيش أسعار متسجلة للمشروع ده.', launchLabel: 'طرح المطور', resaleLabel: 'طلب إعادة بيع', transactionLabel: 'دليل بيع مكتمل', rentLabel: 'طلب إيجار',
      capturedLabel: 'اتسجل يوم', unitLabel: 'الوحدة', areaLabel: 'المساحة', phaseLabel: 'المرحلة', finishingLabel: 'التشطيب', termsLabel: 'الشروط',
      authorizedLabel: 'صلاحية الاستخدام متسجلة', missingTerms: 'تفاصيل السداد أو الاستلام أو أساس الوحدة ناقصة. راجعها قبل المقارنة.',
      sourceDisagree: 'الأسعار مختلفة. مش بناخد متوسط؛ راجع الوحدة والمرحلة والتشطيب وشروط السداد قبل ما تستنتج.',
      notComparable: 'الملاحظات مش قابلة للمقارنة المباشرة لاختلاف أو نقص نوع العرض أو الوحدة أو المرحلة.',
      singleObservation: 'فيه ملاحظة سعر واحدة. أكد التوافر الحالي وسعر الوحدة المحددة مع البائع.',
      noEvidenceAlert: 'لسه مفيش أسعار مسجلة.', stressWarnings: (n) => `${n} نقطة لازم تتراجع قبل المشاركة`,
      stressClear: 'مراجعة البيانات اكتملت', stressClearDesc: 'المصدر والتاريخ والتفاصيل موجودة. لازم تتأكد إن الوحدة لسه متاحة.',
      briefTitle: 'مقارنة أوضح', briefSubtitle: 'بداية لحوار مبني على مصدر—مش عرض سعر ولا ترشيح.',
      prioritiesTitle: 'إيه اللي يهمك؟', budgetLine: 'أقصى ميزانية', notSet: 'مش محددة', noPriorities: 'مفيش أولويات إضافية متسجلة.',
      sourceColumn: 'المصدر / المرجع', kindColumn: 'نوع العرض', amountColumn: 'السعر المرصود', basisColumn: 'الوحدة / الشروط',
      buyerCaution: 'دي أسعار مرصودة من مصادر في تواريخها، مش عرض سعر لوحدة مؤكدة ولا تأكيد توافر. سعر إعادة البيع مش معناه إن الصفقة تمت، إلا لو متسجل صراحة كدليل بيع مكتمل. اسأل المطور أو البائع عن الوحدة والرسوم وجدول السداد والتوافر الحالي.',
      buyerQuestions: 'أسئلة مهم تتأكد منها', questionOne: 'السعر ده خاص بأنهي وحدة ودور وإطلالة وتشطيب ومرحلة؟',
      questionTwo: 'العرض لسه متاح النهارده؟ وإيه الرسوم أو الشروط اللي مش داخلة فيه؟',
      questionThree: 'ممكن تبعت قائمة الأسعار المؤرخة الحالية وجدول السداد مكتوب؟',
      sheetDate: 'اتجهز يوم', sheetFooter: 'اتجهز باستخدام Xcelias Market to Mastery · راجع كل عرض مباشرة قبل القرار.',
      sharePrivacy: 'المعاينة دي مش مرفوعة. اطبعها PDF وشاركها بنفسك.',
      areaFit: 'المنطقة', budgetFit: 'الميزانية', missingBasis: 'أساس المقارنة مش مكتمل', comparable: 'أساس المقارنة متسجل',
      underBudget: 'في حدود الميزانية المدخلة', aboveBudget: 'أعلى من الحد المدخل', unknownBudget: 'الميزانية مش محددة', confirmAfter: 'أكد التوافر الحالي مباشرة.', dailyIntakeLabel: 'تسجيل أسعار اليوم',
      dailyIntakeTitle: 'سجّل أسعار النهارده المسموح باستخدامها',
      dailyIntakeCopy: 'نزّل ملف CSV الفاضي، وسجّل فيه بس الأسعار اللي مسموح لـ Xcelias تستخدمها، وبعدها استورده هنا. الملف بيتقري على الجهاز ومش بيرتفع.',
      downloadCsvTemplate: 'تنزيل قالب CSV', chooseDailyCsv: 'اختيار ملف أسعار اليوم',
      csvTemplateReady: 'قالب CSV الفاضي اتنزّل.', csvFileHint: 'سيب أسماء الأعمدة زي ما هي. التاريخ بالشكل YYYY-MM-DD، والسعر أرقام جنيه من غير فواصل. سيب permissionReference فاضي لو محتاج؛ ما تنسخش رسايل خاصة.',
      csvPreviewTitle: 'معاينة الاستيراد', csvRowsLabel: 'الصفوف', csvDuplicatesLabel: 'مكرر وهنتخطاه', csvIssuesLabel: 'مشاكل',
      csvPreviewIssue: 'صلّح كل المشاكل واختار الملف تاني. مش هنسجّل أي صف لو فيه مشكلة واحدة.',
      csvNoNewRows: 'مفيش صفوف جديدة للتسجيل.', csvEmpty: 'اختار ملف CSV عشان نعرض معاينته هنا.',
      csvLine: 'السطر', csvProject: 'المشروع', csvPrice: 'السعر المرصود', csvSource: 'المصدر', csvResult: 'النتيجة',
      csvReadyRow: 'جاهز', csvDuplicateRow: 'مكرر · هنتخطاه', csvInvalidRow: 'محتاج تعديل',
      importRightsConfirm: 'بأكد إن مع Xcelias إذن أو ترخيص لاستخدام كل معلومة ومصدر. الملف مش معمول بسحب آلي، ومفيهوش معلومات سرية من منافسين أو رسايل خاصة من جروبات. أنا المسؤول عن التأكيد؛ والتطبيق مش بيقدر يتحقق من الصلاحيات القانونية.',
      stageCsvBatch: 'تسجيل للمراجعة', csvBatchStaged: 'ملف الأسعار اتسجل على الجهاز للمراجعة. مش هيظهر في ملخصات المشترين غير بعد مراجعته والموافقة عليه.',
      pendingBatchesTitle: 'ملفات أسعار مستنية المراجعة', noPendingBatches: 'مفيش ملفات أسعار مستنية المراجعة.',
      pendingReview: 'مستني المراجعة', batchRowCount: (n) => `${n} سعر`,
      reviewBatchConfirm: 'راجعت كل مشروع وسعر وتاريخ ومصدر ومرجع صلاحية في الملف ده.',
      approveBatch: 'اعتماد الملف', discardBatch: 'استبعاد الملف', batchApproved: 'الملف اتراجع واتعتمد. الأسعار دلوقتي ممكن تظهر في ملخص المشتري.',
      batchDiscarded: 'الملف اتشال من المراجعة وأسعاره اتمسحت.', batchNeedsReview: 'راجع كل صف وأكد قبل الاعتماد.',
      noApprovedPrices: 'لسه مفيش أسعار معتمدة للمشروع ده. الأسعار اللي مستنية المراجعة مش بتظهر في ملخص المشتري.',
      pendingPriceLabel: 'مستني المراجعة', approvedPriceLabel: 'تمت المراجعة',
      csvImportFailed: 'مش قادرين نحفظ ملف الأسعار على المتصفح. مفيش حاجة من الملف اتضافت. صدّر نسخة احتياطية أو فضّي مساحة وجرب تاني.',
      csvCapacity: 'الملف هيعدّي حد مساحة العمل المحلي. قسّمه لملفات أصغر أو شيل بيانات أقدم الأول.',
      permissionReference: 'مرجع الإذن (اختياري؛ من غير نص رسايل خاصة)',
      authError: 'مش قادرين نتحقق من جلسة الدخول. اعمل تحديث من البوابة وجرب تاني.',
    },
  };

  const byId = (id) => document.getElementById(id);
  let storageKey = '';
  let state = { schemaVersion: 2, projects: [], buyer: {}, batches: [] };
  let language = 'en';
  let toastTimer;
  let importPreview = null;

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (![1, 2].includes(parsed.schemaVersion) || !Array.isArray(parsed.projects)) return { schemaVersion: 2, projects: [], buyer: {}, batches: [] };
      return sanitizeState(parsed);
    } catch {
      return { schemaVersion: 2, projects: [], buyer: {}, batches: [] };
    }
  }

  function sanitizeText(value, max = 500) {
    return String(value ?? '').trim().slice(0, max);
  }

  function sanitizeState(value) {
    const batches = (Array.isArray(value.batches) ? value.batches : []).slice(-MAX_BATCHES).map((batch) => ({
      id: sanitizeText(batch.id, 100),
      status: ['pending', 'approved', 'discarded'].includes(batch.status) ? batch.status : 'discarded',
      submittedAt: sanitizeText(batch.submittedAt, 40),
      approvedAt: sanitizeText(batch.approvedAt, 40),
      discardedAt: sanitizeText(batch.discardedAt, 40),
      rowCount: Math.max(0, Math.min(MAX_IMPORT_ROWS, Math.trunc(Number(batch.rowCount) || 0))),
      createdProjectIds: (Array.isArray(batch.createdProjectIds) ? batch.createdProjectIds : []).slice(0, MAX_PROJECTS).map((id) => sanitizeText(id, 100)).filter(Boolean),
    })).filter((batch) => batch.id);
    const pendingBatchIds = new Set(batches.filter((batch) => batch.status === 'pending').map((batch) => batch.id));
    const projects = value.projects.slice(0, MAX_PROJECTS).map((project) => ({
      id: sanitizeText(project.id, 100) || makeId(),
      name: sanitizeText(project.name, 100),
      developer: sanitizeText(project.developer, 100),
      area: sanitizeText(project.area, 100),
      selected: project.selected !== false,
      observations: (Array.isArray(project.observations) ? project.observations : []).slice(0, MAX_OBSERVATIONS_PER_PROJECT).map((item) => ({
        id: sanitizeText(item.id, 100) || makeId(),
        kind: ['launch', 'resale', 'transaction', 'rent'].includes(item.kind) ? item.kind : 'launch',
        amount: Number(item.amount) > 0 ? Number(item.amount) : 0,
        capturedAt: /^\d{4}-\d{2}-\d{2}$/.test(item.capturedAt) ? item.capturedAt : '',
        unitType: sanitizeText(item.unitType, 80),
        areaSize: Number(item.areaSize) > 0 ? Number(item.areaSize) : null,
        phase: sanitizeText(item.phase, 100),
        finishing: sanitizeText(item.finishing, 80),
        terms: sanitizeText(item.terms, 180),
        sourceName: sanitizeText(item.sourceName, 120),
        sourceUrl: safeHttps(item.sourceUrl) || '',
        permissionReference: sanitizeText(item.permissionReference, 200),
        authorized: item.authorized === true,
        batchId: sanitizeText(item.batchId, 100),
        reviewStatus: item.reviewStatus === 'pending' ? 'pending' : 'approved',
        approvedAt: sanitizeText(item.approvedAt, 40),
      })).filter((item) => item.amount && item.authorized && (item.reviewStatus !== 'pending' || pendingBatchIds.has(item.batchId))),
    })).filter((project) => project.name);
    const buyer = value.buyer && typeof value.buyer === 'object' ? value.buyer : {};
    return {
      schemaVersion: 2,
      projects,
      batches,
      buyer: {
        areas: sanitizeText(buyer.areas, 120),
        budget: Number(buyer.budget) > 0 ? Number(buyer.budget) : '',
        type: ['apartment', 'villa', 'townhouse', 'commercial'].includes(buyer.type) ? buyer.type : '',
        priorities: sanitizeText(buyer.priorities, 280),
      },
    };
  }

  function safeHttps(value) {
    if (!value) return '';
    try {
      const url = new URL(String(value));
    if (url.protocol !== 'https:') return '';
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
    } catch {
      return '';
    }
  }

  function makeId() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function t(key, ...args) {
    const value = strings[language][key] ?? strings.en[key] ?? key;
    return typeof value === 'function' ? value(...args) : value;
  }

  function save() {
    state.projects = state.projects.filter((project) => project.name);
    localStorage.setItem(storageKey, JSON.stringify(state));
    render();
  }

  function commitCandidate(candidate) {
    const clean = sanitizeState(candidate);
    try {
      localStorage.setItem(storageKey, JSON.stringify(clean));
      state = clean;
      render();
      return true;
    } catch {
      return false;
    }
  }

  function approvedObservations(project) {
    return project.observations.filter((item) => item.reviewStatus !== 'pending');
  }

  function amount(value) {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 0 }).format(Number(value));
  }

  function readableDate(value) {
    if (!value) return '—';
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return '—';
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Cairo' }).format(parsed);
  }

  function cairoToday() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const fields = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
    return `${fields.year}-${fields.month}-${fields.day}`;
  }

  function kindLabel(kind) {
    return t(({ launch: 'launchLabel', resale: 'resaleLabel', transaction: 'transactionLabel', rent: 'rentLabel' })[kind] || 'launchLabel');
  }

  function projectComparable(project) {
    const offers = approvedObservations(project);
    if (offers.length < 2) return { comparable: false, different: false };
    const basis = (item) => [item.kind, item.unitType.toLowerCase(), item.areaSize || '', item.phase.toLowerCase(), item.finishing.toLowerCase(), item.terms.toLowerCase()].join('|');
    const complete = offers.every((item) => item.unitType && item.areaSize && item.phase && item.finishing && item.terms);
    const same = complete && offers.every((item) => basis(item) === basis(offers[0]));
    const amounts = offers.map((item) => item.amount);
    const spread = Math.max(...amounts) - Math.min(...amounts);
    return { comparable: same, different: same && spread > Math.max(...amounts) * 0.01 };
  }

  function projectWarnings(project) {
    const offers = approvedObservations(project);
    if (!offers.length) {
      return [{ text: project.observations.some((item) => item.reviewStatus === 'pending') ? t('noApprovedPrices') : t('noEvidenceAlert'), good: false }];
    }
    const messages = [];
    if (offers.length === 1) messages.push({ text: t('singleObservation'), good: false });
    if (offers.some((item) => !item.unitType || !item.areaSize || !item.phase || !item.finishing || !item.terms)) {
      messages.push({ text: t('missingTerms'), good: false });
    }
    if (offers.length > 1) {
      const result = projectComparable(project);
      if (result.different) messages.push({ text: t('sourceDisagree'), good: false });
      else if (!result.comparable) messages.push({ text: t('notComparable'), good: false });
      else messages.push({ text: t('comparable'), good: true });
    }
    return messages;
  }

  function renderObservation(project, item) {
    const details = [];
    if (item.capturedAt) details.push(`<span>${esc(t('capturedLabel'))}: ${esc(readableDate(item.capturedAt))}</span>`);
    if (item.unitType) details.push(`<span>${esc(t('unitLabel'))}: ${esc(item.unitType)}</span>`);
    if (item.areaSize) details.push(`<span>${esc(t('areaLabel'))}: ${esc(amount(item.areaSize))} m²</span>`);
    if (item.phase) details.push(`<span>${esc(t('phaseLabel'))}: ${esc(item.phase)}</span>`);
    if (item.finishing) details.push(`<span>${esc(t('finishingLabel'))}: ${esc(item.finishing)}</span>`);
    if (item.terms) details.push(`<span>${esc(t('termsLabel'))}: ${esc(item.terms)}</span>`);
    if (item.permissionReference) details.push(`<span>${esc(t('permissionReference'))}: ${esc(item.permissionReference)}</span>`);
    const kindClass = ['launch', 'resale', 'transaction', 'rent'].includes(item.kind) ? item.kind : 'launch';
    const link = safeHttps(item.sourceUrl);
    return `<article class="observation">
      <div class="observation-top"><span class="kind-pill kind-pill--${kindClass}">${esc(kindLabel(kindClass))}</span><span class="observation-source">${esc(item.sourceName || '—')}</span><span class="review-tag${item.reviewStatus === 'pending' ? ' review-tag--pending' : ''}">${esc(item.reviewStatus === 'pending' ? t('pendingPriceLabel') : t('approvedPriceLabel'))}</span></div>
      <strong class="observation-amount">EGP ${esc(amount(item.amount))}</strong>
      <div class="observation-detail">${details.join('') || '<span>—</span>'}</div>
      <div class="observation-foot"><span>${esc(t('authorizedLabel'))}</span>${link ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(language === 'ar' ? 'فتح المصدر ↗' : 'Open source ↗')}</a>` : '<span></span>'}</div>
    </article>`;
  }

  function renderProject(project) {
    const meta = [project.developer, project.area].filter(Boolean).map((value) => `<span>${esc(value)}</span>`).join('');
    const selectedCount = state.projects.filter((item) => item.selected).length;
    const canSelect = project.selected || selectedCount < MAX_BRIEF_PROJECTS;
    const observationMarkup = project.observations.length
      ? project.observations.slice().sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)).map((item) => renderObservation(project, item)).join('')
      : `<p class="panel-copy observation-empty">${esc(t('noSourceItems'))}</p>`;
    const warnings = projectWarnings(project).map((warning) => `<div class="project-alert${warning.good ? ' project-alert--good' : ''}"><span aria-hidden="true">${warning.good ? '✓' : '!'}</span><span>${esc(warning.text)}</span></div>`).join('');
    return `<article class="project-card" data-project-id="${esc(project.id)}">
      <header class="project-card-head"><div><h3>${esc(project.name)}</h3><div class="project-meta">${meta || `<span>${esc(language === 'ar' ? 'المطور والمنطقة غير محددين' : 'Developer and area not specified')}</span>`}</div></div>
      <div class="project-controls"><button class="mini-button" type="button" data-action="add-observation" data-id="${esc(project.id)}">${esc(t('addAnother'))}</button><button class="mini-button danger" type="button" data-action="remove" data-id="${esc(project.id)}" aria-label="${esc(t('removeProject'))}">${esc(t('removeProject'))}</button></div></header>
      <label class="brief-select"><input type="checkbox" data-action="select" data-id="${esc(project.id)}" ${project.selected ? 'checked' : ''} ${canSelect ? '' : 'disabled'} /><span>${esc(t('selectForBrief'))}</span></label>
      <div class="observation-list">${observationMarkup}</div>${warnings}
    </article>`;
  }

  function renderMetrics() {
    byId('metric-projects').textContent = amount(state.projects.length);
    byId('metric-observations').textContent = amount(state.projects.reduce((sum, project) => sum + project.observations.length, 0));
    byId('project-count').textContent = t('projectCount', state.projects.length);
  }

  function renderStressTest() {
    const observations = state.projects.flatMap((project) => approvedObservations(project));
    const checks = new Set();
    if (state.batches.some((batch) => batch.status === 'pending')) checks.add('pending');
    if (observations.some((item) => !item.sourceName)) checks.add('source');
    if (observations.some((item) => !item.capturedAt)) checks.add('date');
    if (observations.some((item) => !item.unitType || !item.areaSize || !item.phase || !item.finishing || !item.terms)) checks.add('basis');
    state.projects.filter((project) => project.observations.length > 1).forEach((project) => {
      if (!projectComparable(project).comparable) checks.add('compare');
      if (projectComparable(project).different) checks.add('difference');
    });
    const result = byId('stress-test');
    const symbol = result.querySelector('.stress-symbol');
    const title = result.querySelector('strong');
    const description = result.querySelector('small');
    symbol.className = `stress-symbol${checks.size > 2 ? ' alert' : checks.size ? ' warn' : ''}`;
    symbol.textContent = checks.size ? '!' : '✓';
    title.textContent = checks.size ? t('stressWarnings', checks.size) : t('stressClear');
    description.textContent = checks.size ? t('notComparable') : t('stressClearDesc');
  }

  function render() {
    renderMetrics();
    const hasProjects = state.projects.length > 0;
    byId('empty-state').hidden = hasProjects;
    byId('project-list').innerHTML = state.projects.map(renderProject).join('');
    byId('preview-brief').disabled = !state.projects.some((project) => project.selected);
    byId('clear-workspace').hidden = !hasProjects && !state.buyer.areas && !state.buyer.budget && !state.buyer.priorities;
    renderStressTest();
    renderPendingBatches();
    renderImportPreview();
  }

  function syncBuyerInputs() {
    state.buyer.areas = byId('buyer-areas').value.trim();
    state.buyer.budget = Number(byId('buyer-budget').value) > 0 ? Number(byId('buyer-budget').value) : '';
    state.buyer.type = byId('buyer-type').value;
    state.buyer.priorities = byId('buyer-priorities').value.trim();
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function projectIdentity(name, developer) {
    return [name, developer].map((value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')).join('|');
  }

  function renderImportPreview() {
    const preview = byId('daily-import-preview');
    if (!importPreview) {
      preview.hidden = true;
      return;
    }
    preview.hidden = false;
    const duplicates = new Set(importPreview.duplicateLines);
    const rows = importPreview.rows.map((row) => {
      const duplicate = duplicates.has(row.csvLine);
      return `<tr><td>${esc(row.csvLine)}</td><td>${esc(row.project)}</td><td>${esc(kindLabel(row.kind))}</td><td>EGP ${esc(amount(row.amount))}</td><td>${esc(row.capturedAt)}</td><td>${esc(row.sourceName)}</td><td><span class="import-row-status${duplicate ? ' import-row-status--duplicate' : ''}">${esc(duplicate ? t('csvDuplicateRow') : t('csvReadyRow'))}</span></td></tr>`;
    }).join('');
    const errors = importPreview.errors.map((error) => `<li>${esc(t('csvLine'))} ${esc(error.line)}: ${esc(error.message)}</li>`).join('');
    const issueCount = importPreview.errors.length;
    const canStage = !issueCount && importPreview.stageRows.length > 0;
    byId('daily-import-summary').innerHTML = `<span>${esc(t('csvRowsLabel'))}: <strong>${amount(importPreview.rows.length)}</strong></span><span>${esc(t('csvDuplicatesLabel'))}: <strong>${amount(importPreview.duplicateLines.length)}</strong></span><span>${esc(t('csvIssuesLabel'))}: <strong>${amount(issueCount)}</strong></span>`;
    byId('daily-import-errors').innerHTML = issueCount ? `<p>${esc(t('csvPreviewIssue'))}</p><ul>${errors}</ul>` : !importPreview.stageRows.length ? `<p>${esc(t('csvNoNewRows'))}</p>` : '';
    byId('daily-import-errors').hidden = !issueCount && importPreview.stageRows.length > 0;
    byId('daily-import-rows').innerHTML = rows;
    byId('import-rights-confirmation').checked = importPreview.confirmed;
    byId('stage-import').disabled = !canStage || !importPreview.confirmed;
  }

  function pendingBatchRows(batchId) {
    return state.projects.flatMap((project) => project.observations
      .filter((item) => item.batchId === batchId && item.reviewStatus === 'pending')
      .map((item) => ({ project, item })));
  }

  function renderPendingBatches() {
    const pending = state.batches.filter((batch) => batch.status === 'pending');
    byId('pending-batches').hidden = pending.length === 0;
    byId('pending-batch-list').innerHTML = pending.map((batch) => {
      const rows = pendingBatchRows(batch.id);
      const table = rows.map(({ project, item }) => {
        const sourceUrl = safeHttps(item.sourceUrl);
        const source = sourceUrl ? `<a href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(item.sourceName)} ↗</a>` : esc(item.sourceName);
        const basis = [item.unitType, item.areaSize ? `${amount(item.areaSize)} m²` : '', item.phase, item.finishing, item.terms].filter(Boolean).map(esc).join(' · ') || '—';
        return `<tr><td>${esc(project.name)}<small>${esc([project.developer, project.area].filter(Boolean).join(' · '))}</small></td><td>${esc(kindLabel(item.kind))}</td><td>EGP ${esc(amount(item.amount))}<small>${esc(readableDate(item.capturedAt))}</small></td><td>${source}<small>${basis}</small></td><td>${esc(item.permissionReference || '—')}</td></tr>`;
      }).join('');
      const date = readableDate(batch.submittedAt.slice(0, 10));
      return `<article class="pending-batch" data-batch-id="${esc(batch.id)}"><header class="pending-batch-head"><div><span class="status-tag status-tag--pending">${esc(t('pendingReview'))}</span><strong>${esc(t('batchRowCount', rows.length))}</strong><small>${esc(date)}</small></div><button class="mini-button danger" type="button" data-batch-action="discard" data-id="${esc(batch.id)}">${esc(t('discardBatch'))}</button></header>
        <div class="batch-table-wrap"><table class="batch-table"><thead><tr><th>${esc(t('csvProject'))}</th><th>${esc(t('kindColumn'))}</th><th>${esc(t('csvPrice'))}</th><th>${esc(t('csvSource'))} / ${esc(t('basisColumn'))}</th><th>${esc(t('permissionReference'))}</th></tr></thead><tbody>${table}</tbody></table></div>
        <div class="batch-review-actions"><label class="permission-check"><input type="checkbox" data-batch-review="${esc(batch.id)}" /><span>${esc(t('reviewBatchConfirm'))}</span></label><button class="primary-button" type="button" data-batch-action="approve" data-id="${esc(batch.id)}" disabled>${esc(t('approveBatch'))}</button></div></article>`;
    }).join('') || `<p class="panel-copy">${esc(t('noPendingBatches'))}</p>`;
  }

  function showToast(message) {
    const toast = byId('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
  }

  function openEvidence(project) {
    const form = byId('evidence-form');
    form.reset();
    form.elements.capturedAt.value = cairoToday();
    if (project) {
      form.elements.project.value = project.name;
      form.elements.developer.value = project.developer;
      form.elements.area.value = project.area;
      form.elements.project.readOnly = true;
    } else {
      form.elements.project.readOnly = false;
    }
    byId('form-error').hidden = true;
    byId('evidence-dialog').showModal();
    form.elements.amount.focus();
  }

  function saveEvidence(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const sourceUrlInput = sanitizeText(fields.get('sourceUrl'), 500);
    if (sourceUrlInput && !safeHttps(sourceUrlInput)) {
      byId('form-error').textContent = t('invalidHttps');
      byId('form-error').hidden = false;
      return;
    }
    const name = sanitizeText(fields.get('project'), 100);
    const developer = sanitizeText(fields.get('developer'), 100);
    const area = sanitizeText(fields.get('area'), 100);
    let project = state.projects.find((item) => item.name.toLowerCase() === name.toLowerCase() && item.developer.toLowerCase() === developer.toLowerCase());
    if (!project) {
      project = { id: makeId(), name, developer, area, selected: state.projects.filter((item) => item.selected).length < MAX_BRIEF_PROJECTS, observations: [] };
      state.projects.unshift(project);
    } else if (!project.area && area) {
      project.area = area;
    }
    project.observations.push({
      id: makeId(),
      kind: sanitizeText(fields.get('kind'), 20),
      amount: Number(fields.get('amount')),
      capturedAt: sanitizeText(fields.get('capturedAt'), 10),
      unitType: sanitizeText(fields.get('unitType'), 80),
      areaSize: Number(fields.get('areaSize')) > 0 ? Number(fields.get('areaSize')) : null,
      phase: sanitizeText(fields.get('phase'), 100),
      finishing: sanitizeText(fields.get('finishing'), 80),
      terms: sanitizeText(fields.get('terms'), 180),
      sourceName: sanitizeText(fields.get('sourceName'), 120),
      sourceUrl: safeHttps(sourceUrlInput),
      permissionReference: sanitizeText(fields.get('permissionReference'), 200),
      authorized: fields.get('authorized') === 'on',
      reviewStatus: 'approved',
      approvedAt: new Date().toISOString(),
    });
    save();
    byId('evidence-dialog').close();
    showToast(t('evidenceAdded'));
  }

  function briefProjectMarkup(project) {
    const meta = [project.developer, project.area].filter(Boolean).map(esc).join(' · ');
    const observations = approvedObservations(project);
    const rows = observations.slice().sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)).map((item) => {
      const unitDetails = [item.unitType, item.areaSize ? `${amount(item.areaSize)} m²` : '', item.phase, item.finishing].filter(Boolean).map(esc).join(' · ');
      const terms = item.terms ? esc(item.terms) : esc(t('missingBasis'));
      const link = safeHttps(item.sourceUrl);
      const source = link ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(item.sourceName)} ↗</a>` : esc(item.sourceName);
      const permission = item.permissionReference ? `<br /><small>${esc(t('permissionReference'))}: ${esc(item.permissionReference)}</small>` : '';
      return `<tr><td>${source}<br /><small>${esc(t('capturedLabel'))}: ${esc(readableDate(item.capturedAt))}</small></td><td>${esc(kindLabel(item.kind))}</td><td>EGP ${esc(amount(item.amount))}</td><td>${unitDetails || '—'}<br /><small>${terms}</small>${permission}</td></tr>`;
    }).join('');
    const warnings = projectWarnings(project).filter((warning) => !warning.good);
    const warningMarkup = warnings.map((warning) => `<p class="sheet-caution">${esc(warning.text)}</p>`).join('');
    return `<section class="sheet-project"><header class="sheet-project-head"><h3>${esc(project.name)}</h3><div class="project-meta">${meta || '—'}</div></header>
      ${observations.length ? `<table class="sheet-prices"><thead><tr><th>${esc(t('sourceColumn'))}</th><th>${esc(t('kindColumn'))}</th><th>${esc(t('amountColumn'))}</th><th>${esc(t('basisColumn'))}</th></tr></thead><tbody>${rows}</tbody></table>` : `<p class="sheet-caution">${esc(project.observations.length ? t('noApprovedPrices') : t('noSourceItems'))}</p>`}${warningMarkup}</section>`;
  }

  function previewBrief() {
    syncBuyerInputs();
    const projects = state.projects.filter((project) => project.selected).slice(0, MAX_BRIEF_PROJECTS);
    if (!projects.length) {
      showToast(t('noProjectsBrief'));
      return;
    }
    const buyer = state.buyer;
    const now = readableDate(cairoToday());
    const priorities = [buyer.areas && `${esc(t('areas'))}: ${esc(buyer.areas)}`, buyer.type && `${esc(t('propertyType'))}: ${esc(t(({ apartment: 'apartments', villa: 'villas', townhouse: 'townhouses', commercial: 'commercial' })[buyer.type]))}`, buyer.budget && `${esc(t('budgetLine'))}: EGP ${esc(amount(buyer.budget))}`, buyer.priorities && esc(buyer.priorities)].filter(Boolean);
    const priorityContent = priorities.length ? priorities.join('<br />') : esc(t('noPriorities'));
    const title = language === 'ar' ? 'ملخص مقارنة عقارية' : 'Property comparison brief';
    const questions = [t('questionOne'), t('questionTwo'), t('questionThree')].map((question) => `<li>${esc(question)}</li>`).join('');
    byId('buyer-sheet').innerHTML = `<div class="sheet-brand"><strong>XCELIAS · MARKET TO MASTERY</strong><span>${esc(t('sheetDate'))}: ${esc(now)}</span></div>
      <h2 id="brief-title">${esc(title)}</h2><p class="sheet-subtitle">${esc(t('briefSubtitle'))}</p>
      <div class="sheet-buyer-needs"><strong>${esc(t('prioritiesTitle'))}</strong><br />${priorityContent}</div>
      ${projects.map(briefProjectMarkup).join('')}
      <p class="sheet-caution">${esc(t('buyerCaution'))}</p>
      <section class="sheet-questions"><h3>${esc(t('buyerQuestions'))}</h3><ul>${questions}</ul></section>
      <footer class="sheet-footer"><span>${esc(t('sheetFooter'))}</span><span>${esc(t('sharePrivacy'))}</span></footer>`;
    const dialog = byId('brief-dialog');
    if (!dialog.open) dialog.showModal();
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `xcelias-market-to-mastery-${cairoToday()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast(t('backupExported'));
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('size');
      const parsed = JSON.parse(await file.text());
      if (![1, 2].includes(parsed.schemaVersion) || !Array.isArray(parsed.projects)) throw new Error('schema');
      const clean = sanitizeState(parsed);
      state.projects = clean.projects;
      state.buyer = clean.buyer;
      state.batches = clean.batches;
      save();
      showToast(t('backupImported'));
    } catch {
      showToast(t('backupInvalid'));
    } finally {
      event.target.value = '';
    }
  }

  function downloadCsvTemplate() {
    const blob = new Blob([window.MarketPriceCsv.csvTemplate()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `xcelias-daily-price-template-${cairoToday()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast(t('csvTemplateReady'));
  }

  function collectObservationKeys(projects) {
    return new Set(projects.flatMap((project) => project.observations.map((item) => window.MarketPriceCsv.duplicateKey({
      ...item,
      project: project.name,
      developer: project.developer,
    }))));
  }

  async function previewDailyCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    importPreview = null;
    if (file.size > window.MarketPriceCsv.MAX_FILE_BYTES) {
      importPreview = { rows: [], errors: [{ line: 1, message: 'The CSV is too large. Maximum file size is 1 MiB.' }], duplicateLines: [], stageRows: [], confirmed: false };
      renderImportPreview();
      event.target.value = '';
      return;
    }
    try {
      const parsed = window.MarketPriceCsv.parseDailyPriceCsv(await file.text(), { today: cairoToday() });
      const errors = [...parsed.errors];
      const existingKeys = collectObservationKeys(state.projects);
      const duplicateLines = [];
      const stageRows = [];
      const projectCounts = new Map(state.projects.map((project) => [projectIdentity(project.name, project.developer), project.observations.length]));
      let projectCount = state.projects.length;
      parsed.rows.forEach((row) => {
        const key = window.MarketPriceCsv.duplicateKey(row);
        if (existingKeys.has(key)) {
          duplicateLines.push(row.csvLine);
          return;
        }
        existingKeys.add(key);
        const identity = projectIdentity(row.project, row.developer);
        if (!projectCounts.has(identity)) {
          if (projectCount >= MAX_PROJECTS) {
            errors.push({ line: row.csvLine, message: t('csvCapacity') });
            return;
          }
          projectCounts.set(identity, 0);
          projectCount += 1;
        }
        if (projectCounts.get(identity) >= MAX_OBSERVATIONS_PER_PROJECT) {
          errors.push({ line: row.csvLine, message: t('csvCapacity') });
          return;
        }
        projectCounts.set(identity, projectCounts.get(identity) + 1);
        stageRows.push(row);
      });
      importPreview = { rows: parsed.rows, errors, duplicateLines, stageRows, confirmed: false };
    } catch {
      importPreview = { rows: [], errors: [{ line: 1, message: 'The CSV could not be read. Use the blank template and UTF-8 text.' }], duplicateLines: [], stageRows: [], confirmed: false };
    }
    renderImportPreview();
    byId('daily-import-preview').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    event.target.value = '';
  }

  function stageDailyCsv() {
    if (!importPreview || importPreview.errors.length || !importPreview.stageRows.length || !importPreview.confirmed) return;
    const candidate = sanitizeState(state);
    const batchId = makeId();
    const createdProjectIds = [];
    const existingKeys = collectObservationKeys(candidate.projects);
    const acceptedRows = importPreview.stageRows.filter((row) => {
      const key = window.MarketPriceCsv.duplicateKey(row);
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });
    if (!acceptedRows.length) {
      importPreview = null;
      render();
      showToast(t('csvNoNewRows'));
      return;
    }
    acceptedRows.forEach((row) => {
      const identity = projectIdentity(row.project, row.developer);
      let project = candidate.projects.find((item) => projectIdentity(item.name, item.developer) === identity);
      if (!project) {
        project = { id: makeId(), name: row.project, developer: row.developer, area: row.area, selected: candidate.projects.filter((item) => item.selected).length < MAX_BRIEF_PROJECTS, observations: [] };
        candidate.projects.unshift(project);
        createdProjectIds.push(project.id);
      } else if (!project.area && row.area) {
        project.area = row.area;
      }
      project.observations.push({
        id: makeId(),
        kind: row.kind,
        amount: row.amount,
        capturedAt: row.capturedAt,
        unitType: row.unitType,
        areaSize: row.areaSize,
        phase: row.phase,
        finishing: row.finishing,
        terms: row.terms,
        sourceName: row.sourceName,
        sourceUrl: safeHttps(row.sourceUrl),
        permissionReference: row.permissionReference,
        authorized: true,
        batchId,
        reviewStatus: 'pending',
      });
    });
    candidate.batches.push({ id: batchId, status: 'pending', submittedAt: new Date().toISOString(), approvedAt: '', discardedAt: '', rowCount: acceptedRows.length, createdProjectIds });
    if (!commitCandidate(candidate)) {
      showToast(t('csvImportFailed'));
      return;
    }
    importPreview = null;
    byId('daily-csv-file').value = '';
    render();
    showToast(t('csvBatchStaged'));
  }

  function approveDailyBatch(batchId) {
    const checkbox = Array.from(byId('pending-batch-list').querySelectorAll('[data-batch-review]')).find((item) => item.dataset.batchReview === batchId);
    const batch = state.batches.find((item) => item.id === batchId && item.status === 'pending');
    if (!batch || !checkbox?.checked) {
      showToast(t('batchNeedsReview'));
      return;
    }
    const approvedAt = new Date().toISOString();
    const candidate = sanitizeState(state);
    const candidateBatch = candidate.batches.find((item) => item.id === batchId && item.status === 'pending');
    if (!candidateBatch) return;
    candidateBatch.status = 'approved';
    candidateBatch.approvedAt = approvedAt;
    candidate.projects.forEach((project) => project.observations.forEach((item) => {
      if (item.batchId === batchId) {
        item.reviewStatus = 'approved';
        item.approvedAt = approvedAt;
      }
    }));
    if (!commitCandidate(candidate)) {
      showToast(t('csvImportFailed'));
      return;
    }
    showToast(t('batchApproved'));
  }

  function discardDailyBatch(batchId) {
    if (!window.confirm(language === 'ar' ? 'تستبعد الملف ده وتمسح الأسعار اللي لسه ما اتعتمدتش؟' : 'Discard this pending batch and permanently remove its unapproved price rows from this browser?')) return;
    const candidate = sanitizeState(state);
    const batch = candidate.batches.find((item) => item.id === batchId && item.status === 'pending');
    if (!batch) return;
    const createdProjectIds = new Set(batch.createdProjectIds);
    candidate.projects.forEach((project) => {
      project.observations = project.observations.filter((item) => item.batchId !== batchId);
    });
    candidate.projects = candidate.projects.filter((project) => project.observations.length || !createdProjectIds.has(project.id));
    batch.status = 'discarded';
    batch.discardedAt = new Date().toISOString();
    if (!commitCandidate(candidate)) {
      showToast(t('csvImportFailed'));
      return;
    }
    showToast(t('batchDiscarded'));
  }

  function setLanguage(next) {
    language = next === 'ar' ? 'ar' : 'en';
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      const value = strings[language][key];
      if (typeof value === 'string') element.textContent = value;
    });
    byId('buyer-areas').placeholder = t('areaPlaceholder');
    byId('buyer-budget').placeholder = t('optional');
    byId('buyer-priorities').placeholder = t('prioritiesPlaceholder');
    byId('evidence-form').elements.permissionReference.placeholder = language === 'ar' ? 'رقم عقد أو مرجع مستند، من غير نص رسالة' : 'Contract or document reference, not message text';
    document.querySelectorAll('[data-language]').forEach((button) => {
      const selected = button.dataset.language === language;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    render();
    if (byId('brief-dialog').open) previewBrief();
  }

  function bindEvents() {
    byId('add-project').addEventListener('click', () => openEvidence(null));
    byId('empty-add').addEventListener('click', () => openEvidence(null));
    byId('close-dialog').addEventListener('click', () => byId('evidence-dialog').close());
    byId('cancel-dialog').addEventListener('click', () => byId('evidence-dialog').close());
    byId('evidence-form').addEventListener('submit', saveEvidence);
    byId('project-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const project = state.projects.find((item) => item.id === button.dataset.id);
      if (!project) return;
      if (button.dataset.action === 'add-observation') openEvidence(project);
      if (button.dataset.action === 'remove') {
        state.projects = state.projects.filter((item) => item.id !== project.id);
        save();
        showToast(t('evidenceRemoved'));
      }
    });
    byId('project-list').addEventListener('change', (event) => {
      const checkbox = event.target.closest('input[data-action="select"]');
      if (!checkbox) return;
      const project = state.projects.find((item) => item.id === checkbox.dataset.id);
      if (!project) return;
      const selectedCount = state.projects.filter((item) => item.selected).length;
      if (checkbox.checked && selectedCount >= MAX_BRIEF_PROJECTS) {
        checkbox.checked = false;
        showToast(language === 'ar' ? 'الحد الأقصى ٣ مشاريع في الملخص.' : `A brief can include up to ${MAX_BRIEF_PROJECTS} projects.`);
        return;
      }
      project.selected = checkbox.checked;
      save();
    });
    byId('download-csv-template').addEventListener('click', downloadCsvTemplate);
    byId('choose-daily-csv').addEventListener('click', () => byId('daily-csv-file').click());
    byId('daily-csv-file').addEventListener('change', previewDailyCsv);
    byId('import-rights-confirmation').addEventListener('change', (event) => {
      if (!importPreview) return;
      importPreview.confirmed = event.currentTarget.checked;
      renderImportPreview();
    });
    byId('stage-import').addEventListener('click', stageDailyCsv);
    byId('pending-batch-list').addEventListener('change', (event) => {
      const checkbox = event.target.closest('[data-batch-review]');
      if (!checkbox) return;
      const batch = checkbox.dataset.batchReview;
      const button = Array.from(byId('pending-batch-list').querySelectorAll('[data-batch-action="approve"]')).find((item) => item.dataset.id === batch);
      if (button) button.disabled = !checkbox.checked;
    });
    byId('pending-batch-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-batch-action]');
      if (!button) return;
      if (button.dataset.batchAction === 'approve') approveDailyBatch(button.dataset.id);
      if (button.dataset.batchAction === 'discard') discardDailyBatch(button.dataset.id);
    });
    ['buyer-areas', 'buyer-budget', 'buyer-type', 'buyer-priorities'].forEach((id) => byId(id).addEventListener('change', syncBuyerInputs));
    ['buyer-areas', 'buyer-budget', 'buyer-priorities'].forEach((id) => byId(id).addEventListener('input', syncBuyerInputs));
    byId('preview-brief').addEventListener('click', previewBrief);
    byId('close-brief').addEventListener('click', () => byId('brief-dialog').close());
    byId('print-brief').addEventListener('click', () => window.print());
    byId('export-data').addEventListener('click', exportBackup);
    byId('import-data').addEventListener('change', importBackup);
    byId('clear-workspace').addEventListener('click', () => {
      if (!window.confirm(language === 'ar' ? 'تمسح كل بيانات مساحة العمل المحفوظة على المتصفح ده؟' : 'Clear all project evidence and buyer criteria saved in this browser?')) return;
      state.projects = [];
      state.buyer = {};
      state.batches = [];
      localStorage.removeItem(storageKey);
      ['buyer-areas', 'buyer-budget', 'buyer-priorities'].forEach((id) => { byId(id).value = ''; });
      byId('buyer-type').value = '';
      render();
      showToast(t('workspaceCleared'));
    });
    document.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.language)));
    document.querySelectorAll('.rail-link').forEach((link) => link.addEventListener('click', () => {
      document.querySelectorAll('.rail-link').forEach((item) => item.classList.toggle('active', item === link));
    }));
    document.querySelectorAll('.modal').forEach((dialog) => dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    }));
  }

  async function init() {
    try {
      const response = await fetch('/api/auth/whoami', { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('session');
      const user = await response.json();
      if (typeof user.uid !== 'string' || !/^[A-Za-z0-9_-]{3,128}$/.test(user.uid)) throw new Error('session');
      storageKey = `${STORAGE_PREFIX}:${user.uid}`;
      state = loadState();
    } catch {
      byId('auth-error').textContent = t('authError');
      byId('auth-error').hidden = false;
      document.querySelectorAll('#add-project, #empty-add, #export-data, #import-data, #preview-brief, #clear-workspace, #download-csv-template, #choose-daily-csv, #daily-csv-file').forEach((element) => { element.disabled = true; });
      return;
    }
    byId('buyer-areas').value = state.buyer.areas || '';
    byId('buyer-budget').value = state.buyer.budget || '';
    byId('buyer-type').value = state.buyer.type || '';
    byId('buyer-priorities').value = state.buyer.priorities || '';
    byId('buyer-areas').placeholder = t('areaPlaceholder');
    byId('buyer-budget').placeholder = t('optional');
    byId('buyer-priorities').placeholder = t('prioritiesPlaceholder');
    byId('evidence-form').elements.permissionReference.placeholder = language === 'ar' ? 'رقم عقد أو مرجع مستند، من غير نص رسالة' : 'Contract or document reference, not message text';
    bindEvents();
    render();
  }

  void init();
})();
