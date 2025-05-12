import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AuthRedirect = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  console.log('AuthRedirect: isAuthenticated:', isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AuthRedirect;