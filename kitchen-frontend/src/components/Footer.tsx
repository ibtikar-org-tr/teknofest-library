import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-teknofest-dark-blue border-t border-teknofest-light-blue/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo size="md" />
              <div>
                <h2 className="text-xl font-bold text-white">مطبخ تكنوفيست</h2>
                <p className="text-sm text-teknofest-cyan">TEKNOFEST</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed">
              منصة لمساعدتك لتعيش تجربة حقيقية لمسابقات تكنوفيست. نهدف إلى دعم المبتكرين والمبدعين في مختلف المجالات التقنية.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-teknofest-orange transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/register/team" className="text-gray-400 hover:text-teknofest-orange transition-colors">
                  تسجيل فريق
                </Link>
              </li>
              <li>
                <Link to="/register/individual" className="text-gray-400 hover:text-teknofest-orange transition-colors">
                  تسجيل فردي
                </Link>
              </li>
              <li>
                <Link to="/top-teams" className="text-gray-400 hover:text-teknofest-orange transition-colors">
                  أفضل الفرق
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-teknofest-light-blue/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} مطبخ تكنوفيست. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-500 hover:text-teknofest-orange transition-colors text-sm">
              سياسة الخصوصية
            </a>
            <a href="#" className="text-gray-500 hover:text-teknofest-orange transition-colors text-sm">
              الشروط والأحكام
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
