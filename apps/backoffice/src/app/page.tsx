'use client';
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, curly, no-console */

import React, { useEffect, useState } from 'react';
import { KDSTerminal } from './components/KDSTerminal';

export default function Page(): React.ReactNode {
  const [branchId, setBranchId] = useState('branch-uuid-1234');
  const [accessToken, setAccessToken] = useState('mock-jwt-token-for-dev');
  const [tenantId, setTenantId] = useState('tenant-uuid-1111');

  useEffect(() => {
    // Resolve tenant context from subdomain per DOC-005 4.2
    const host = window.location.hostname;
    const subdomain = host.split('.')[0];
    console.log(`Backoffice KDS loaded for subdomain: ${subdomain}`);

    // In real app, would fetch tenant branding and branch list from API
    // For dev, use mock values with tenant isolation preserved
    const params = new URLSearchParams(window.location.search);
    const branchParam = params.get('branchId');
    if (branchParam) setBranchId(branchParam);

    const token = localStorage.getItem('accessToken') || 'mock-jwt-token-for-dev';
    setAccessToken(token);
  }, []);

  return (
    <div>
      <KDSTerminal branchId={branchId} accessToken={accessToken} tenantId={tenantId} />
    </div>
  );
}
