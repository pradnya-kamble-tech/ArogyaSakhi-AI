// Secure authentication module with JWT and encrypted password storage
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '8h';

const DEFAULT_USERS = [
  { id: 'usr_001', username: 'pcw1', password: 'pcw123', name: 'Health Worker 1', role: 'PCW', facility: 'PHC Andheri' },
  { id: 'usr_002', username: 'pcw2', password: 'pcw123', name: 'Health Worker 2', role: 'PCW', facility: 'PHC Bandra' },
  { id: 'usr_003', username: 'doctor1', password: 'doc123', name: 'Dr. Sharma', role: 'DOCTOR', specialty: 'General Medicine', facility: 'District Hospital' },
  { id: 'usr_004', username: 'doctor2', password: 'doc123', name: 'Dr. Patel', role: 'DOCTOR', specialty: 'Pediatrics', facility: 'District Hospital' },
  { id: 'usr_005', username: 'specialist1', password: 'spec123', name: 'Dr. Mehta', role: 'SPECIALIST', specialty: 'Cardiology', facility: 'Medical College Hospital' },
  { id: 'usr_006', username: 'admin', password: 'admin123', name: 'System Admin', role: 'ADMIN', facility: 'Central Office' },
  { id: 'usr_007', username: 'auditor', password: 'audit123', name: 'Quality Auditor', role: 'AUDITOR', facility: 'Central Office' }
];

let usersDb = { users: [] };

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function isHashed(password) {
  return typeof password === 'string' && password.startsWith('$2a$');
}

function sanitizeUser(user) {
  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.passwordHash;
  return sanitized;
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      usersDb = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } else {
      usersDb = { users: DEFAULT_USERS };
      saveUsers();
    }

    usersDb.users = usersDb.users.map((user) => {
      if (user.password && !user.passwordHash) {
        user.passwordHash = hashPassword(user.password);
        delete user.password;
      }
      if (!user.passwordHash && user.password) {
        user.passwordHash = hashPassword(user.password);
      }
      return user;
    });
    saveUsers();
  } catch (e) {
    console.error('Failed to load users', e);
    usersDb = { users: DEFAULT_USERS.map((user) => ({ ...user, passwordHash: hashPassword(user.password), password: undefined })) };
    saveUsers();
  }
}

function saveUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersDb, null, 2), 'utf8');
  } catch (e) {
    console.warn('Persistence warning: Could not save users to local filesystem. User database will reset on next cold-start.', e.message);
  }
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function login(username, password) {
  const user = usersDb.users.find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash || '')) {
    return null;
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    facility: user.facility,
    specialty: user.specialty
  });

  return { token, user: sanitizeUser(user) };
}

function logout() {
  return true;
}

function validateToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function getUser(userId) {
  const user = usersDb.users.find((u) => u.id === userId);
  return user ? sanitizeUser(user) : null;
}

function getAllUsers() {
  return usersDb.users.map(sanitizeUser);
}

function createUser(userData) {
  const id = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const newUser = {
    id,
    username: userData.username,
    passwordHash: hashPassword(userData.password || 'default123'),
    name: userData.name || 'New User',
    role: userData.role || 'PCW',
    facility: userData.facility || '',
    specialty: userData.specialty || '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  usersDb.users.push(newUser);
  saveUsers();
  return sanitizeUser(newUser);
}

function updateUser(userId, updates) {
  const idx = usersDb.users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  const user = usersDb.users[idx];
  const allowed = ['name', 'password', 'role', 'facility', 'specialty', 'active'];
  allowed.forEach((field) => {
    if (updates[field] !== undefined) {
      if (field === 'password') {
        user.passwordHash = hashPassword(updates.password);
      } else {
        user[field] = updates[field];
      }
    }
  });
  user.updatedAt = new Date().toISOString();
  usersDb.users[idx] = user;
  saveUsers();
  return sanitizeUser(user);
}

function deleteUser(userId) {
  const idx = usersDb.users.findIndex((u) => u.id === userId);
  if (idx === -1) return false;
  usersDb.users.splice(idx, 1);
  saveUsers();
  return true;
}

function authMiddleware(requiredRoles = []) {
  return (req, res, next) => {
    const token = req.headers['x-auth-token'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = validateToken(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(session.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.user = session;
    next();
  };
}

loadUsers();

module.exports = {
  login,
  logout,
  validateToken,
  getUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  authMiddleware
};
