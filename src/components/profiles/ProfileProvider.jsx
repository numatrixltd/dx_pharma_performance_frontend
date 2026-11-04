'use client';
import { useCallback, useMemo, useState } from 'react';
import { ProfileContext } from '@/context/ProfileContext';
import Employee360Modal from './Employee360';
import Outlet360Modal from './Outlet360';

export default function ProfileProvider({ children }) {
  const [emp, setEmp] = useState(null);
  const [out, setOut] = useState(null);
  const openEmployee = useCallback((id) => { setOut(null); setEmp(id); }, []);
  const openOutlet = useCallback((id) => { setEmp(null); setOut(id); }, []);
  const value = useMemo(() => ({ openEmployee, openOutlet }), [openEmployee, openOutlet]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
      <Employee360Modal id={emp} onClose={() => setEmp(null)} />
      <Outlet360Modal id={out} onClose={() => setOut(null)} />
    </ProfileContext.Provider>
  );
}