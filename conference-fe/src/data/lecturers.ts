export type LecturerId =
  | 'batoul-albairaq'
  | 'tala-hajjeh'
  | 'subhi-abdulaziz'
  | 'abdulrazzaq-sabb'
  | 'hussain-abdullatif'
  | 'abdulrahman-tulimat'
  | 'mustafa-kayyali'
  | 'tasneem-batheesh'
  | 'reem-obeido'
  | 'joseph-shankaji'
  | 'heba-hariri'
  | 'masa-sudan'
  | 'nour-berakdar'
  | 'amir-jabban'
  | 'osama-awwad'
  | 'aya-alaswad'
  | 'ghyath-moussa'
  | 'alaa-maidani'
  | 'hasan-balleh'
  | 'iqbal-boushi'

export const LECTURER_PHOTOS: Partial<Record<LecturerId, string>> = {
  'batoul-albairaq': '/lecturers/batoul-albairaq.jpg',
  'subhi-abdulaziz': '/lecturers/subhi-abdulaziz.jpg',
  'abdulrazzaq-sabb': '/lecturers/abdulrazzaq-sabb.jpg',
  'hussain-abdullatif': '/lecturers/hussain-abdullatif.jpg',
  'abdulrahman-tulimat': '/lecturers/abdulrahman-tulimat.jpg',
  'mustafa-kayyali': '/lecturers/mustafa-kayyali.jpg',
  'tasneem-batheesh': '/lecturers/tasneem-batheesh.jpg',
  'reem-obeido': '/lecturers/reem-obeido.jpg',
  'joseph-shankaji': '/lecturers/joseph-shankaji.jpg',
  'amir-jabban': '/lecturers/amir-jabban.jpg',
  'nour-berakdar': '/lecturers/nour-berakdar.jpg',
  'hasan-balleh': '/lecturers/hasan-balleh.jpg',
  'osama-awwad': '/lecturers/osama-awwad.jpg',
  'masa-sudan': '/lecturers/masa-sudan.jpg',
}

export const LECTURER_PHOTO_POSITION: Partial<Record<LecturerId, string>> = {
  'batoul-albairaq': 'object-top',
  'reem-obeido': 'object-[center_30%]',
  'masa-sudan': 'object-[center_18%]',
  'osama-awwad': 'object-[center_20%]',
  'hussain-abdullatif': 'object-center',
  'abdulrahman-tulimat': 'object-[center_18%]',
}
