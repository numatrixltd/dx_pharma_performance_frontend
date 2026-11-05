'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import { EmptyState, PageSkeleton } from '@/components/ui/States';
import BulkData from '@/components/employees/BulkData';
import BulkPhotos from '@/components/employees/BulkPhotos';

export default function BulkEmployeesPage() {
  const { can } = useAuth();
  const [tab, setTab] = useState('data');
  const outlets = useApi('/outlets');

  if (!can.canManageEmployees) return <EmptyState title="Admins only" message="Only an admin can add or update employees in bulk." />;
  const active = (outlets.data || []).filter((o) => o.isActive);

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Bulk employees"
        subtitle="Add or update many employees at once with all their data: name, designation, outlet, category, targets, phone and status. Then add their photos in one go."
        actions={<Link href="/employees"><Button><ArrowLeft size={15} /> Back to employees</Button></Link>}
      />
      <div className="mb-5"><Tabs options={[{ value: 'data', label: 'Employee data' }, { value: 'photos', label: 'Photos' }]} value={tab} onChange={setTab} /></div>
      {!outlets.data ? <PageSkeleton /> : tab === 'data' ? <BulkData outlets={active} /> : <BulkPhotos />}
    </div>
  );
}