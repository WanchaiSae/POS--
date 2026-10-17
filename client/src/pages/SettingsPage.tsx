import { useEffect, useState } from 'react';
import { usePosStore } from '../store/usePosStore';
import { api, type ApiResponse } from '../api/client';
import { normalizePromptPayPhone } from '../utils/promptpay';
import type { User as PosUser } from '../types/pos';
import { ConfirmModal } from '../components/ConfirmModal';

export const SettingsPage = () => {
  const users = usePosStore((state) => state.users);
  const user = usePosStore((state) => state.user);
  const accessToken = usePosStore((state) => state.accessToken);
  const logout = usePosStore((state) => state.logout);
  const fetchUsers = usePosStore((state) => state.fetchUsers);
  const [promptPayPhone, setPromptPayPhone] = useState('');
  const [promptPayMessage, setPromptPayMessage] = useState('');
  const [savingPromptPay, setSavingPromptPay] = useState(false);
  const [userDraft, setUserDraft] = useState<{ id: number | null; name: string; role: string; pin_code: string } | null>(null);
  const [userError, setUserError] = useState('');
  const [userNotice, setUserNotice] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUser, setDeletingUser] = useState<PosUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [employeeView, setEmployeeView] = useState<'active' | 'inactive'>('active');
  useEffect(() => {
    void fetchUsers().then(() => setUserError('')).catch((error: unknown) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        logout();
        return;
      }
      setUserError(status === 403 ? 'เฉพาะผู้ดูแลระบบเท่านั้นที่ดูรายชื่อพนักงานได้' : 'โหลดรายชื่อพนักงานไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่');
    });
  }, [fetchUsers, logout]);
  useEffect(() => {
    if (user?.role !== 'admin') return;
    void api.get<ApiResponse<{ phone: string }>>('/settings/promptpay', { headers: { Authorization: `Bearer ${accessToken || ''}` } })
      .then((response) => setPromptPayPhone(response.data.data.phone))
      .catch(() => setPromptPayMessage('โหลดการตั้งค่าพร้อมเพย์ไม่สำเร็จ'));
  }, [user?.id, user?.role, accessToken]);

  if (user?.role !== 'admin') return <div className="rounded-2xl bg-white p-5 text-sm text-slate-500">ไม่มีสิทธิ์เข้าถึงหน้านี้</div>;

  const saveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userDraft) return;
    setSavingUser(true);
    setUserError('');
    setUserNotice('');
    try {
      const payload = {
        name: userDraft.name.trim(),
        role: userDraft.role,
        ...(userDraft.pin_code ? { pin_code: userDraft.pin_code } : {}),
      };
      const config = { headers: { Authorization: `Bearer ${accessToken || ''}` } };
      if (userDraft.id) await api.put(`/users/${userDraft.id}`, payload, config);
      else await api.post('/users', payload, config);
      await fetchUsers();
      setUserDraft(null);
      setUserNotice(userDraft.id ? 'บันทึกการแก้ไขพนักงานแล้ว' : 'เพิ่มพนักงานแล้ว');
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) { logout(); return; }
      setUserError(status === 409 ? 'PIN นี้ถูกใช้แล้ว กรุณากำหนด PIN อื่น' : status === 400 ? 'ตรวจสอบชื่อ บทบาท และ PIN ที่กรอกอีกครั้ง' : 'บันทึกข้อมูลพนักงานไม่สำเร็จ กรุณาลองใหม่');
    } finally { setSavingUser(false); }
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const response = await api.delete<ApiResponse<{ deactivated?: boolean }>>(`/users/${deletingUser.id}`, { headers: { Authorization: `Bearer ${accessToken || ''}` } });
      await fetchUsers();
      setDeletingUser(null);
      setEmployeeView('inactive');
      setUserNotice(response.data.data?.deactivated
        ? `ปิดบัญชี ${deletingUser.name} แล้ว โดยเก็บข้อมูลประวัติไว้ครบ`
        : `ลบพนักงาน ${deletingUser.name} แล้ว`);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) { logout(); return; }
      setUserError(status === 400 ? 'ไม่สามารถลบบัญชีนี้ได้' : 'ลบพนักงานไม่สำเร็จ กรุณาลองใหม่');
      setDeletingUser(null);
    } finally { setDeleting(false); }
  };

  const reactivateUser = async (employee: PosUser) => {
    setUserError('');
    setUserNotice('');
    try {
      await api.put(`/users/${employee.id}`, { is_active: true }, { headers: { Authorization: `Bearer ${accessToken || ''}` } });
      await fetchUsers();
      setEmployeeView('active');
      setUserNotice(`เปิดใช้งานบัญชี ${employee.name} แล้ว`);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) { logout(); return; }
      setUserError('เปิดใช้งานบัญชีไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const visibleEmployees = users.filter((employee) => employeeView === 'active' ? employee.is_active !== false : employee.is_active === false);

  return (
    <div className="space-y-4 overflow-auto">
      <form className="bg-white rounded-3xl border border-slate-100 p-5" onSubmit={async (event) => {
        event.preventDefault();
        setSavingPromptPay(true);
        setPromptPayMessage('');
        try {
          const phone = normalizePromptPayPhone(promptPayPhone);
          const response = await api.put<ApiResponse<{ phone: string }>>('/settings/promptpay', { phone }, { headers: { Authorization: `Bearer ${accessToken || ''}` } });
          setPromptPayPhone(response.data.data.phone);
          setPromptPayMessage(phone ? 'บันทึกเบอร์พร้อมเพย์แล้ว' : 'ปิดการใช้ QR พร้อมเพย์แล้ว');
        } catch (error) {
          const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
          setPromptPayMessage(message || 'บันทึกการตั้งค่าไม่สำเร็จ');
        } finally { setSavingPromptPay(false); }
      }}>
        <h3 className="font-bold mb-1">บัญชีรับเงินพร้อมเพย์</h3>
        <p className="text-sm text-slate-500 mb-4">กรอกเบอร์มือถือที่ลงทะเบียนพร้อมเพย์ QR ชำระเงินจะระบุบัญชีนี้และยอดขายให้อัตโนมัติ</p>
        <div className="flex flex-wrap gap-2">
          <input value={promptPayPhone} onChange={(event) => setPromptPayPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="0812345678" className="rounded-xl border border-slate-200 px-3 py-2 text-sm w-56" />
          <button type="submit" disabled={savingPromptPay} className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm disabled:opacity-50">{savingPromptPay ? 'กำลังบันทึก...' : 'บันทึกเบอร์'}</button>
          {promptPayPhone && <button type="button" disabled={savingPromptPay} onClick={() => setPromptPayPhone('')} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm">ล้างเบอร์</button>}
        </div>
        {promptPayMessage && <p role="status" className="text-sm mt-3 text-slate-600">{promptPayMessage}</p>}
      </form>
      <div className="bg-white rounded-3xl border border-slate-100 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">พนักงานและสิทธิ์</h3>{employeeView === 'active' && <button type="button" onClick={() => { setUserError(''); setUserDraft({ id: null, name: '', role: 'staff', pin_code: '' }); }} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">+ เพิ่มพนักงาน</button>}</div>
        <div className="mb-4 flex w-fit gap-1 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setEmployeeView('active')} className={employeeView === 'active' ? 'rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm' : 'rounded-lg px-3 py-2 text-xs font-medium text-slate-500'}>พนักงานที่ใช้งาน ({users.filter((employee) => employee.is_active !== false).length})</button><button type="button" onClick={() => setEmployeeView('inactive')} className={employeeView === 'inactive' ? 'rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm' : 'rounded-lg px-3 py-2 text-xs font-medium text-slate-500'}>ปิดบัญชีแล้ว ({users.filter((employee) => employee.is_active === false).length})</button></div>
        {userNotice && <p role="status" className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{userNotice}</p>}
        {userError && !userDraft && <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{userError}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs text-slate-500 border-b"><tr><th className="py-2">ชื่อ</th><th>บทบาท</th><th>สิทธิ์</th><th>สถานะ</th>{employeeView === 'inactive' && <th>วันที่ปิดบัญชี</th>}<th className="text-right">จัดการ</th></tr></thead>
          <tbody>{visibleEmployees.map((employee) => <tr key={employee.id} className="border-b border-slate-50"><td className="py-3 font-medium">{employee.name}{employee.id === user.id && <span className="ml-2 text-xs text-slate-400">(บัญชีคุณ)</span>}</td><td className="uppercase">{employee.role}</td><td className="text-xs text-slate-500">{employee.role === 'staff' ? 'ขายสินค้าและเปิด/ปิดกะ' : employee.role === 'manager' ? 'ขายสินค้า จัดการสินค้า และดูรายงาน' : 'สิทธิ์ผู้ดูแลระบบทั้งหมด'}{employeeView === 'inactive' && <span className="mt-1 block">ประวัติ {employee.shift_count || 0} กะ · {employee.order_count || 0} รายการขาย</span>}</td><td><span className={employee.is_active === false ? 'rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600' : 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700'}>{employee.is_active === false ? 'ปิดบัญชีแล้ว' : 'ใช้งาน'}</span></td>{employeeView === 'inactive' && <td className="whitespace-nowrap text-xs text-slate-500">{employee.deactivated_at || '—'}</td>}<td><div className="flex justify-end gap-2">{employeeView === 'active' ? <><button type="button" onClick={() => { setUserError(''); setUserDraft({ id: employee.id, name: employee.name, role: employee.role, pin_code: '' }); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">แก้ไข / ตั้ง PIN</button>{employee.id !== user.id && <button type="button" onClick={() => { setUserError(''); setDeletingUser(employee); }} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">ปิดบัญชี</button>}</> : <button type="button" onClick={() => void reactivateUser(employee)} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">เปิดใช้งาน</button>}</div></td></tr>)}
          {visibleEmployees.length === 0 && <tr><td colSpan={employeeView === 'inactive' ? 6 : 5} className="py-8 text-center text-slate-400">{employeeView === 'inactive' ? 'ยังไม่มีบัญชีที่ปิดใช้งาน' : 'ไม่พบพนักงานที่ใช้งานอยู่'}</td></tr>}</tbody>
        </table></div>
      </div>
      {userDraft && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingUser) setUserDraft(null); }}>
        <form onSubmit={(event) => void saveUser(event)} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
          <div><h3 className="text-lg font-bold">{userDraft.id ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงาน'}</h3><p className="mt-1 text-sm text-slate-500">กำหนดชื่อ บทบาท และ PIN สำหรับเข้าสู่ระบบ</p></div>
          <label className="block text-sm font-semibold text-slate-700">ชื่อพนักงาน<input autoFocus required maxLength={100} value={userDraft.name} onChange={(event) => setUserDraft({ ...userDraft, name: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal" placeholder="ชื่อที่ใช้แสดง" /></label>
          <label className="block text-sm font-semibold text-slate-700">บทบาท<select value={userDraft.role} onChange={(event) => setUserDraft({ ...userDraft, role: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"><option value="staff">พนักงาน</option><option value="manager">ผู้จัดการ</option><option value="admin">ผู้ดูแลระบบ</option></select></label>
          <label className="block text-sm font-semibold text-slate-700">PIN {userDraft.id ? '(เว้นว่างหากไม่ต้องการเปลี่ยน)' : ''}<input required={!userDraft.id} inputMode="numeric" pattern="[0-9]{4,6}" minLength={4} maxLength={6} value={userDraft.pin_code} onChange={(event) => setUserDraft({ ...userDraft, pin_code: event.target.value.replace(/\D/g, '').slice(0, 6) })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal tracking-[0.3em]" placeholder={userDraft.id ? 'PIN ใหม่ 4–6 หลัก' : 'ตัวเลข 4–6 หลัก'} /></label>
          <p className="-mt-2 text-xs text-slate-400">PIN ต้องไม่ซ้ำกับบัญชีพนักงานคนอื่น</p>
          {userError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{userError}</p>}
          <div className="flex gap-2 pt-1"><button type="button" disabled={savingUser} onClick={() => setUserDraft(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">ยกเลิก</button><button type="submit" disabled={savingUser} className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{savingUser ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button></div>
        </form>
      </div>}
      {deletingUser && <ConfirmModal title="ยืนยันการปิดบัญชีพนักงาน" description={`ปิดบัญชี ${deletingUser.name} ใช่หรือไม่? พนักงานจะเข้าสู่ระบบไม่ได้ แต่ประวัติกะและรายการขายเดิมจะยังอยู่ครบ`} confirmLabel="ปิดบัญชี" onConfirm={() => void confirmDeleteUser()} onCancel={() => setDeletingUser(null)} busy={deleting} />}
    </div>
  );
};
