import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  Users,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  Scale,
} from 'lucide-react'
import { adminService } from '../../services/api'
import type { Admin } from '../../types'

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [weights, setWeights] = useState<Record<string, number>>({})
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminsData, superAdminCheck] = await Promise.all([
          adminService.getAll(),
          adminService.checkSuperAdmin(),
        ])
        setAdmins(adminsData)
        setIsSuperAdmin(superAdminCheck.is_super_admin)

        const initialWeights: Record<string, number> = {}
        adminsData.forEach((admin) => {
          if (admin.membership_number) {
            initialWeights[admin.membership_number] = admin.evaluation_weight
          }
        })
        setWeights(initialWeights)
      } catch {
        toast.error('حدث خطأ في تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleWeightChange = (membershipNumber: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [membershipNumber]: value,
    }))
  }

  const handleSaveWeight = async (membershipNumber: string) => {
    const weight = weights[membershipNumber]
    if (weight < 0 || weight > 100) {
      toast.error('الوزن يجب أن يكون بين 0 و 100')
      return
    }

    setSaving(membershipNumber)
    try {
      await adminService.updateWeight(membershipNumber, weight)
      toast.success('تم تحديث الوزن بنجاح')

      setAdmins((prev) =>
        prev.map((admin) =>
          admin.membership_number === membershipNumber
            ? { ...admin, evaluation_weight: weight }
            : admin,
        ),
      )
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'حدث خطأ في تحديث الوزن')
    } finally {
      setSaving(null)
    }
  }

  const nonSuperAdmins = admins.filter((a) => !a.is_superadmin)
  const totalWeight = nonSuperAdmins.reduce(
    (sum, admin) => sum + (weights[admin.membership_number] || 0),
    0,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-teknofest-orange animate-spin" />
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="card text-center py-12">
        <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">غير مصرح</h2>
        <p className="text-gray-400">هذه الصفحة متاحة فقط للمدير الأعلى</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة الإداريين</h1>
          <p className="text-gray-400">تعديل أوزان تقييمات الإداريين (عضوية VMS)</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg">
          <Shield className="w-5 h-5" />
          <span className="font-medium">المدير الأعلى</span>
        </div>
      </div>

      <div className="card bg-teknofest-dark-blue/50 border border-teknofest-light-blue/20">
        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 text-teknofest-cyan mt-1" />
          <div className="text-sm">
            <p className="text-white font-medium mb-1">نظام الأوزان</p>
            <ul className="text-gray-400 space-y-1">
              <li>
                • تقييمات جميع الإداريين تشكل مجتمعة{' '}
                <span className="text-teknofest-orange font-bold">75%</span> من التقييم النهائي
              </li>
              <li>
                • كل إداري يقيّم من <span className="text-green-400 font-bold">75 نقطة</span>
              </li>
              <li>• الأوزان تحدد نسبة مساهمة كل إداري في المتوسط المرجح</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-medium">مجموع الأوزان:</span>
          </div>
          <span
            className={`text-2xl font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-red-400'}`}
          >
            {totalWeight}%
          </span>
        </div>
        {totalWeight !== 100 && (
          <p className="text-yellow-400 text-sm mt-2">
            يُنصح بأن يكون مجموع الأوزان 100% للحصول على نتائج متوازنة
          </p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          الإداريون ({nonSuperAdmins.length})
        </h2>

        {nonSuperAdmins.length === 0 ? (
          <div className="card text-center py-8">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">لا يوجد إداريون آخرون</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {nonSuperAdmins.map((admin) => (
              <div key={admin.membership_number} className="card">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teknofest-medium-blue rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-teknofest-cyan" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{admin.full_name}</h3>
                      <p className="text-gray-400 text-sm">
                        {admin.membership_number} • {admin.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 lg:w-64">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">وزن التقييم</span>
                        <span className="text-xl font-bold text-teknofest-orange">
                          {weights[admin.membership_number]}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={weights[admin.membership_number] || 0}
                        onChange={(e) =>
                          handleWeightChange(admin.membership_number, Number(e.target.value))
                        }
                        className="w-full h-2 bg-teknofest-medium-blue rounded-lg appearance-none cursor-pointer accent-teknofest-orange"
                      />
                    </div>

                    <button
                      onClick={() => handleSaveWeight(admin.membership_number)}
                      disabled={
                        saving === admin.membership_number ||
                        weights[admin.membership_number] === admin.evaluation_weight
                      }
                      className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving === admin.membership_number ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      حفظ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
