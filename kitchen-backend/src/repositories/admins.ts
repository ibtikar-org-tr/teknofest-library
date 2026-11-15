/** @deprecated Use repositories/staff.ts — local password admins were replaced by VMS kitchen_staff. */
export {
  listStaff as listAdmins,
  getStaffByMembershipNumber,
  upsertStaff as createAdmin,
  listProgramVersions,
  createProgramVersion,
} from './staff'
