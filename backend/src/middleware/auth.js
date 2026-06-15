const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'proman-super-secret-key-12345';

// 1. Authenticate JWT token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Access token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// 2. Authorize Roles (e.g. ['ADMIN', 'PROJECT_MANAGER'])
// Map: 'super_admin' request maps to role check on 'ADMIN'
const requireRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: You do not have the required permissions' });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  requireRoles
};
