import { useEffect, useState } from 'react';
import { usePosStore } from '../store/usePosStore';

export const CustomersPage = () => {
  const customers = usePosStore((s) => s.customers);
  const fetchCustomers = usePosStore((s) => s.fetchCustomers);
  const registerCustomer = usePosStore((s) => s.registerCustomer);
  const error = usePosStore((s) => s.error);
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const normalizedPhone = phone.replace(/\D/g, '');

  return (
    <div className="space-y-4 overflow-auto">
      <div className="bg-white rounded-3xl border border-slate-100 p-5">
        <h3 className="font-bold mb-3">สมัครสมาชิก</h3>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={async (event) => {
          event.preventDefault();
          if (normalizedPhone.length < 9 || normalizedPhone.length > 15) return;
          const created = await registerCustomer({ phone_number: normalizedPhone, first_name: firstName.trim(), last_name: lastName.trim() });
          if (created) {
            setPhone('');
            setFirstName('');
            setLastName('');
          }
        }}>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="numeric" autoComplete="tel" maxLength={20} placeholder="เบอร์โทรศัพท์" aria-label="เบอร์โทรศัพท์" required className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="ชื่อ" aria-label="ชื่อ" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="นามสกุล" aria-label="นามสกุล" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <button disabled={normalizedPhone.length < 9 || normalizedPhone.length > 15} className="rounded-xl bg-orange-500 text-white font-bold text-sm py-2 disabled:opacity-40">บันทึกสมาชิก</button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
          <h3 className="font-bold">รายชื่อลูกค้า</h3>
          <input value={search} onChange={(event) => {
            setSearch(event.target.value);
            void fetchCustomers(event.target.value);
          }} placeholder="ค้นหาเบอร์โทร" aria-label="ค้นหาเบอร์โทร" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm sm:w-48" />
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs text-slate-500 border-b">
            <tr><th className="py-2">เบอร์โทร</th><th>ชื่อ</th><th>แต้ม</th><th>ระดับ</th></tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-slate-50">
                <td className="py-2 font-semibold">{customer.phone_number}</td>
                <td>{customer.first_name} {customer.last_name}</td>
                <td>{customer.points}</td>
                <td>{customer.tier}</td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-400">ยังไม่มีข้อมูลสมาชิก</td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  );
};
