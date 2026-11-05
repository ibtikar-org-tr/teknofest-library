const WHATSAPP_NUMBER = '905057371422'
const REGISTER_TEXT = encodeURIComponent(
  'مرحبا، أود التسجيل في مؤتمر تكنوفست بالعربي 2026',
)

export const LINKS = {
  register: `https://wa.me/${WHATSAPP_NUMBER}?text=${REGISTER_TEXT}`,
  telegramChannel: 'https://t.me/ibtikar_org',
  telegramContact: 'https://t.me/ibtikar_org_tr',
  bylaws: 'https://github.com/ibtikar-org-tr/bylaws',
  github: 'https://github.com/ibtikar-org-tr',
  instagram: 'https://www.instagram.com/ibtikar.org.tr',
  linkedin: 'https://www.linkedin.com/company/ibtikar-org-tr',
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`,
  email: 'mailto:relations@ibtikar.org.tr',
  lms: 'https://lms.ibtikar.org.tr',
  assembly: 'https://ibtikar.tr',
  saae: 'https://aisyria.org/',
} as const
