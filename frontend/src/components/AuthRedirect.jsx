import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AuthRedirect = ({ children }) => {
  const { profile } = useSelector((state) => state.user);
  
  if (profile) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AuthRedirect;
