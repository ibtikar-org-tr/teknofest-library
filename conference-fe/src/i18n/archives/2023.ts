import type { ArchiveDictionaries } from '@/i18n/archives/types'

const programAr = [
  { time: '09:00–10:00', title: 'تواصل وترحيب', body: 'افتتاح وتعارف الحضور.' },
  { time: '10:00–11:00', title: 'ما هو التكنوفست؟', body: 'فقرة تعريفية عن المهرجان ومسابقات 2024.' },
  { time: '11:00–13:00', title: 'منصّة النجوم', body: 'تجارب فرق سابقة في فئات تكنوفست المختلفة.' },
  { time: '14:00–15:00', title: 'منصّة النجوم (متابعة)', body: 'استكمال خطابات النجوم.' },
  { time: '15:15–18:00', title: 'مطبخ تكنوفست', body: 'ورش عمل تفاعلية مصغّرة بإشراف ضيوف متمرسين.' },
  { time: '18:15–19:30', title: 'الختام', body: 'نهائيات المطبخ وإطلاق مشاريع جديدة.' },
]

const programEn = [
  { time: '09:00–10:00', title: 'Networking & welcome', body: 'Opening and attendee introductions.' },
  { time: '10:00–11:00', title: 'What is TEKNOFEST?', body: 'Orientation on the festival and 2024 competitions.' },
  { time: '11:00–13:00', title: 'Stars platform', body: 'Past competitors share TEKNOFEST category experiences.' },
  { time: '14:00–15:00', title: 'Stars platform (cont.)', body: 'Continued Stars talks.' },
  { time: '15:15–18:00', title: 'TEKNOFEST Kitchen', body: 'Hands-on mini workshops with experienced guests.' },
  { time: '18:15–19:30', title: 'Closing', body: 'Kitchen finals and new project launches.' },
]

const programTr = [
  { time: '09:00–10:00', title: 'Networking & açılış', body: 'Karşılama ve tanışma.' },
  { time: '10:00–11:00', title: 'TEKNOFEST nedir?', body: 'Festival ve 2024 yarışmalarına giriş.' },
  { time: '11:00–13:00', title: 'Yıldızlar platformu', body: 'Önceki yarışmacıların kategori deneyimleri.' },
  { time: '14:00–15:00', title: 'Yıldızlar (devam)', body: 'Yıldız konuşmalarının devamı.' },
  { time: '15:15–18:00', title: 'TEKNOFEST Mutfağı', body: 'Deneyimli konuklarla etkileşimli mini atölyeler.' },
  { time: '18:15–19:30', title: 'Kapanış', body: 'Mutfak finalleri ve yeni proje duyuruları.' },
]

const speakersAr = [
  { name: 'Braillers', role: 'منصّة النجوم', org: 'Braillers', tags: ['stars'] },
  { name: 'أحمد بسيمة', role: 'منصّة النجوم — سياحة / تقنيات', tags: ['stars'] },
  { name: 'عبد الله مشّو · عبيدة عبد الصمد', role: 'منصّة النجوم — إهـاء', org: 'MERKÜT', tags: ['stars'] },
  { name: 'أحمد عبد العزيز', role: 'منصّة النجوم — درون', org: 'DROGIN', tags: ['stars'] },
  { name: 'عبد الله نور', role: 'منصّة النجوم — هايبرلوب', tags: ['stars'] },
  { name: 'عبد الله دعمش', role: 'منصّة النجوم — ذكاء اصطناعي صحي', org: 'dAIgnosis', tags: ['stars'] },
  { name: 'عبد الله سراجي · إبراهيم عباسي', role: 'منصّة النجوم — تحت الماء', org: 'CASMarine', tags: ['stars'] },
  { name: 'BNRD', role: 'منصّة النجوم', org: 'BNRD', tags: ['stars'] },
  { name: 'عدنان فهد · محمود الهايس', role: 'منصّة النجوم — كوارث', org: 'IKAZ KOT', tags: ['stars'] },
  { name: 'TEAM HOPE', role: 'منصّة النجوم', org: 'TEAM HOPE', tags: ['stars'] },
]

const speakersEn = [
  { name: 'Braillers', role: 'Stars platform', org: 'Braillers', tags: ['stars'] },
  { name: 'Ahmad Basima', role: 'Stars — tourism / tech', tags: ['stars'] },
  { name: 'Abdullah Masho · Ubaida Abdulsamad', role: 'Stars — UAV', org: 'MERKÜT', tags: ['stars'] },
  { name: 'Ahmad Abdulaziz', role: 'Stars — drone', org: 'DROGIN', tags: ['stars'] },
  { name: 'Abdullah Nour', role: 'Stars — hyperloop', tags: ['stars'] },
  { name: 'Abdullah Daamash', role: 'Stars — AI in health', org: 'dAIgnosis', tags: ['stars'] },
  { name: 'Abdullah Seraji · Ibrahim Abbasi', role: 'Stars — underwater', org: 'CASMarine', tags: ['stars'] },
  { name: 'BNRD', role: 'Stars platform', org: 'BNRD', tags: ['stars'] },
  { name: 'Adnan Fahd · Mahmoud Al-Hayes', role: 'Stars — disaster response', org: 'IKAZ KOT', tags: ['stars'] },
  { name: 'TEAM HOPE', role: 'Stars platform', org: 'TEAM HOPE', tags: ['stars'] },
]

const speakersTr = [
  { name: 'Braillers', role: 'Yıldızlar platformu', org: 'Braillers', tags: ['stars'] },
  { name: 'Ahmed Besime', role: 'Yıldızlar — turizm / teknoloji', tags: ['stars'] },
  { name: 'Abdullah Maşo · Ubeyde Abdüssamed', role: 'Yıldızlar — İHA', org: 'MERKÜT', tags: ['stars'] },
  { name: 'Ahmed Abdülaziz', role: 'Yıldızlar — drone', org: 'DROGIN', tags: ['stars'] },
  { name: 'Abdullah Nur', role: 'Yıldızlar — hyperloop', tags: ['stars'] },
  { name: 'Abdullah Damaş', role: 'Yıldızlar — sağlıkta YZ', org: 'dAIgnosis', tags: ['stars'] },
  { name: 'Abdullah Seraci · İbrahim Abbasi', role: 'Yıldızlar — su altı', org: 'CASMarine', tags: ['stars'] },
  { name: 'BNRD', role: 'Yıldızlar platformu', org: 'BNRD', tags: ['stars'] },
  { name: 'Adnan Fehd · Mahmud El-Hayes', role: 'Yıldızlar — afet', org: 'IKAZ KOT', tags: ['stars'] },
  { name: 'TEAM HOPE', role: 'Yıldızlar platformu', org: 'TEAM HOPE', tags: ['stars'] },
]

const highlightsAr = [
  { title: 'التعريف بالتكنوفست', desc: 'مقدمة عن المهرجان وكيف يبدأ الطالب رحلته في المسابقات.', tags: ['intro'] },
  { title: 'منصّة النجوم', desc: 'تجارب فرق Braillers و dAIgnosis و CASMarine و DROGIN وغيرها.', tags: ['stars'] },
  { title: 'مطبخ تكنوفست', desc: 'ورشة عملية مصغّرة تحاكي روح المسابقات تحت إشراف ضيوف.', tags: ['kitchen'] },
  { title: 'الفقرة الختامية', desc: 'نهائيات المطبخ وإطلاق برامج تجمّع ابتكار.', tags: ['closing'] },
]

const highlightsEn = [
  { title: 'TEKNOFEST orientation', desc: 'An introduction to the festival and how students start competing.', tags: ['intro'] },
  { title: 'Stars platform', desc: 'Stories from Braillers, dAIgnosis, CASMarine, DROGIN, and more.', tags: ['stars'] },
  { title: 'TEKNOFEST Kitchen', desc: 'A mini hands-on workshop simulating competition energy.', tags: ['kitchen'] },
  { title: 'Closing', desc: 'Kitchen finals and Ibtikar program launches.', tags: ['closing'] },
]

const highlightsTr = [
  { title: 'TEKNOFEST tanıtımı', desc: 'Festivale giriş ve yarışmaya başlama yolu.', tags: ['intro'] },
  { title: 'Yıldızlar platformu', desc: 'Braillers, dAIgnosis, CASMarine, DROGIN ve diğerleri.', tags: ['stars'] },
  { title: 'TEKNOFEST Mutfağı', desc: 'Yarışma ruhunu yansıtan mini atölye.', tags: ['kitchen'] },
  { title: 'Kapanış', desc: 'Mutfak finalleri ve İbtikar program duyuruları.', tags: ['closing'] },
]

export const archive2023: ArchiveDictionaries = {
  ar: {
    documentTitle: 'TAC 2023 — أرشيف مؤتمر تكنوفست بالعربي',
    metaDescription:
      'أرشيف النسخة الأولى من مؤتمر تكنوفست بالعربي — 4 نوفمبر 2023 في جامعة صباح الدين الزعيم، إسطنبول.',
    nav: {
      about: 'عن المؤتمر',
      program: 'البرنامج',
      highlights: 'المحتوى',
      speakers: 'المتحدّثون',
      gallery: 'معرض الصور',
      backTo2026: 'النسخة الحالية 2026',
      edition: 'TAC 2023',
    },
    hero: {
      badge: 'إسطنبول · 4 نوفمبر 2023',
      archived: 'أرشيف النسخة الأولى',
      titleTop: 'مؤتمر تكنوفست',
      titleBottom: 'بالعربي 2023',
      subtitle:
        'النسخة الأولى: فعالية علمية للطلاب الجامعيين العرب المهتمين بالتكنولوجيا والمشاركة في مسابقات التكنوفست.',
      viewHighlights: 'استعرض المحتوى',
      viewProgram: 'البرنامج',
      viewGallery: 'معرض الصور',
      city: 'المكان',
      cityValue: 'جامعة صباح الدين الزعيم، إسطنبول',
      dates: 'التاريخ',
      datesValue: '4 نوفمبر 2023',
      attendees: 'الحضور المستهدف',
      attendeesValue: '250 طالبًا وطالبة',
      days: 'المدّة',
      daysValue: 'يوم واحد · 09:00–19:30',
    },
    about: {
      label: 'عن المؤتمر',
      title: 'فليكن حلمك هو إنجازك',
      body: 'انطلقت النسخة الأولى في إسطنبول لزيادة معرفة الطلاب بنظام التكنوفست وكسر حواجزه عبر منصّة النجوم ومطبخ تكنوفست، بشراكة اتحاد الطلبة السوريين.',
      stats: [
        { value: '1', label: 'النسخة الأولى' },
        { value: '250', label: 'طالبًا مستهدفًا' },
        { value: '4', label: 'فقرات رئيسية' },
        { value: '1', label: 'يوم مكثّف' },
      ],
    },
    program: {
      label: 'البرنامج',
      title: 'جدول يوم 4 نوفمبر 2023',
      subtitle: 'من خطة المؤتمر وملف الضيوف — أوقات تقريبية.',
      items: programAr,
    },
    highlights: {
      label: 'المحتوى',
      title: 'فقرات النسخة الأولى',
      subtitle: 'تعريف، نجوم، مطبخ، وختام.',
      items: highlightsAr,
    },
    speakers: {
      label: 'المتحدّثون',
      title: 'نجوم المنصّة والفرق',
      subtitle: 'من خطة المؤتمر وقوائم مشاريع الطلاب — بدون صور شخصية في الأرشيف المحلي.',
      items: speakersAr,
    },
    gallery: {
      label: 'معرض الصور',
      title: 'لحظات من TAC 2023',
      subtitle: 'صور من أول نسخة في إسطنبول.',
    },
    cta: {
      title: 'النسخة الحالية قادمة',
      subtitle: 'تعرّف على برنامج TAC 2026 وسجّل في المسارات المفتوحة.',
      button: 'انتقل إلى TAC 2026',
    },
    footer: { dates: 'إسطنبول · 04.11.2023' },
  },
  en: {
    documentTitle: 'TAC 2023 — TEKNOFEST in Arabic archive',
    metaDescription:
      'Archive of the 1st TEKNOFEST in Arabic Conference — 4 November 2023 at Sabahattin Zaim University, Istanbul.',
    nav: {
      about: 'About',
      program: 'Program',
      highlights: 'Content',
      speakers: 'Speakers',
      gallery: 'Gallery',
      backTo2026: 'Current edition 2026',
      edition: 'TAC 2023',
    },
    hero: {
      badge: 'Istanbul · 4 November 2023',
      archived: '1st edition archive',
      titleTop: 'TEKNOFEST in Arabic',
      titleBottom: 'Conference 2023',
      subtitle:
        'The first edition: a scientific event for Arab university students interested in technology and TEKNOFEST competitions.',
      viewHighlights: 'View content',
      viewProgram: 'Program',
      viewGallery: 'Photo gallery',
      city: 'Venue',
      cityValue: 'Sabahattin Zaim University, Istanbul',
      dates: 'Date',
      datesValue: '4 November 2023',
      attendees: 'Target attendance',
      attendeesValue: '250 students',
      days: 'Duration',
      daysValue: 'One day · 09:00–19:30',
    },
    about: {
      label: 'About',
      title: 'Let your dream be your achievement',
      body: 'The first edition launched in Istanbul to deepen TEKNOFEST literacy through Stars talks and Kitchen workshops, with the Syrian Students Union.',
      stats: [
        { value: '1st', label: 'Edition' },
        { value: '250', label: 'Target students' },
        { value: '4', label: 'Main segments' },
        { value: '1', label: 'Intensive day' },
      ],
    },
    program: {
      label: 'Program',
      title: 'Schedule — 4 November 2023',
      subtitle: 'From the guest plan — approximate timings.',
      items: programEn,
    },
    highlights: {
      label: 'Content',
      title: 'First edition pillars',
      subtitle: 'Orientation, Stars, Kitchen, and closing.',
      items: highlightsEn,
    },
    speakers: {
      label: 'Speakers',
      title: 'Stars teams & voices',
      subtitle: 'From the conference plan and project roster — no dedicated headshots in the local archive.',
      items: speakersEn,
    },
    gallery: {
      label: 'Gallery',
      title: 'Moments from TAC 2023',
      subtitle: 'Photos from the first edition in Istanbul.',
    },
    cta: {
      title: 'The current edition awaits',
      subtitle: 'Explore the TAC 2026 program and open registration paths.',
      button: 'Go to TAC 2026',
    },
    footer: { dates: 'Istanbul · 04.11.2023' },
  },
  tr: {
    documentTitle: 'TAC 2023 — Arapça TEKNOFEST arşivi',
    metaDescription:
      '1. Arapça TEKNOFEST Konferansı arşivi — 4 Kasım 2023, Sabahattin Zaim Üniversitesi, İstanbul.',
    nav: {
      about: 'Hakkında',
      program: 'Program',
      highlights: 'İçerik',
      speakers: 'Konuşmacılar',
      gallery: 'Galeri',
      backTo2026: 'Güncel sürüm 2026',
      edition: 'TAC 2023',
    },
    hero: {
      badge: 'İstanbul · 4 Kasım 2023',
      archived: '1. sürüm arşivi',
      titleTop: 'Arapça TEKNOFEST',
      titleBottom: 'Konferansı 2023',
      subtitle:
        'İlk sürüm: teknolojiye ve TEKNOFEST yarışmalarına ilgi duyan Arap üniversite öğrencilerine yönelik bilimsel etkinlik.',
      viewHighlights: 'İçeriği gör',
      viewProgram: 'Program',
      viewGallery: 'Fotoğraf galerisi',
      city: 'Mekân',
      cityValue: 'Sabahattin Zaim Üniversitesi, İstanbul',
      dates: 'Tarih',
      datesValue: '4 Kasım 2023',
      attendees: 'Hedef katılım',
      attendeesValue: '250 öğrenci',
      days: 'Süre',
      daysValue: 'Bir gün · 09:00–19:30',
    },
    about: {
      label: 'Hakkında',
      title: 'Hayalin başarın olsun',
      body: 'İlk sürüm İstanbul’da Yıldız konuşmaları ve Mutfak atölyeleriyle TEKNOFEST okuryazarlığını artırmak için başladı — Suriyeli Öğrenciler Birliği iş birliğiyle.',
      stats: [
        { value: '1.', label: 'Sürüm' },
        { value: '250', label: 'Hedef öğrenci' },
        { value: '4', label: 'Ana bölüm' },
        { value: '1', label: 'Yoğun gün' },
      ],
    },
    program: {
      label: 'Program',
      title: 'Akış — 4 Kasım 2023',
      subtitle: 'Konuk planından — yaklaşık saatler.',
      items: programTr,
    },
    highlights: {
      label: 'İçerik',
      title: 'İlk sürümün sütunları',
      subtitle: 'Tanıtım, Yıldızlar, Mutfak ve kapanış.',
      items: highlightsTr,
    },
    speakers: {
      label: 'Konuşmacılar',
      title: 'Yıldız ekipler ve sesler',
      subtitle: 'Plan ve proje listelerinden — yerel arşivde ayrı portre yok.',
      items: speakersTr,
    },
    gallery: {
      label: 'Galeri',
      title: 'TAC 2023 anları',
      subtitle: 'İstanbul’daki ilk sürümden fotoğraflar.',
    },
    cta: {
      title: 'Güncel sürüm sizi bekliyor',
      subtitle: 'TAC 2026 programını inceleyin ve açık kayıt yollarını keşfedin.',
      button: 'TAC 2026’ya git',
    },
    footer: { dates: 'İstanbul · 04.11.2023' },
  },
}
