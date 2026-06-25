import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNativeAuth } from '../contexts/NativeAuthContext';
import LoadingScreen from '../components/ui/LoadingScreen';

interface ProtectedRouteProps {
  requireSuperAdmin?: boolean;
  requirePremium?: boolean;
  requireEnterprise?: boolean;
  requireBiometric?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireSuperAdmin = false,
  requirePremium = false,
  requireEnterprise = false,
  requireBiometric = false,
}) => {
  const { user, isSuperAdmin, organization } = useAuth();
  const { requireBiometric: triggerBiometric } = useNativeAuth();
  const location = useLocation();
  const [biometricVerified, setBiometricVerified] = useState(!requireBiometric);

  // Derive plan from context
  const activePlan = organization?.subscriptionTier || 'trial';
  const isPremium = activePlan === 'professional' || activePlan === 'enterprise' || activePlan === 'trial';
  const isEnterprise = activePlan === 'enterprise' || activePlan === 'trial';

  useEffect(() => {
    if (requireBiometric && !biometricVerified) {
      triggerBiometric(`Access ${location.pathname}`).then((success) => {
        if (success) {
          setBiometricVerified(true);
        }
      });
    }
  }, [requireBiometric, biometricVerified, triggerBiometric, location.pathname]);

  if (!user) {
    // Should ideally be handled at App root, but safe guard here
    return <Navigate to="/" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requirePremium && !isPremium) {
    return <Navigate to="/subscription-hub" replace />;
  }

  if (requireEnterprise && !isEnterprise) {
    return <Navigate to="/subscription-hub" replace />;
  }

  if (requireBiometric && !biometricVerified) {
    return <LoadingScreen message="Waiting for biometric authentication..." />;
  }

  const context = useOutletContext();
  return <Outlet context={context} />;
};
